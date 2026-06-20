import { Router } from "express";

import {
  getMatches,
  getMatch,
  createMatch,
  updateMatch,
  updateScore,
  deleteMatch,
} from "../controllers/matchController.js";
import {
  upsertPrediction,
  getMyPrediction,
  getPredictionStats,
} from "../controllers/predictionController.js";
import { protect, admin } from "../middleware/auth.js";

const router = Router();

router.get("/", getMatches);
router.get("/:id", getMatch);
router.post("/", protect, admin, createMatch);
router.put("/:id", protect, admin, updateMatch);
router.patch("/:id/score", protect, admin, updateScore);
router.delete("/:id", protect, admin, deleteMatch);

// User score predictions.
router.get("/:id/predictions", getPredictionStats); // public aggregate
router.get("/:id/prediction/me", protect, getMyPrediction); // caller's pick
router.post("/:id/predict", protect, upsertPrediction); // submit / update

export default router;
