import PushSubscription from "../models/PushSubscription.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { pushReady, getPublicKey } from "../services/pushNotifications.js";

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
