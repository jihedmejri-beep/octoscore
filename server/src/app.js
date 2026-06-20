import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import apiRoutes from "./routes/index.js";
import { cache, invalidateOnWrite } from "./middleware/cache.js";
import { notFound, errorHandler } from "./middleware/error.js";

const app = express();

// Behind Railway/Render/Vercel proxies: trust the first proxy so req.ip and the
// rate limiter see the real client address (X-Forwarded-For), not the proxy's.
app.set("trust proxy", 1);

// --- Security & parsing ----------------------------------------------------
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression()); // gzip JSON responses — ~5x less bandwidth under load
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

// --- CORS ------------------------------------------------------------------
// Allow the Vercel frontend + any localhost port during development.
// CLIENT_URL is a comma-separated allow-list; "*" allows any origin.
const allowed = (process.env.CLIENT_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const isDev = process.env.NODE_ENV !== "production";
// http://localhost:PORT or http://127.0.0.1:PORT (any/no port, http/https).
const localhostRe = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

function originAllowed(origin) {
  if (!origin) return true; // curl/Postman/server-to-server (no Origin header)
  if (isDev) return true; // dev: accept any origin (localhost, 127.0.0.1, LAN IP…)
  if (allowed.includes("*") || allowed.includes(origin)) return true;
  if (localhostRe.test(origin)) return true;
  return false;
}

app.use(
  cors({
    // Never throw on a disallowed origin: returning `false` simply omits the
    // CORS headers (the browser blocks the response) instead of crashing every
    // request — including the OPTIONS preflight — with a 500.
    origin: (origin, cb) => cb(null, originAllowed(origin)),
    credentials: true,
  })
);

// --- Health check (Railway) -------------------------------------------------
app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

// --- API -------------------------------------------------------------------
// invalidateOnWrite flushes the cache after admin mutations; cache serves
// public GETs from memory so a flood of identical reads hits Mongo just once
// per TTL window (see middleware/cache.js).
app.use("/api", invalidateOnWrite);
app.use("/api", cache);
app.use("/api", apiRoutes);

// --- Fallbacks -------------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

export default app;
