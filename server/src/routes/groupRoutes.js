import { Router } from "express";

import {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
} from "../controllers/groupController.js";
import { protect, admin } from "../middleware/auth.js";

const router = Router();

router.get("/", getGroups);
router.get("/:id", getGroup);
router.post("/", protect, admin, createGroup);
router.put("/:id", protect, admin, updateGroup);
router.delete("/:id", protect, admin, deleteGroup);

export default router;
