import mongoose from "mongoose";
import { idTransform, prefixedId } from "./_transform.js";

// One squad member. role distinguishes pitch players from the bench sub and the
// coach so the whole roster lives in a single collection.
const playerSchema = new mongoose.Schema(
  {
    _id: { type: String, default: prefixedId("p") },
    teamId: { type: String, required: true, index: true },
    role: { type: String, enum: ["player", "sub", "coach"], default: "player" },
    number: { type: Number, default: null },
    first: { type: String, required: true, trim: true },
    last: { type: String, required: true, trim: true },
    pos: { type: String, default: "" }, // GK / DEF / MID / FWD / SUB
    slot: { type: String, default: "" }, // GK / LB / RB / LM / CM / RM / ST
    x: { type: Number, default: null }, // pitch position %
    y: { type: Number, default: null },
    goals: { type: Number, default: 0 },
    // Discipline tallies — kept by hand from the admin panel (unlike goals,
    // which are derived from match scorers).
    yellowCards: { type: Number, default: 0, min: 0 },
    redCards: { type: Number, default: 0, min: 0 },
    isCaptain: { type: Boolean, default: false },
    instagram: { type: String, default: "" },
    facebook: { type: String, default: "" },
    photo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

// Leaderboard query: find scorers, sort by goals desc.
playerSchema.index({ goals: -1 });

playerSchema.set("toJSON", idTransform);

export default mongoose.model("Player", playerSchema);
