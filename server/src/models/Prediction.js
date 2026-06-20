import mongoose from "mongoose";
import { idTransform } from "./_transform.js";

// One user's match-outcome pick (home win / draw / away win) for one match.
// A user has at most one prediction per match (enforced by the unique compound
// index); submitting again updates it.
const predictionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    match: { type: String, required: true }, // Match._id is a readable String ("m…")
    pick: { type: String, enum: ["home", "draw", "away"], required: true },
    // Set once when the match finishes and XP is granted (keeps settlement
    // idempotent — a prediction is never rewarded twice).
    settled: { type: Boolean, default: false },
    awardedXp: { type: Number, default: null },
  },
  { timestamps: true }
);

predictionSchema.index({ user: 1, match: 1 }, { unique: true });
predictionSchema.index({ match: 1 });

predictionSchema.set("toJSON", idTransform);

export default mongoose.model("Prediction", predictionSchema);
