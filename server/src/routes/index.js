import { Router } from "express";

import authRoutes from "./authRoutes.js";
import groupRoutes from "./groupRoutes.js";
import teamRoutes from "./teamRoutes.js";
import playerRoutes from "./playerRoutes.js";
import matchRoutes from "./matchRoutes.js";
import galleryRoutes from "./galleryRoutes.js";
import quizRoutes from "./quizRoutes.js";
import contentRoutes from "./contentRoutes.js";

const router = Router();

router.get("/", (req, res) =>
  res.json({
    name: "OctoScore API",
    version: "1.0.0",
    endpoints: [
      "/api/auth",
      "/api/groups",
      "/api/teams",
      "/api/players",
      "/api/matches",
      "/api/gallery",
      "/api/quiz",
      "/api/content",
    ],
  })
);

router.use("/auth", authRoutes);
router.use("/groups", groupRoutes);
router.use("/teams", teamRoutes);
router.use("/players", playerRoutes);
router.use("/matches", matchRoutes);
router.use("/gallery", galleryRoutes);
router.use("/quiz", quizRoutes);
router.use("/content", contentRoutes);

export default router;
