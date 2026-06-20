// Tiny in-memory response cache for public GET endpoints.
//
// Why: during a live match hundreds of users hammer the same read endpoints
// (e.g. GET /api/matches) at once. Without caching, every request becomes a
// MongoDB query — which overruns the Atlas free tier (M0: shared CPU, low op
// throughput). With a short TTL, N simultaneous identical requests collapse to
// a single DB query per window; everyone else is served from memory in
// microseconds. Admin writes call clearCache() so edits show up immediately.
//
// No external dependency and no cross-process coordination needed: a single
// API instance (Railway/Render free tier) shares this Map across all requests.

const store = new Map();

// Per-resource freshness. Live scores need to feel real-time, so /matches is
// short; rosters/teams/quiz change rarely, so they can live longer.
function ttlFor(path) {
  if (path.startsWith("/matches")) return 5_000; // live scores: 5s
  if (path.startsWith("/players/top")) return 15_000; // leaderboard: 15s
  return 30_000; // teams, groups, players, content, gallery, quiz
}

// Wipe everything. Cheap and correct: writes are rare (admin only), so a full
// flush guarantees no stale data instead of tracking per-key dependencies.
export function clearCache() {
  store.clear();
}

// Cache GET responses keyed by full URL (path + query). Skips authenticated
// requests so admin/personalised reads are never shared between users.
export function cache(req, res, next) {
  if (req.method !== "GET") return next();
  if (req.headers.authorization) return next();
  if (req.path.startsWith("/auth")) return next(); // never cache auth (e.g. verify-email)

  const key = req.originalUrl;
  const now = Date.now();
  const hit = store.get(key);

  if (hit && hit.expires > now) {
    res.set("X-Cache", "HIT");
    res.set("Cache-Control", `public, max-age=${Math.ceil((hit.expires - now) / 1000)}`);
    return res.status(hit.status).json(hit.body);
  }

  // Cache the body the first time this URL is computed.
  const sendJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const ttl = ttlFor(req.path);
      store.set(key, { body, status: res.statusCode, expires: Date.now() + ttl });
      res.set("Cache-Control", `public, max-age=${Math.ceil(ttl / 1000)}`);
    }
    res.set("X-Cache", "MISS");
    return sendJson(body);
  };

  next();
}

// Flush the cache after any successful mutation so the next read is fresh.
export function invalidateOnWrite(req, res, next) {
  if (req.method === "GET") return next();
  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 300) clearCache();
  });
  next();
}
