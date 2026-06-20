import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please use a valid email"],
    },
    // Hidden by default — must be explicitly .select("+password") to read.
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    xp: { type: Number, default: 0 },
    // Quiz question ids the user has already earned XP for. Quiz XP is awarded
    // once per question so the quiz stays replayable without farming XP.
    quizAnswered: { type: [String], default: [] },
    avatarUrl: { type: String, default: "" },
    // Email verification. The raw token is emailed; only its hash is stored.
    emailVerified: { type: Boolean, default: false },
    verifyTokenHash: { type: String, select: false },
    verifyTokenExpires: { type: Date, select: false },
    // Password reset. Same pattern: email the raw token, store only its hash.
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// Hash password whenever it is set or changed.
userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function matchPassword(entered) {
  return bcrypt.compare(entered, this.password);
};

// Issue a fresh email-verification token: returns the raw token to email, and
// stores only its SHA-256 hash + a 24h expiry on the document.
userSchema.methods.createVerifyToken = function createVerifyToken() {
  const raw = crypto.randomBytes(32).toString("hex");
  this.verifyTokenHash = crypto.createHash("sha256").update(raw).digest("hex");
  this.verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return raw;
};

// Hash a raw token the same way, for lookup on verification.
userSchema.statics.hashVerifyToken = (raw) =>
  crypto.createHash("sha256").update(raw).digest("hex");

// Issue a fresh password-reset token: returns the raw token to email, and
// stores only its SHA-256 hash + a 1h expiry on the document.
userSchema.methods.createResetToken = function createResetToken() {
  const raw = crypto.randomBytes(32).toString("hex");
  this.resetTokenHash = crypto.createHash("sha256").update(raw).digest("hex");
  this.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
  return raw;
};

userSchema.statics.hashResetToken = (raw) =>
  crypto.createHash("sha256").update(raw).digest("hex");

userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.password;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
