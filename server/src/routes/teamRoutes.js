import { Router } from "express";

import {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
} from "../controllers/teamController.js";
import { protect, admin } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/", getTeams);
router.get("/:id", getTeam);
router.post("/", protect, admin, upload.single("logo"), createTeam);
router.put("/:id", protect, admin, upload.single("logo"), updateTeam);
router.delete("/:id", protect, admin, deleteTeam);

export default router;
