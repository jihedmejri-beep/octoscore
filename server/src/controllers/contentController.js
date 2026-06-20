import Content from "../models/Content.js";
import Match from "../models/Match.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { overlayBracketWithMatches } from "../services/bracket.js";

// Whitelisted singleton keys the admin can edit.
const ALLOWED_KEYS = ["bracket", "rules", "settings"];

// GET /api/content/:key  (public)
// For the bracket, live match results are overlaid onto the admin-defined
// structure so aggregate scores never have to be typed twice. The admin editor
// passes ?raw=1 to read the unmodified authored values (otherwise it would save
// the computed numbers back over its own source).
export const getContent = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const doc = await Content.findById(key);
  if (!doc) {
    // Return an empty shell instead of 404 so the frontend can render gracefully.
    return res.json({ id: key, data: null });
  }

  const json = doc.toJSON();
  if (key === "bracket" && json.data && !req.query.raw) {
    const matches = await Match.find()
      .select("homeTeamId awayTeamId group round homeScore awayScore status")
      .lean();
    json.data = overlayBracketWithMatches(json.data, matches);
  }
  res.json(json);
});

// PUT /api/content/:key  (admin) — upsert the whole document.
export const putContent = asyncHandler(async (req, res) => {
  const { key } = req.params;
  if (!ALLOWED_KEYS.includes(key))
    throw new ApiError(400, `Unknown content key "${key}"`);

  const data = req.body.data ?? req.body;
  const doc = await Content.findByIdAndUpdate(
    key,
    { data },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json(doc.toJSON());
});
