import { create } from "zustand";

import api from "../services/api";

// Available lineup shapes (rows ordered defense → attack, GK implied).
export const FORMATIONS = {
  "3-2-2": [3, 2, 2],
  "2-2-3": [2, 2, 3],
  "3-1-1": [3, 1, 1],
};
export const DEFAULT_FORMATION = "3-2-2";
export const FORMATION_OPTIONS = Object.keys(FORMATIONS);

// Build the pitch coordinates (%) for a formation, in placement order:
// goalkeeper first, then each outfield row from the back to the front.
function formationSlots(formation) {
  const rows = FORMATIONS[formation] || FORMATIONS[DEFAULT_FORMATION];
  const slots = [{ x: 50, y: 90 }]; // goalkeeper
  const n = rows.length;
  const yBack = 72; // nearest own goal
  const yFront = 22; // attacking third
  rows.forEach((count, r) => {
    const y = n === 1 ? 50 : yBack - (r * (yBack - yFront)) / (n - 1);
    for (let i = 0; i < count; i += 1) {
      slots.push({ x: ((i + 1) / (count + 1)) * 100, y });
    }
  });
  return slots;
}

// Order starters for the pitch: keeper, then defenders → forwards, then number.
const POS_RANK = { GK: 0, DEF: 1, MID: 2, FWD: 3 };

// Convert a flat players array into the {starters, sub, coach, captainId} shape
// the lineup/roster UI expects. When a `formation` is given, starters are
// auto-placed on the pitch by that shape; otherwise any x/y stored on the
// player documents is kept (backward compatible).
export function rosterFromPlayers(players = [], formation) {
  const ordered = players
    .filter((p) => p.role === "player")
    .sort((a, b) => {
      const ra = POS_RANK[a.pos] ?? 9;
      const rb = POS_RANK[b.pos] ?? 9;
      if (ra !== rb) return ra - rb;
      return (a.number ?? 99) - (b.number ?? 99);
    });

  const slots = formation ? formationSlots(formation) : null;
  const starters = ordered.map((p, i) =>
    slots && slots[i] ? { ...p, x: slots[i].x, y: slots[i].y } : p
  );

  const sub = players.find((p) => p.role === "sub") || null;
  const coach = players.find((p) => p.role === "coach") || null;
  const captainId = starters.find((p) => p.isCaptain)?.id || null;
  return { starters, sub, coach, captainId };
}

// App-wide tournament data fetched from the API — replaces the old static
// mockData imports so admin edits show up across the public site immediately.
export const useDataStore = create((set) => ({
  teams: [],
  groups: [],
  matches: [],
  bracket: null,
  topScorers: [],
  loaded: false,
  error: null,

  async load() {
    try {
      const [teams, groups, matches, bracketDoc, topScorers] = await Promise.all([
        api.get("/teams").then((r) => r.data),
        api.get("/groups").then((r) => r.data),
        api.get("/matches").then((r) => r.data),
        api.get("/content/bracket").then((r) => r.data).catch(() => ({ data: null })),
        api.get("/players/top", { params: { limit: 20 } }).then((r) => r.data).catch(() => []),
      ]);
      set({
        teams,
        groups,
        matches,
        bracket: bracketDoc?.data || null,
        topScorers,
        loaded: true,
        error: null,
      });
    } catch (e) {
      set({ error: e.message, loaded: true });
    }
  },

  // Light refetch of the fast-moving data (live scores, clocks, scorers) so
  // the app stays current while it's open. Failures are silent — we keep
  // showing what we have and try again on the next tick.
  async refresh() {
    try {
      const [matches, topScorers] = await Promise.all([
        api.get("/matches").then((r) => r.data),
        api.get("/players/top", { params: { limit: 20 } }).then((r) => r.data).catch(() => null),
      ]);
      set((s) => ({ matches, topScorers: topScorers ?? s.topScorers }));
    } catch {
      /* transient network error — retry on the next interval */
    }
  },
}));

// Selector helpers.
export const useTeam = (id) => useDataStore((s) => s.teams.find((t) => t.id === id));
export const useGroup = (id) => useDataStore((s) => s.groups.find((g) => g.id === id));
