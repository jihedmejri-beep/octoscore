import TeamPhoto from "../models/TeamPhoto.js";
import Team from "../models/Team.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import {
  uploadBuffer,
  destroyAsset,
  deliveryUrl,
  attachmentUrl,
  cloudinaryReady,
} from "../config/cloudinary.js";

// Attach optimized URLs: a small thumbnail for the grid, a medium one for the
// lightbox, and a forced-download link for the full original.
const serialize = (doc) => {
  const obj = doc.toJSON();
  const pid = obj.image?.publicId;
  obj.thumbUrl = pid ? deliveryUrl(pid, { width: 500 }) : obj.image?.url || null;
  obj.fullUrl = pid ? deliveryUrl(pid, { width: 1400 }) : obj.image?.url || null;
  obj.downloadUrl = pid ? attachmentUrl(pid, obj.caption) : obj.image?.url || null;
  return obj;
};

// GET /api/teams/:id/photos (public)
export const getTeamPhotos = asyncHandler(async (req, res) => {
  const photos = await TeamPhoto.find({ teamId: req.params.id }).sort({
    order: 1,
    createdAt: 1,
  });
  res.json(photos.map(serialize));
});

// POST /api/teams/:id/photos (admin) — multipart, one or more "photos" files.
export const addTeamPhotos = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw new ApiError(404, "Team not found");
  if (!req.files?.length) throw new ApiError(400, "At least one photo is required");
  if (!cloudinaryReady())
    throw new ApiError(500, "Cloudinary is not configured on the server");

  // Continue numbering after the album's current last photo.
  const last = await TeamPhoto.findOne({ teamId: team.id }).sort({ order: -1 });
  let order = (last?.order ?? -1) + 1;

  const created = [];
  for (const file of req.files) {
    const result = await uploadBuffer(file.buffer, {
      folder: `octoscore/teams/${team.id}`,
    });
    const photo = await TeamPhoto.create({
      teamId: team.id,
      caption: req.body.caption || "",
      image: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      },
      order: order++,
    });
    created.push(serialize(photo));
  }

  res.status(201).json(created);
});

// DELETE /api/teams/:id/photos/:photoId (admin) — also removes the Cloudinary asset.
export const deleteTeamPhoto = asyncHandler(async (req, res) => {
  const photo = await TeamPhoto.findOne({
    _id: req.params.photoId,
    teamId: req.params.id,
  });
  if (!photo) throw new ApiError(404, "Photo not found");
  if (photo.image?.publicId) await destroyAsset(photo.image.publicId);
  await photo.deleteOne();
  res.json({ message: "Photo deleted" });
});
