import jwt from "jsonwebtoken";

import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

function readToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.slice(7);
  return null;
}

// Require a valid token; attaches the live user document to req.user.
export const protect = asyncHandler(async (req, res, next) => {
  const token = readToken(req);
  if (!token) throw new ApiError(401, "Not authorized — no token provided");

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, "Not authorized — invalid or expired token");
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, "Account no longer exists");

  req.user = user;
  next();
});

// Require the authenticated user to be an admin.
export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  throw new ApiError(403, "Admin access required");
};

// Attach req.user when a valid token is present, but never block the request.
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = readToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch {
      /* ignore — treated as anonymous */
    }
  }
  next();
});
