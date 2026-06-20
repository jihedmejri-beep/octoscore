import { Router } from "express";

import {
  getGallery,
  getGalleryItem,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  downloadGalleryItem,
} from "../controllers/galleryController.js";
import { protect, admin } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/", getGallery);
router.get("/:id", getGalleryItem);
router.get("/:id/download", downloadGalleryItem); // public download
router.post("/", protect, admin, upload.single("image"), createGalleryItem);
router.put("/:id", protect, admin, upload.single("image"), updateGalleryItem);
router.delete("/:id", protect, admin, deleteGalleryItem);

export default router;
