import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import generateToken from "../utils/generateToken.js";
import { sendMail, verificationEmail, resetPasswordEmail } from "../utils/mailer.js";

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  xp: u.xp,
  avatarUrl: u.avatarUrl,
  emailVerified: u.emailVerified,
});

// Base URL of the public frontend, used to build email links. Falls back to the
// first CLIENT_URL entry, then localhost.
function frontendBase() {
  const firstClient = (process.env.CLIENT_URL || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)[0];
  return (process.env.APP_URL || firstClient || "http://localhost:5173").replace(/\/$/, "");
}

// Generate a verification token, persist it, and email the confirmation link.
// Email failures are logged but never block the request.
async function dispatchVerification(user) {
  const raw = user.createVerifyToken();
  await user.save();
  const url = `${frontendBase()}/verify-email?token=${raw}`;
  const { subject, text, html } = verificationEmail(user.name, url);
  await sendMail({ to: user.email, subject, text, html });
}

// POST /api/auth/signup
export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    throw new ApiError(400, "Name, email and password are required");
  if (password.length < 6)
    throw new ApiError(400, "Password must be at least 6 characters");

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, "An account with that email already exists");

  const user = new User({ name, email, password });

  // Issue + email the verification link. Don't fail signup if delivery hiccups
  // (the user can request a resend from their account menu).
  try {
    await dispatchVerification(user);
  } catch (err) {
    await user.save(); // persist the token even if the email failed to send
    console.error("Verification email failed:", err.message);
  }

  res.status(201).json({ token: generateToken(user), user: publicUser(user) });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, "Email and password are required");

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.matchPassword(password)))
    throw new ApiError(401, "Invalid email or password");

  res.json({ token: generateToken(user), user: publicUser(user) });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// PATCH /api/auth/me
export const updateMe = asyncHandler(async (req, res) => {
  const { name, avatarUrl, password } = req.body;
  if (name !== undefined) req.user.name = name;
  if (avatarUrl !== undefined) req.user.avatarUrl = avatarUrl;
  if (password) {
    if (password.length < 6)
      throw new ApiError(400, "Password must be at least 6 characters");
    req.user.password = password;
  }
  await req.user.save();
  res.json({ user: publicUser(req.user) });
});

// POST /api/auth/forgot-password — email a reset link if the account exists.
// Always responds with the same generic message so the endpoint can't be used
// to probe which emails are registered.
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    const raw = user.createResetToken();
    await user.save();
    const url = `${frontendBase()}/reset-password?token=${raw}`;
    const { subject, text, html } = resetPasswordEmail(user.name, url);
    try {
      await sendMail({ to: user.email, subject, text, html });
    } catch (err) {
      console.error("Reset email failed:", err.message);
    }
  }

  res.json({ message: "If that email is registered, a reset link is on its way." });
});

// POST /api/auth/reset-password — set a new password from a valid reset token.
// On success the user is signed in (returns a fresh JWT).
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) throw new ApiError(400, "Token and new password are required");
  if (password.length < 6)
    throw new ApiError(400, "Password must be at least 6 characters");

  const user = await User.findOne({
    resetTokenHash: User.hashResetToken(token),
    resetTokenExpires: { $gt: new Date() },
  }).select("+resetTokenHash +resetTokenExpires");

  if (!user) throw new ApiError(400, "This reset link is invalid or has expired");

  user.password = password;
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  await user.save();

  res.json({ token: generateToken(user), user: publicUser(user) });
});

// GET /api/auth/verify-email?token=...
export const verifyEmail = asyncHandler(async (req, res) => {
  const raw = req.query.token || req.body?.token;
  if (!raw) throw new ApiError(400, "Verification token is required");

  const user = await User.findOne({
    verifyTokenHash: User.hashVerifyToken(raw),
    verifyTokenExpires: { $gt: new Date() },
  }).select("+verifyTokenHash +verifyTokenExpires");

  if (!user) throw new ApiError(400, "This verification link is invalid or has expired");

  user.emailVerified = true;
  user.verifyTokenHash = undefined;
  user.verifyTokenExpires = undefined;
  await user.save();

  res.json({ message: "Email verified", user: publicUser(user) });
});

// POST /api/auth/resend-verification (protected)
export const resendVerification = asyncHandler(async (req, res) => {
  if (req.user.emailVerified) return res.json({ message: "Email already verified" });
  await dispatchVerification(req.user);
  res.json({ message: "Verification email sent" });
});
