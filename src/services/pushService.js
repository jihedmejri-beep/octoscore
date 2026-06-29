import api from "./api";

// Browser push (Web Push) helper. Talks to /api/push on the backend and the
// service worker registered by vite-plugin-pwa.

export const pushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

// VAPID public keys are URL-safe base64; the PushManager needs a Uint8Array.
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

async function getRegistration() {
  // The PWA plugin registers the SW; wait until it's active.
  return navigator.serviceWorker.ready;
}

// Is this browser currently subscribed?
export async function isSubscribed() {
  if (!pushSupported()) return false;
  try {
    const reg = await getRegistration();
    return Boolean(await reg.pushManager.getSubscription());
  } catch {
    return false;
  }
}

// Enable notifications: ask permission, subscribe, and register on the server.
// Returns { ok } or { ok:false, reason }.
export async function enablePush() {
  if (!pushSupported()) return { ok: false, reason: "unsupported" };

  const { data } = await api.get("/push/public-key");
  if (!data?.enabled || !data?.key) return { ok: false, reason: "unconfigured" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "denied" };

  const reg = await getRegistration();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.key),
    });
  }
  await api.post("/push/subscribe", { subscription: sub.toJSON() });
  return { ok: true };
}

// Disable notifications: unsubscribe locally and remove from the server.
export async function disablePush() {
  if (!pushSupported()) return { ok: true };
  const reg = await getRegistration();
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    const { endpoint } = sub;
    await sub.unsubscribe().catch(() => {});
    await api.post("/push/unsubscribe", { endpoint }).catch(() => {});
  }
  return { ok: true };
}
