// Overlay live match results onto the admin-defined knockout bracket.
//
// The bracket *structure* (who meets whom in each slot, and who advances on a
// level tie — penalties/away goals, which a scoreline alone can't express) is
// owned by the admin and stored under the "bracket" content key. The *scores*,
// however, should never be typed twice: this module recomputes each tie's
// aggregate score and status from the real Match documents, so editing a match
// in the admin updates the bracket automatically and the two can't drift.
//
// Winners are left exactly as the admin set them. A tie with no scored legs yet
// keeps its stored values, so an un-played bracket still renders as authored.

// Two legs of a tie can be played either way round, so compare team pairs
// without caring about home/away order.
const pairKey = (a, b) => [a, b].sort().join("|");

// Does this match belong to the given bracket round of a group?
function isRoundMatch(match, roundKey) {
  if (roundKey === "qf") return match.round === "QF";
  if (roundKey === "sf") return match.round === "SF";
  // Group final: any match in the group that isn't a QF/SF leg.
  return match.round !== "QF" && match.round !== "SF";
}

// Sum a tie's legs into an aggregate for each side. Returns null when no leg has
// a score yet, signalling the caller to keep the stored (authored) values.
function aggregateTie(tie, matches) {
  let homeAgg = 0;
  let awayAgg = 0;
  let scoredLegs = 0;

  for (const m of matches) {
    if (m.homeScore == null || m.awayScore == null) continue;
    scoredLegs += 1;
    // Credit each leg's goals to the right side of the tie.
    if (m.homeTeamId === tie.homeId) {
      homeAgg += m.homeScore;
      awayAgg += m.awayScore;
    } else {
      homeAgg += m.awayScore;
      awayAgg += m.homeScore;
    }
  }

  if (scoredLegs === 0) return null;

  const status = matches.some((m) => m.status === "live")
    ? "live"
    : matches.every((m) => m.status === "finished")
      ? "finished"
      : "upcoming";

  return { homeAgg, awayAgg, status };
}

export function overlayBracketWithMatches(data, matches = []) {
  if (!data || typeof data !== "object") return data;

  // Bucket matches by group for cheap lookup.
  const byGroup = new Map();
  for (const m of matches) {
    if (!byGroup.has(m.group)) byGroup.set(m.group, []);
    byGroup.get(m.group).push(m);
  }

  const overlayTie = (tie, groupKey, roundKey) => {
    if (!tie?.homeId || !tie?.awayId) return tie;
    const linked = (byGroup.get(groupKey) || []).filter(
      (m) =>
        isRoundMatch(m, roundKey) &&
        pairKey(m.homeTeamId, m.awayTeamId) === pairKey(tie.homeId, tie.awayId)
    );
    const agg = aggregateTie(tie, linked);
    if (!agg) return tie; // no scores entered yet → keep authored values
    return { ...tie, homeAgg: agg.homeAgg, awayAgg: agg.awayAgg, status: agg.status };
  };

  const overlayGroup = (group, groupKey) => {
    if (!group) return group;
    return {
      ...group,
      qf: (group.qf || []).map((t) => overlayTie(t, groupKey, "qf")),
      sf: (group.sf || []).map((t) => overlayTie(t, groupKey, "sf")),
      final: overlayTie(group.final, groupKey, "final"),
    };
  };

  const result = { ...data };
  for (const key of Object.keys(data)) {
    if (key === "grandFinal") continue;
    result[key] = overlayGroup(data[key], key);
  }

  // Grand final: a single match stored under the "FINAL" group.
  if (data.grandFinal?.homeId && data.grandFinal?.awayId) {
    const gf = data.grandFinal;
    const linked = (byGroup.get("FINAL") || []).filter(
      (m) => pairKey(m.homeTeamId, m.awayTeamId) === pairKey(gf.homeId, gf.awayId)
    );
    const agg = aggregateTie(gf, linked);
    result.grandFinal = agg
      ? { ...gf, homeAgg: agg.homeAgg, awayAgg: agg.awayAgg, status: agg.status }
      : gf;
  }

  return result;
}
