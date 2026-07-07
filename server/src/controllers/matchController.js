import Match from "../models/Match.js";
import Player from "../models/Player.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { settleMatchPredictions } from "./predictionController.js";
import { notifyMatchEvents } from "../services/pushNotifications.js";

// Snapshot the fields that drive notifications, so we can diff before/after.
const eventSnapshot = (m) => ({
  status: m?.status,
  homeScore: m?.homeScore,
  awayScore: m?.awayScore,
});

// Award prediction XP when a match is finished; never let it break the response.
async function trySettle(match) {
  try {
    await settleMatchPredictions(match);
  } catch (err) {
    console.error("Prediction settlement failed:", err.message);
  }
}

const scorerIds = (match) => (match?.scorers || []).map((s) => s.playerId);

// Keep the kickoff timestamp honest across status changes: stamp it the moment
// a match goes live (that instant is 00:00 on the public clock) and clear it
// when a match is reset to upcoming so a re-kickoff restarts from zero.
function kickoffPatch(prevStatus, nextStatus, prevKickoffAt) {
  if (nextStatus === "live" && prevStatus !== "live" && !prevKickoffAt) {
    return { kickoffAt: new Date() };
  }
  if (nextStatus === "upcoming" && prevStatus !== "upcoming") {
    return { kickoffAt: null };
  }
  return {};
}

// Match scorers are the single source of truth for a player's cumulative goal
// tally (the Top Scorers board). Whenever a match's scorers change, recompute
// the affected players' totals by summing their goals across every match they
// appear in — so the admin only ever enters goals once, per match, and the
// leaderboard can never drift out of sync. Best-effort: a failure here must not
// fail the match write itself.
async function syncPlayerGoals(playerIds = []) {
  const ids = [...new Set(playerIds.filter(Boolean))];
  if (!ids.length) return;
  try {
    const rows = await Match.aggregate([
      { $unwind: "$scorers" },
      { $match: { "scorers.playerId": { $in: ids } } },
      { $group: { _id: "$scorers.playerId", goals: { $sum: "$scorers.goals" } } },
    ]);
    const totals = new Map(rows.map((r) => [r._id, r.goals]));
    await Promise.all(
      ids.map((id) => Player.updateOne({ _id: id }, { goals: totals.get(id) || 0 }))
    );
  } catch (err) {
    console.error("Player goal sync failed:", err.message);
  }
}

// GET /api/matches?group=A&status=live
export const getMatches = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.group) filter.group = req.query.group;
  if (req.query.status) filter.status = req.query.status;
  const matches = await Match.find(filter).sort({ date: 1 });
  res.json(matches);
});

// GET /api/matches/:id
export const getMatch = asyncHandler(async (req, res) => {
  const match = await Match.findById(req.params.id);
  if (!match) throw new ApiError(404, "Match not found");
  res.json(match);
});

// POST /api/matches (admin)
export const createMatch = asyncHandler(async (req, res) => {
  // A match created directly as live kicks off right now.
  if (req.body?.status === "live" && !req.body.kickoffAt) {
    req.body.kickoffAt = new Date();
  }
  const match = await Match.create(req.body);
  await syncPlayerGoals(scorerIds(match));
  res.status(201).json(match);
});

// PUT /api/matches/:id (admin)
export const updateMatch = asyncHandler(async (req, res) => {
  const prev = await Match.findById(req.params.id);
  if (!prev) throw new ApiError(404, "Match not found");
  const before = eventSnapshot(prev);
  if (req.body.status !== undefined && req.body.kickoffAt === undefined) {
    Object.assign(req.body, kickoffPatch(prev.status, req.body.status, prev.kickoffAt));
  }
  const match = await Match.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  // Recompute everyone who scored before OR after this edit (covers added,
  // removed and reassigned goals).
  await syncPlayerGoals([...scorerIds(prev), ...scorerIds(match)]);
  await trySettle(match);
  notifyMatchEvents(before, match); // fire-and-forget push alerts
  res.json(match);
});

// PATCH /api/matches/:id/score (admin) — quick live update of score/minute/status.
export const updateScore = asyncHandler(async (req, res) => {
  const { homeScore, awayScore, minute, status } = req.body;
  const match = await Match.findById(req.params.id);
  if (!match) throw new ApiError(404, "Match not found");
  const before = eventSnapshot(match);

  if (homeScore !== undefined) match.homeScore = homeScore;
  if (awayScore !== undefined) match.awayScore = awayScore;
  if (minute !== undefined) match.minute = minute;
  if (status !== undefined) {
    Object.assign(match, kickoffPatch(match.status, status, match.kickoffAt));
    match.status = status;
  }
  await match.save();

  await trySettle(match);
  notifyMatchEvents(before, match); // fire-and-forget push alerts
  res.json(match);
});

// DELETE /api/matches/:id (admin)
export const deleteMatch = asyncHandler(async (req, res) => {
  const match = await Match.findByIdAndDelete(req.params.id);
  if (!match) throw new ApiError(404, "Match not found");
  // The match is gone; its scorers no longer count toward their totals.
  await syncPlayerGoals(scorerIds(match));
  res.json({ message: "Match deleted" });
});
