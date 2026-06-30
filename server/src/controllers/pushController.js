import PushSubscription from "../models/PushSubscription.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { pushReady, getPublicKey, sendToAll } from "../services/pushNotifications.js";

// GET /api/push/public-key — the VAPID public key the browser needs to
// subscribe. Returns enabled:false when notifications aren't configured.
export const publicKey = asyncHandler(async (req, res) => {
  res.json({ enabled: pushReady(), key: getPublicKey() });
});

// POST /api/push/subscribe — store (or refresh) a browser push subscription.
export const subscribe = asyncHandler(async (req, res) => {
  const sub = req.body?.subscription || req.body;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    throw new ApiError(400, "Invalid push subscription");
  }
  await PushSubscription.findOneAndUpdate(
    { endpoint: sub.endpoint },
    { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.status(201).json({ ok: true });
});

// POST /api/push/unsubscribe — remove a subscription by endpoint.
export const unsubscribe = asyncHandler(async (req, res) => {
  const endpoint = req.body?.endpoint;
  if (!endpoint) throw new ApiError(400, "endpoint is required");
  await PushSubscription.deleteOne({ endpoint });
  res.json({ ok: true });
});

// POST /api/push/test (admin) — fire a sample notification to every subscriber,
// so the admin can verify push works without editing a real match.
export const sendTest = asyncHandler(async (req, res) => {
  if (!pushReady()) {
    throw new ApiError(503, "Push notifications are not configured (missing VAPID keys)");
  }
  const total = await PushSubscription.estimatedDocumentCount();
  const sent = await sendToAll({
    title: "🔔 OctoScore test",
    body: "Notifications are working — you're all set for match alerts.",
    url: "/",
    tag: "octoscore-test",
  });
  res.json({ ok: true, total, sent });
});

// POST /api/push/send (admin) — compose and broadcast a custom notification to
// every subscriber. A unique tag per send means messages don't collapse into
// one another on the device.
export const sendCustom = asyncHandler(async (req, res) => {
  if (!pushReady()) {
    throw new ApiError(503, "Push notifications are not configured (missing VAPID keys)");
  }
  const title = (req.body?.title || "").trim();
  const body = (req.body?.body || "").trim();
  const url = (req.body?.url || "").trim() || "/";
  if (!title || !body) throw new ApiError(400, "Title and message are required");

  const total = await PushSubscription.estimatedDocumentCount();
  const sent = await sendToAll({ title, body, url, tag: `octoscore-${Date.now()}` });
  res.json({ ok: true, total, sent });
});
