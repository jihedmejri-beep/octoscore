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
// Skip counting successful requests so a legitimate user typing fast isn't
// locked out — only failed attempts erode the budget.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts — please try again later" },
});

// Stricter cap for login specifically — the prime brute-force target.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts / 15 min / IP
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only failed logins count toward the limit
  message: { message: "Too many login attempts — please try again later" },
});

router.post("/signup", authLimiter, signup);
router.post("/login", loginLimiter, login);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", authLimiter, protect, resendVerification);
router.get("/me", protect, getMe);
router.patch("/me", protect, updateMe);

export default router;
