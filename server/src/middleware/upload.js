import multer from "multer";

// Keep uploads in memory; we stream the buffer straight to Cloudinary, so no
// files ever touch the (ephemeral) Railway disk.
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpe?g|png|webp|gif|avif)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed (jpg, png, webp, gif, avif)"));
  },
});

export default upload;
