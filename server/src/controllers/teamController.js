import Team from "../models/Team.js";
import Player from "../models/Player.js";
import TeamPhoto from "../models/TeamPhoto.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { uploadBuffer, destroyAsset, cloudinaryReady } from "../config/cloudinary.js";

// Upload a logo buffer to Cloudinary and return the stored shape. Throws a
// clear error if Cloudinary credentials aren't set on the server.
async function uploadLogo(buffer) {
  if (!cloudinaryReady())
    throw new ApiError(500, "Cloudinary is not configured on the server");
  const result = await uploadBuffer(buffer, { folder: "octoscore/logos" });
  return { url: result.secure_url, publicId: result.public_id };
}

// GET /api/teams?group=A
export const getTeams = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.group) filter.group = req.query.group;
  const teams = await Team.find(filter).sort({ group: 1, name: 1 });
  res.json(teams);
});

// GET /api/teams/:id  (includes full roster)
export const getTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw new ApiError(404, "Team not found");
  const players = await Player.find({ teamId: team.id }).sort({ role: 1, number: 1 });
  res.json({ ...team.toJSON(), players });
});

// POST /api/teams (admin) — multipart form, "logo" file is required.
export const createTeam = asyncHandler(async (req, res) => {
  const { name, group, city, color, formation } = req.body;
  if (!req.file) throw new ApiError(400, "A team logo is required");

  const data = { name, group, city, color };
  if (formation !== undefined) data.formation = formation;
  data.logo = await uploadLogo(req.file.buffer);

  const team = await Team.create(data);
  res.status(201).json(team);
});

// PUT /api/teams/:id (admin) — update fields and/or replace the logo. A team
// must always keep a logo, so it can never be removed once set.
export const updateTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw new ApiError(404, "Team not found");

  const { name, group, city, color, formation } = req.body;
  if (name !== undefined) team.name = name;
  if (group !== undefined) team.group = group;
  if (city !== undefined) team.city = city;
  if (color !== undefined) team.color = color;
  if (formation !== undefined) team.formation = formation;

  if (req.file) {
    if (team.logo?.publicId) await destroyAsset(team.logo.publicId);
    team.logo = await uploadLogo(req.file.buffer);
  } else if (!team.logo?.url) {
    throw new ApiError(400, "A team logo is required");
  }

  await team.save();
  res.json(team);
});

// DELETE /api/teams/:id (admin) — also clears that team's roster and logo asset.
export const deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findByIdAndDelete(req.params.id);
  if (!team) throw new ApiError(404, "Team not found");
  if (team.logo?.publicId) await destroyAsset(team.logo.publicId);
  await Player.deleteMany({ teamId: team.id });

  // Remove the album's photos and their Cloudinary assets.
  const photos = await TeamPhoto.find({ teamId: team.id });
  await Promise.all(photos.map((p) => destroyAsset(p.image?.publicId)));
  await TeamPhoto.deleteMany({ teamId: team.id });

  res.json({ message: "Team and its players deleted" });
});
