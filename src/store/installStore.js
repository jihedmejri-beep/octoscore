import { create } from "zustand";

// iOS Safari never fires `beforeinstallprompt` and offers no programmatic
// install — the only path is the manual "Share → Add to Home Screen". We detect
// it so we can show the steps instead of a dead install button.
const isIOS = () =>
  typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

// Already launched as an installed app? Covers the standard display-mode signal
// and the iOS-only navigator.standalone flag.
const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true);

// Shared "Add to Home Screen" state. Kept in a store (not local component state)
// because the browser fires `beforeinstallprompt` once, early — we capture it at
// import time below — and several surfaces may want to reflect install status.
// Note: dismissal is intentionally NOT persisted, so the prompt returns on every
// refresh / open (it only stays hidden once the app is actually installed).
export const useInstallStore = create((set, get) => ({
  deferred: null, // the captured beforeinstallprompt event (Chromium only)
  canInstall: false, // a native install prompt is ready to fire
  isIOS: isIOS(),
  installed: isStandalone(),
  dismissed: false, // hidden for this page load only — resets on reload

  // Fire the native install dialog and report the user's choice
  // ("accepted" | "dismissed" | "unavailable").
  async promptInstall() {
    const e = get().deferred;
    if (!e) return "unavailable";
    e.prompt();
    const choice = await e.userChoice.catch(() => ({ outcome: "dismissed" }));
    set({ deferred: null, canInstall: false });
    if (choice.outcome === "accepted") set({ installed: true });
    return choice.outcome;
  },

  // The user closed our banner — hide it for this page load only. We deliberately
  // don't persist this, so the prompt comes back on the next refresh / open.
  dismiss() {
    set({ dismissed: true });
  },
}));

// Wire the browser events exactly once, at module-eval time. This runs while the
// import graph resolves — before React renders — so we don't miss an early
// `beforeinstallprompt` (which some browsers dispatch before the app mounts).
let wired = false;
function wireInstallEvents() {
  if (wired || typeof window === "undefined") return;
  wired = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // suppress Chrome's default mini-infobar; we show our own
    useInstallStore.setState({ deferred: e, canInstall: true });
  });
  window.addEventListener("appinstalled", () => {
    useInstallStore.setState({ deferred: null, canInstall: false, installed: true });
  });
}
wireInstallEvents();
