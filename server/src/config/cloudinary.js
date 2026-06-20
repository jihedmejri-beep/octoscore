import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary from env. Stays inert until credentials are provided, so
// the rest of the API still runs locally without a Cloudinary account.
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const FOLDER = process.env.CLOUDINARY_FOLDER || "octoscore/gallery";

export const cloudinaryReady = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

// Stream a file buffer straight to Cloudinary (no temp files on disk).
export function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: FOLDER, resource_type: "image", ...options },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

export function destroyAsset(publicId) {
  if (!publicId) return Promise.resolve(null);
  return cloudinary.uploader.destroy(publicId);
}

// Build a "force download" URL (Cloudinary fl_attachment) so the gallery's
// download button saves the original file instead of opening it inline.
export function attachmentUrl(publicId, filename) {
  if (!publicId) return null;
  const safe = (filename || "").replace(/[^a-z0-9_-]+/gi, "_").slice(0, 60);
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: "image",
    flags: safe ? `attachment:${safe}` : "attachment",
  });
}

export default cloudinary;
