import { create } from "zustand";

import api from "../services/api";

// Convert a flat players array into the {starters, sub, coach, captainId} shape
// the lineup/roster UI expects.
export function rosterFromPlayers(players = []) {
  const starters = players
    .filter((p) => p.role === "player")
    .sort((a, b) => (a.number ?? 99) - (b.number ?? 99));
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
}));

// Selector helpers.
export const useTeam = (id) => useDataStore((s) => s.teams.find((t) => t.id === id));
export const useGroup = (id) => useDataStore((s) => s.groups.find((g) => g.id === id));
