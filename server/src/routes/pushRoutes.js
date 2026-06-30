import { Router } from "express";

import {
  publicKey,
  subscribe,
  unsubscribe,
  sendTest,
  sendCustom,
} from "../controllers/pushController.js";
import { protect, admin } from "../middleware/auth.js";

const router = Router();

// Public: notifications are anonymous (everyone who opts in gets alerts).
router.get("/public-key", publicKey);
router.post("/subscribe", subscribe);
router.post("/unsubscribe", unsubscribe);

// Admin: fire a sample notification to verify the setup, or broadcast a custom one.
router.post("/test", protect, admin, sendTest);
router.post("/send", protect, admin, sendCustom);

export default router;
