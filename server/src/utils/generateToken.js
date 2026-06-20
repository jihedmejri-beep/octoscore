import jwt from "jsonwebtoken";

// Sign a JWT carrying the user id + role (role is re-checked from the DB on
// each protected request, the token copy is only a hint).
export default function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
}
