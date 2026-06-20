import { Router } from "express";

import { getContent, putContent } from "../controllers/contentController.js";
import { protect, admin } from "../middleware/auth.js";

const router = Router();

router.get("/:key", getContent);
router.put("/:key", protect, admin, putContent);

export default router;
