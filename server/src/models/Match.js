import mongoose from "mongoose";
import { idTransform, prefixedId } from "./_transform.js";

const h2hSchema = new mongoose.Schema(
  {
    date: { type: Date },
    homeId: { type: String },
    awayId: { type: String },
    homeScore: { type: Number },
    awayScore: { type: Number },
  },
  { _id: false }
);

// Goals scored by individual players in this match. Drives the goal-ball
// markers shown next to scorers in the lineup.
const scorerSchema = new mongoose.Schema(
  {
    playerId: { type: String, required: true }, // Player._id ("p…")
    goals: { type: Number, default: 1, min: 1, max: 20 },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    _id: { type: String, default: prefixedId("m") },
    homeTeamId: { type: String, required: true },
    awayTeamId: { type: String, required: true },
    group: { type: String, required: true }, // "A" / "B" / "FINAL"
    round: { type: String, default: "" }, // QF / SF / GRAND FINAL ...
    leg: { type: String, default: "" }, // home_leg / away_leg / final
    status: {
      type: String,
      enum: ["upcoming", "live", "finished"],
      default: "upcoming",
    },
    minute: { type: Number, default: null },
    homeScore: { type: Number, default: null },
    awayScore: { type: Number, default: null },
    date: { type: Date, required: true },
    location: { type: String, default: "" },
    liveLink: { type: String, default: null },
    prediction: {
      homeWin: { type: Number, default: 33 },
      draw: { type: Number, default: 34 },
      awayWin: { type: Number, default: 33 },
    },
    h2h: { type: [h2hSchema], default: [] },
    scorers: { type: [scorerSchema], default: [] },
  },
  { timestamps: true }
);

// Indexes for the public read queries: filter by group/status, sort by date.
matchSchema.index({ date: 1 });
matchSchema.index({ status: 1, date: 1 });
matchSchema.index({ group: 1, date: 1 });

matchSchema.set("toJSON", idTransform);

export default mongoose.model("Match", matchSchema);
