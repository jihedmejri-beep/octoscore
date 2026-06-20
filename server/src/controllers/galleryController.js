import Gallery from "../models/Gallery.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import {
  uploadBuffer,
  destroyAsset,
  attachmentUrl,
  cloudinaryReady,
} from "../config/cloudinary.js";

// Attach a ready-to-use forced-download URL to each item.
const serialize = (doc) => {
  const obj = doc.toJSON();
  obj.downloadUrl = obj.image?.publicId
    ? attachmentUrl(obj.image.publicId, obj.title)
    : obj.image?.url || null;
  return obj;
};

// GET /api/gallery
export const getGallery = asyncHandler(async (req, res) => {
  const items = await Gallery.find().sort({ order: 1, date: -1 });
  res.json(items.map(serialize));
});

// GET /api/gallery/:id
export const getGalleryItem = asyncHandler(async (req, res) => {
  const item = await Gallery.findById(req.params.id);
  if (!item) throw new ApiError(404, "Memory not found");
  res.json(serialize(item));
});

// POST /api/gallery (admin) — multipart form, optional "image" file.
export const createGalleryItem = asyncHandler(async (req, res) => {
  const { title, tag, caption, date, accent, order } = req.body;
  if (!title) throw new ApiError(400, "Title is required");

  const data = { title, tag, caption, accent, order };
  if (date) data.date = date;

  if (req.file) {
    if (!cloudinaryReady())
      throw new ApiError(500, "Cloudinary is not configured on the server");
    const result = await uploadBuffer(req.file.buffer);
    data.image = {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  }

  const item = await Gallery.create(data);
  res.status(201).json(serialize(item));
});

// PUT /api/gallery/:id (admin) — update fields and/or replace the image.
export const updateGalleryItem = asyncHandler(async (req, res) => {
  const item = await Gallery.findById(req.params.id);
  if (!item) throw new ApiError(404, "Memory not found");

  const { title, tag, caption, date, accent, order } = req.body;
  if (title !== undefined) item.title = title;
  if (tag !== undefined) item.tag = tag;
  if (caption !== undefined) item.caption = caption;
  if (date !== undefined) item.date = date;
  if (accent !== undefined) item.accent = accent;
  if (order !== undefined) item.order = order;

  if (req.file) {
    if (!cloudinaryReady())
      throw new ApiError(500, "Cloudinary is not configured on the server");
    if (item.image?.publicId) await destroyAsset(item.image.publicId);
    const result = await uploadBuffer(req.file.buffer);
    item.image = {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  }

  await item.save();
  res.json(serialize(item));
});

// DELETE /api/gallery/:id (admin) — removes the Cloudinary asset too.
export const deleteGalleryItem = asyncHandler(async (req, res) => {
  const item = await Gallery.findById(req.params.id);
  if (!item) throw new ApiError(404, "Memory not found");
  if (item.image?.publicId) await destroyAsset(item.image.publicId);
  await item.deleteOne();
  res.json({ message: "Memory deleted" });
});

// GET /api/gallery/:id/download (public) — 302 to a forced-download Cloudinary URL.
export const downloadGalleryItem = asyncHandler(async (req, res) => {
  const item = await Gallery.findById(req.params.id);
  if (!item) throw new ApiError(404, "Memory not found");
  if (!item.image?.publicId && !item.image?.url)
    throw new ApiError(404, "This memory has no downloadable image yet");

  const url = item.image.publicId
    ? attachmentUrl(item.image.publicId, item.title)
    : item.image.url;
  res.redirect(url);
});
