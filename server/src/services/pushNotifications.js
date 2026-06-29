import webpush from "web-push";

import PushSubscription from "../models/PushSubscription.js";
import Team from "../models/Team.js";

// Configure web-push from VAPID env. Stays inert (pushReady() === false) until
// the keys are provided, so the API runs fine without notifications set up.
const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@octoscore.app";

let configured = false;
if (PUBLIC_KEY && PRIVATE_KEY) {
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
  configured = true;
}

export const pushReady = () => configured;
export const getPublicKey = () => PUBLIC_KEY;

// Send one payload to every stored subscription. Dead subscriptions (the
// browser unsubscribed or expired — 404/410) are pruned so the list stays
// clean. Best-effort: never throws to the caller.
export async function sendToAll(payload) {
  if (!configured) return;
  let subs;
  try {
    subs = await PushSubscription.find();
  } catch (err) {
    console.error("Push: failed to load subscriptions:", err.message);
    return;
  }
  const body = JSON.stringify(payload);
  const dead = [];
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          body
        );
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) dead.push(sub.endpoint);
        else console.error("Push send failed:", err.statusCode || err.message);
      }
    })
  );
  if (dead.length) {
    await PushSubscription.deleteMany({ endpoint: { $in: dead } }).catch(() => {});
  }
}

const nameCache = new Map();
async function teamName(id) {
  if (!id) return "";
  if (nameCache.has(id)) return nameCache.get(id);
  const team = await Team.findById(id).select("name").lean();
  const name = team?.name || "—";
  nameCache.set(id, name);
  return name;
}

// Compare a match before/after an admin edit and fire notifications for the
// transitions fans care about: kickoff, a goal (score went up), and full-time.
// `prev` is a plain snapshot { status, homeScore, awayScore }; `next` is the
// saved match document.
export async function notifyMatchEvents(prev, next) {
  if (!configured || !prev || !next) return;
  try {
    const home = await teamName(next.homeTeamId);
    const away = await teamName(next.awayTeamId);
    const url = `/matches/${next.id || next._id}`;
    const tag = `match-${next.id || next._id}`;
    const score = (h, a) => `${h ?? 0}–${a ?? 0}`;

    const prevHome = prev.homeScore ?? 0;
    const prevAway = prev.awayScore ?? 0;
    const nextHome = next.homeScore ?? 0;
    const nextAway = next.awayScore ?? 0;

    // Kickoff: upcoming → live.
    if (prev.status !== "live" && next.status === "live") {
      await sendToAll({
        title: "🟢 Kick-off!",
        body: `${home} vs ${away} is live now.`,
        url,
        tag,
      });
    }

    // Goal: total score increased. Name the side that scored.
    if (next.status !== "upcoming" && (nextHome > prevHome || nextAway > prevAway)) {
      const scorer = nextHome > prevHome ? home : away;
      await sendToAll({
        title: "⚽ GOAL!",
        body: `${scorer} scored — ${home} ${score(nextHome, nextAway)} ${away}`,
        url,
        tag,
      });
    }

    // Full-time: anything → finished.
    if (prev.status !== "finished" && next.status === "finished") {
      await sendToAll({
        title: "🏁 Full-time",
        body: `${home} ${score(nextHome, nextAway)} ${away}`,
        url,
        tag,
      });
    }
  } catch (err) {
    console.error("notifyMatchEvents failed:", err.message);
  }
}
