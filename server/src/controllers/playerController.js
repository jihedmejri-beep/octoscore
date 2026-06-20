import Player from "../models/Player.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

// GET /api/players?teamId=t1&role=player
export const getPlayers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.teamId) filter.teamId = req.query.teamId;
  if (req.query.role) filter.role = req.query.role;
  const players = await Player.find(filter).sort({ teamId: 1, number: 1 });
  res.json(players);
});

// GET /api/players/top?limit=5  (top scorers leaderboard)
export const getTopScorers = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 5, 50);
  const players = await Player.find({ goals: { $gt: 0 } })
    .sort({ goals: -1 })
    .limit(limit);
  res.json(players);
});

// GET /api/players/:id
export const getPlayer = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.params.id);
  if (!player) throw new ApiError(404, "Player not found");
  res.json(player);
});

// POST /api/players (admin)
export const createPlayer = asyncHandler(async (req, res) => {
  // goals is derived from match scorers, never set by hand — see matchController.
  delete req.body.goals;
  const player = await Player.create(req.body);
  res.status(201).json(player);
});

// PUT /api/players/:id (admin)
export const updatePlayer = asyncHandler(async (req, res) => {
  delete req.body.goals; // derived from match scorers; leave the stored tally untouched
  const player = await Player.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!player) throw new ApiError(404, "Player not found");
  res.json(player);
});

// DELETE /api/players/:id (admin)
export const deletePlayer = asyncHandler(async (req, res) => {
  const player = await Player.findByIdAndDelete(req.params.id);
  if (!player) throw new ApiError(404, "Player not found");
  res.json({ message: "Player deleted" });
});
