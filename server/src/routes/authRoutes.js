import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  signup,
  login,
  getMe,
  updateMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Throttle credential endpoints to slow brute-force attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts — please try again later" },
});

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", authLimiter, protect, resendVerification);
router.get("/me", protect, getMe);
router.patch("/me", protect, updateMe);

export default router;
