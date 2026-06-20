import { Router } from "express";

import {
  getPlayers,
  getTopScorers,
  getPlayer,
  createPlayer,
  updatePlayer,
  deletePlayer,
} from "../controllers/playerController.js";
import { protect, admin } from "../middleware/auth.js";

const router = Router();

router.get("/", getPlayers);
router.get("/top", getTopScorers); // before /:id so "top" isn't treated as an id
router.get("/:id", getPlayer);
router.post("/", protect, admin, createPlayer);
router.put("/:id", protect, admin, updatePlayer);
router.delete("/:id", protect, admin, deletePlayer);

export default router;
