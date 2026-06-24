// Build the Tournament-page bracket straight from the matches the admin enters,
// so adding a match in the panel makes it appear in the tournament view — no
// separate hand-maintained bracket document needed.
//
// Output shape (consumed by routes/Tournament.jsx):
//   { [groupId]: { qf: [tie], sf: [tie], final: tie|null }, grandFinal: tie|null }
// where a `tie` is { id, homeId, awayId, homeAgg, awayAgg, status, winnerId,
// single, date, location }.

const norm = (s) => (s ?? "").toString().toUpperCase().replace(/[^A-Z0-9]/g, "");

// Decide which round bucket a match belongs to from its round/group fields.
function bucketOf(match) {
  const r = norm(match.round);
  const g = norm(match.group);
  if (g === "FINAL" || r.includes("GRAND")) return "grand";
  if (r.startsWith("QF") || r.includes("QUARTER")) return "qf";
  if (r.startsWith("SF") || r.includes("SEMI")) return "sf";
  if (r.includes("FINAL") || r === "F") return "final";
  return "qf"; // unknown/blank rounds still show up, under Quarterfinals
}

const pairKey = (a, b) => [a, b].sort().join("~");
const time = (d) => (d ? new Date(d).getTime() : 0);

// Collapse one tie (1 match, or 2 legs of the same pairing) into a single card.
function toTie(legs) {
  const ordered = [...legs].sort((a, b) => time(a.date) - time(b.date));
  const ref = ordered[0];
  const refHome = ref.homeTeamId;
  const refAway = ref.awayTeamId;

  let homeAgg = null;
  let awayAgg = null;
  ordered.forEach((m) => {
    if (m.homeScore == null || m.awayScore == null) return;
    const forHome = m.homeTeamId === refHome ? m.homeScore : m.awayScore;
    const forAway = m.homeTeamId === refHome ? m.awayScore : m.homeScore;
    homeAgg = (homeAgg ?? 0) + forHome;
    awayAgg = (awayAgg ?? 0) + forAway;
  });

  const status = ordered.some((m) => m.status === "live")
    ? "live"
    : ordered.every((m) => m.status === "finished")
      ? "finished"
      : "upcoming";

  let winnerId = null;
  if (status === "finished" && homeAgg != null && awayAgg != null && homeAgg !== awayAgg) {
    winnerId = homeAgg > awayAgg ? refHome : refAway;
  }

  const last = ordered[ordered.length - 1];
  return {
    id: last.id,
    homeId: refHome,
    awayId: refAway,
    homeAgg,
    awayAgg,
    status,
    winnerId,
    single: ordered.length < 2,
    date: last.date,
    location: last.location,
  };
}

// Group an array of matches into ties keyed by their (unordered) pairing.
function tiesFrom(matches) {
  const byPair = {};
  matches.forEach((m) => {
    const key = pairKey(m.homeTeamId, m.awayTeamId);
    (byPair[key] = byPair[key] || []).push(m);
  });
  return Object.values(byPair)
    .map(toTie)
    .sort((a, b) => time(a.date) - time(b.date));
}

export function buildBracket(matches = [], groups = []) {
  const grand = [];
  const byGroup = {}; // gid -> { qf:[], sf:[], final:[] }

  matches.forEach((m) => {
    const bucket = bucketOf(m);
    if (bucket === "grand") {
      grand.push(m);
      return;
    }
    const g = (byGroup[m.group] = byGroup[m.group] || { qf: [], sf: [], final: [] });
    g[bucket].push(m);
  });

  const bracket = {};
  // Keep the admin's group order; fall back to whatever groups have matches.
  const order = groups.length ? groups.map((g) => g.id) : Object.keys(byGroup);
  order.forEach((gid) => {
    const g = byGroup[gid];
    if (!g) return;
    const finals = tiesFrom(g.final);
    bracket[gid] = {
      qf: tiesFrom(g.qf),
      sf: tiesFrom(g.sf),
      final: finals[0] || null,
    };
  });

  if (grand.length) bracket.grandFinal = toTie(grand);
  return bracket;
}
