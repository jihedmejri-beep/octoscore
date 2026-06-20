import Prediction from "../models/Prediction.js";
import Match from "../models/Match.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const PICKS = ["home", "draw", "away"];
const outcome = (h, a) => (h > a ? "home" : h < a ? "away" : "draw");

// XP reward for picking the correct match outcome (W / D / L).
export const XP_CORRECT = 25;

// Grant XP to everyone who picked the right outcome of a now-finished match.
// Idempotent: only unsettled predictions are processed, so re-running (or a
// later score edit) never double-awards. Call this when a match finishes.
export async function settleMatchPredictions(match) {
  if (!match || match.status !== "finished") return;
  if (match.homeScore == null || match.awayScore == null) return;

  const actual = outcome(match.homeScore, match.awayScore);
  const preds = await Prediction.find({ match: match._id, settled: { $ne: true } });
  if (preds.length === 0) return;

  const predOps = [];
  const userOps = [];
  for (const p of preds) {
    const xp = p.pick === actual ? XP_CORRECT : 0;
    predOps.push({
      updateOne: { filter: { _id: p._id }, update: { settled: true, awardedXp: xp } },
    });
    if (xp > 0) {
      userOps.push({ updateOne: { filter: { _id: p.user }, update: { $inc: { xp } } } });
    }
  }

  await Prediction.bulkWrite(predOps);
  if (userOps.length) await User.bulkWrite(userOps);
}

// POST /api/matches/:id/predict  (protected) — create or update the caller's
// outcome pick for a match.
export const upsertPrediction = asyncHandler(async (req, res) => {
  const matchId = req.params.id;
  const match = await Match.findById(matchId);
  if (!match) throw new ApiError(404, "Match not found");
  if (match.status === "finished")
    throw new ApiError(400, "This match has already finished — predictions are closed");

  const { pick } = req.body;
  if (!PICKS.includes(pick))
    throw new ApiError(400, "Pick must be one of: home, draw, away");

  const prediction = await Prediction.findOneAndUpdate(
    { user: req.user._id, match: matchId },
    { pick },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
  res.status(201).json(prediction);
});

// GET /api/matches/:id/prediction/me  (protected) — the caller's prediction, or null.
export const getMyPrediction = asyncHandler(async (req, res) => {
  const prediction = await Prediction.findOne({ user: req.user._id, match: req.params.id });
  res.json(prediction || null);
});

// GET /api/matches/:id/predictions  (public) — aggregated community stats.
export const getPredictionStats = asyncHandler(async (req, res) => {
  const preds = await Prediction.find({ match: req.params.id }).select("pick").lean();

  const counts = { home: 0, draw: 0, away: 0 };
  for (const p of preds) {
    if (counts[p.pick] !== undefined) counts[p.pick] += 1;
  }
  const total = counts.home + counts.draw + counts.away;

  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  res.json({
    total,
    home: counts.home,
    draw: counts.draw,
    away: counts.away,
    homePct: pct(counts.home),
    drawPct: pct(counts.draw),
    awayPct: pct(counts.away),
  });
});
