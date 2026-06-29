import mongoose from "mongoose";
import { idTransform, prefixedId } from "./_transform.js";

// A single browser/device push subscription. Anonymous — anyone who enables
// notifications gets every match event, so these aren't tied to a user account.
const pushSubscriptionSchema = new mongoose.Schema(
  {
    _id: { type: String, default: prefixedId("push") },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true }
);

pushSubscriptionSchema.set("toJSON", idTransform);

export default mongoose.model("PushSubscription", pushSubscriptionSchema);
