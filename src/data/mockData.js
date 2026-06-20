// ---------------------------------------------------------------------------
// OctoScore — temporary hardcoded fake data (frontend phase only).
// Shapes mirror the planned backend models so swapping to real services is easy.
// ---------------------------------------------------------------------------

export const GROUPS = {
  A: { id: "A", name: "Sousse", city: "Sousse, Tunisia" },
  B: { id: "B", name: "Teboulba", city: "Teboulba, Monastir, Tunisia" },
};

// 16 teams — 8 per group. Real logo images come from the admin later; the UI
// renders text initials in a colored crest for now.
export const TEAMS = [
  { id: "t1", name: "Sea Kings", group: "A" },
  { id: "t2", name: "Reef Raiders", group: "A" },
  { id: "t3", name: "Tide Breakers", group: "A" },
  { id: "t4", name: "Coral United", group: "A" },
  { id: "t5", name: "Pearl Divers", group: "A" },
  { id: "t6", name: "Storm Sailors", group: "A" },
  { id: "t7", name: "Anchor FC", group: "A" },
  { id: "t8", name: "Wave Hunters", group: "A" },
  { id: "t9", name: "Deep Current", group: "B" },
  { id: "t10", name: "Ink Squad", group: "B" },
  { id: "t11", name: "Harbor Lions", group: "B" },
  { id: "t12", name: "Salt Sharks", group: "B" },
  { id: "t13", name: "Blue Marlins", group: "B" },
  { id: "t14", name: "Sun Spikers", group: "B" },
  { id: "t15", name: "Net Rippers", group: "B" },
  { id: "t16", name: "Foam Fury", group: "B" },
];

export const teamById = (id) => TEAMS.find((t) => t.id === id);
export const teamsByGroup = (g) => TEAMS.filter((t) => t.group === g);

// --- Rosters (7 starters + 1 sub + 1 coach), generated deterministically -----

// 7-a-side formation (2-3-1): GK, two defenders, three midfielders, one striker.
export const FORMATION = [
  { slot: "GK", pos: "GK", x: 50, y: 88 },
  { slot: "LB", pos: "DEF", x: 26, y: 66 },
  { slot: "RB", pos: "DEF", x: 74, y: 66 },
  { slot: "LM", pos: "MID", x: 22, y: 43 },
  { slot: "CM", pos: "MID", x: 50, y: 47 },
  { slot: "RM", pos: "MID", x: 78, y: 43 },
  { slot: "ST", pos: "FWD", x: 50, y: 19 },
];

const FIRST_NAMES = [
  "Youssef", "Karim", "Mehdi", "Anis", "Sami", "Aymen", "Bilel", "Hamza",
  "Oussama", "Wael", "Nidhal", "Skander", "Firas", "Zied", "Marwen", "Rami",
  "Seif", "Iheb", "Ghaith", "Aziz", "Hedi", "Nizar", "Walid", "Tarek",
];
const LAST_NAMES = [
  "Hammami", "Belhaj", "Trabelsi", "Gharbi", "Ben Ali", "Jebali", "Mansour",
  "Khelifi", "Bouazizi", "Chaabane", "Sassi", "Ferchichi", "Mejri", "Dridi",
  "Aouadi", "Nasri", "Haddad", "Riahi", "Bouzid", "Karoui", "Ayari", "Gabsi",
];

const seedOf = (id) => [...id].reduce((a, c) => a + c.charCodeAt(0), 0);

function buildRoster(teamId) {
  const seed = seedOf(teamId);
  const pick = (arr, i, off) => arr[(seed * (off + 3) + i * (off + 7)) % arr.length];

  const starters = FORMATION.map((p, i) => {
    const first = pick(FIRST_NAMES, i, 5);
    const last = pick(LAST_NAMES, i, 11);
    const goals = p.slot === "GK" ? 0 : (seed + i * i * 3) % 8;
    const player = {
      id: `${teamId}-p${i + 1}`,
      number: i + 1,
      first,
      last,
      pos: p.pos,
      slot: p.slot,
      x: p.x,
      y: p.y,
      goals,
      isCaptain: i === 4, // central midfielder wears the armband
    };
    if (i % 2 === 0) player.instagram = `https://instagram.com/${first.toLowerCase()}.${last.toLowerCase().replace(/\s/g, "")}`;
    else player.facebook = `https://facebook.com/${first.toLowerCase()}${last.toLowerCase().replace(/\s/g, "")}`;
    return player;
  });

  const sub = {
    id: `${teamId}-sub`,
    number: 12,
    first: pick(FIRST_NAMES, 9, 13),
    last: pick(LAST_NAMES, 9, 17),
    pos: "SUB",
    goals: (seed + 9) % 4,
  };

  const coach = {
    id: `${teamId}-coach`,
    first: pick(FIRST_NAMES, 13, 19),
    last: pick(LAST_NAMES, 13, 23),
    role: "Head Coach",
  };

  return { starters, sub, coach, captainId: starters[4].id };
}

const _rosterCache = {};
export function rosterByTeam(teamId) {
  if (!_rosterCache[teamId]) _rosterCache[teamId] = buildRoster(teamId);
  return _rosterCache[teamId];
}

// --- Top scorers (Home widget) ---------------------------------------------

export const TOP_SCORERS = [
  { id: "p1", firstName: "Youssef", lastName: "Hammami", teamId: "t1", goals: 9 },
  { id: "p2", firstName: "Karim", lastName: "Belhaj", teamId: "t10", goals: 7 },
  { id: "p3", firstName: "Mehdi", lastName: "Trabelsi", teamId: "t5", goals: 6 },
  { id: "p4", firstName: "Anis", lastName: "Gharbi", teamId: "t13", goals: 5 },
  { id: "p5", firstName: "Sami", lastName: "Ben Ali", teamId: "t3", goals: 5 },
];

// --- Matches ----------------------------------------------------------------

export const MATCHES = [
  {
    id: "m1",
    homeTeamId: "t1",
    awayTeamId: "t2",
    group: "A",
    round: "QF",
    leg: "home_leg",
    status: "live",
    minute: 63,
    homeScore: 2,
    awayScore: 1,
    date: "2026-06-14T18:00:00Z",
    location: "Stade Olympique de Sousse",
    liveLink: "https://example.com/live/m1",
    prediction: { homeWin: 58, draw: 24, awayWin: 18 },
    h2h: [
      { id: "h1", date: "2025-11-02", homeId: "t1", awayId: "t2", homeScore: 2, awayScore: 0 },
      { id: "h2", date: "2025-04-18", homeId: "t2", awayId: "t1", homeScore: 1, awayScore: 1 },
      { id: "h3", date: "2024-12-09", homeId: "t1", awayId: "t2", homeScore: 3, awayScore: 1 },
    ],
  },
  {
    id: "m2",
    homeTeamId: "t10",
    awayTeamId: "t11",
    group: "B",
    round: "SF",
    leg: "home_leg",
    status: "finished",
    homeScore: 3,
    awayScore: 0,
    date: "2026-06-13T17:00:00Z",
    location: "Stade Municipal de Teboulba",
    liveLink: null,
    prediction: { homeWin: 62, draw: 21, awayWin: 17 },
    h2h: [
      { id: "h4", date: "2025-10-12", homeId: "t10", awayId: "t11", homeScore: 2, awayScore: 2 },
      { id: "h5", date: "2025-03-22", homeId: "t11", awayId: "t10", homeScore: 0, awayScore: 1 },
    ],
  },
  {
    id: "m3",
    homeTeamId: "t5",
    awayTeamId: "t6",
    group: "A",
    round: "QF",
    leg: "away_leg",
    status: "finished",
    homeScore: 1,
    awayScore: 1,
    date: "2026-06-13T15:00:00Z",
    location: "Stade Olympique de Sousse",
    liveLink: null,
    prediction: { homeWin: 45, draw: 32, awayWin: 23 },
    h2h: [
      { id: "h6", date: "2025-09-30", homeId: "t5", awayId: "t6", homeScore: 1, awayScore: 0 },
      { id: "h7", date: "2025-02-14", homeId: "t6", awayId: "t5", homeScore: 2, awayScore: 3 },
    ],
  },
  {
    id: "m4",
    homeTeamId: "t13",
    awayTeamId: "t14",
    group: "B",
    round: "QF",
    leg: "home_leg",
    status: "upcoming",
    homeScore: null,
    awayScore: null,
    date: "2026-06-15T18:00:00Z",
    location: "Stade Municipal de Teboulba",
    liveLink: null,
    prediction: { homeWin: 51, draw: 27, awayWin: 22 },
    h2h: [
      { id: "h8", date: "2025-08-19", homeId: "t13", awayId: "t14", homeScore: 2, awayScore: 1 },
    ],
  },
  {
    id: "m5",
    homeTeamId: "t3",
    awayTeamId: "t4",
    group: "A",
    round: "QF",
    leg: "home_leg",
    status: "upcoming",
    homeScore: null,
    awayScore: null,
    date: "2026-06-16T16:30:00Z",
    location: "Stade Olympique de Sousse",
    liveLink: null,
    prediction: { homeWin: 40, draw: 30, awayWin: 30 },
    h2h: [
      { id: "h9", date: "2025-07-05", homeId: "t4", awayId: "t3", homeScore: 0, awayScore: 0 },
      { id: "h10", date: "2025-01-28", homeId: "t3", awayId: "t4", homeScore: 1, awayScore: 2 },
    ],
  },
  {
    id: "m6",
    homeTeamId: "t7",
    awayTeamId: "t8",
    group: "A",
    round: "QF",
    leg: "away_leg",
    status: "finished",
    homeScore: 0,
    awayScore: 2,
    date: "2026-06-12T18:00:00Z",
    location: "Stade Olympique de Sousse",
    liveLink: null,
    prediction: { homeWin: 33, draw: 28, awayWin: 39 },
    h2h: [
      { id: "h11", date: "2025-10-01", homeId: "t8", awayId: "t7", homeScore: 2, awayScore: 1 },
    ],
  },
  {
    id: "m7",
    homeTeamId: "t13",
    awayTeamId: "t16",
    group: "B",
    round: "SF",
    leg: "home_leg",
    status: "finished",
    homeScore: 3,
    awayScore: 1,
    date: "2026-06-11T19:00:00Z",
    location: "Stade Municipal de Teboulba",
    liveLink: null,
    prediction: { homeWin: 54, draw: 23, awayWin: 23 },
    h2h: [
      { id: "h12", date: "2025-06-15", homeId: "t16", awayId: "t13", homeScore: 1, awayScore: 1 },
    ],
  },
  {
    id: "m8",
    homeTeamId: "t1",
    awayTeamId: "t10",
    group: "FINAL",
    round: "GRAND FINAL",
    leg: "final",
    status: "upcoming",
    homeScore: null,
    awayScore: null,
    date: "2026-06-28T19:00:00Z",
    location: "Stade Olympique, Radès (Neutral)",
    liveLink: null,
    prediction: { homeWin: 47, draw: 22, awayWin: 31 },
    h2h: [],
  },
];

export const matchById = (id) => MATCHES.find((m) => m.id === id);

// --- Bracket ----------------------------------------------------------------
// Two single-elimination paths (QF -> SF -> Final); winners meet in the Grand
// Final. QF/SF carry aggregate scores (two legs); finals are single matches.

export const BRACKET = {
  A: {
    qf: [
      { id: "A-qf1", homeId: "t1", awayId: "t2", homeAgg: 3, awayAgg: 1, status: "finished", winnerId: "t1" },
      { id: "A-qf2", homeId: "t3", awayId: "t4", homeAgg: 2, awayAgg: 2, status: "finished", winnerId: "t3" },
      { id: "A-qf3", homeId: "t5", awayId: "t6", homeAgg: 1, awayAgg: 0, status: "finished", winnerId: "t5" },
      { id: "A-qf4", homeId: "t7", awayId: "t8", homeAgg: 0, awayAgg: 2, status: "finished", winnerId: "t8" },
    ],
    sf: [
      { id: "A-sf1", homeId: "t1", awayId: "t3", homeAgg: 2, awayAgg: 1, status: "finished", winnerId: "t1" },
      { id: "A-sf2", homeId: "t5", awayId: "t8", homeAgg: 2, awayAgg: 3, status: "finished", winnerId: "t8" },
    ],
    final: { id: "A-final", homeId: "t1", awayId: "t8", homeAgg: 1, awayAgg: 0, status: "finished", winnerId: "t1", single: true },
  },
  B: {
    qf: [
      { id: "B-qf1", homeId: "t9", awayId: "t10", homeAgg: 1, awayAgg: 4, status: "finished", winnerId: "t10" },
      { id: "B-qf2", homeId: "t11", awayId: "t12", homeAgg: 3, awayAgg: 2, status: "finished", winnerId: "t11" },
      { id: "B-qf3", homeId: "t13", awayId: "t14", homeAgg: 2, awayAgg: 0, status: "finished", winnerId: "t13" },
      { id: "B-qf4", homeId: "t15", awayId: "t16", homeAgg: 1, awayAgg: 2, status: "finished", winnerId: "t16" },
    ],
    sf: [
      { id: "B-sf1", homeId: "t10", awayId: "t11", homeAgg: 2, awayAgg: 1, status: "finished", winnerId: "t10" },
      { id: "B-sf2", homeId: "t13", awayId: "t16", homeAgg: 3, awayAgg: 1, status: "finished", winnerId: "t13" },
    ],
    final: { id: "B-final", homeId: "t10", awayId: "t13", homeAgg: 2, awayAgg: 1, status: "finished", winnerId: "t10", single: true },
  },
  grandFinal: {
    id: "grand-final",
    homeId: "t1",
    awayId: "t10",
    status: "upcoming",
    date: "2026-06-28T19:00:00Z",
    location: "Stade Olympique, Radès",
    single: true,
  },
};

// --- Tournament gallery (memories) -----------------------------------------
// Curated "memory" tiles for the Teams page gallery. Real photos get swapped in
// by the admin later; for now each memory renders as a designed accent tile.

export const GALLERY = [
  { id: "g1", title: "Opening Night", tag: "Ceremony", date: "2026-06-01", accent: "purple", caption: "Sixteen crews marched out under the lights as the 2026 Summer Championship kicked off in Sousse." },
  { id: "g2", title: "Sea Kings Rise", tag: "Group A", date: "2026-06-12", accent: "gold", caption: "Sea Kings edged a five-goal thriller to seize top spot in Group A." },
  { id: "g3", title: "Derby Under Lights", tag: "Rivalry", date: "2026-06-08", accent: "cyan", caption: "Sousse against Teboulba lit up the coast in the tournament's fiercest night." },
  { id: "g4", title: "Golden Boot Race", tag: "Scorers", date: "2026-06-10", accent: "green", caption: "Youssef Hammami's ninth goal pulled him clear at the top of the scoring charts." },
  { id: "g5", title: "Shootout Drama", tag: "Semifinal", date: "2026-06-13", accent: "purple", caption: "Ink Squad held their nerve from the spot to book a place in the final." },
  { id: "g6", title: "Sea of Fans", tag: "Supporters", date: "2026-06-09", accent: "gold", caption: "The stands turned to color as supporters painted the night in team banners." },
  { id: "g7", title: "Coastal Clash", tag: "Quarterfinal", date: "2026-06-11", accent: "cyan", caption: "Tide Breakers and Coral United traded blows in a thriller by the harbor." },
  { id: "g8", title: "Road to the Final", tag: "Grand Final", date: "2026-06-28", accent: "green", caption: "Two survivors, one trophy — the Grand Final awaits at Stade Olympique, Radès." },
];

// --- Gamification / Quiz ----------------------------------------------------

export const USER = { xp: 1240 };

export const QUIZ_QUESTIONS = [
  {
    id: "q1",
    question:
      'In which year did the octopus "Paul" correctly predict all of Germany\'s World Cup matches?',
    options: [
      { id: "a", label: "2006" },
      { id: "b", label: "2010" },
      { id: "c", label: "2014" },
      { id: "d", label: "2018" },
    ],
    correctId: "b",
  },
  {
    id: "q2",
    question: "Which country has won the most FIFA World Cup titles?",
    options: [
      { id: "a", label: "Germany" },
      { id: "b", label: "Italy" },
      { id: "c", label: "Brazil" },
      { id: "d", label: "Argentina" },
    ],
    correctId: "c",
  },
  {
    id: "q3",
    question: "How many players from each team are on the pitch in a standard match?",
    options: [
      { id: "a", label: "9" },
      { id: "b", label: "10" },
      { id: "c", label: "11" },
      { id: "d", label: "12" },
    ],
    correctId: "c",
  },
  {
    id: "q4",
    question: "Which club has won the most UEFA Champions League titles?",
    options: [
      { id: "a", label: "Real Madrid" },
      { id: "b", label: "AC Milan" },
      { id: "c", label: "Bayern Munich" },
      { id: "d", label: "Liverpool" },
    ],
    correctId: "a",
  },
  {
    id: "q5",
    question: "Who is the all-time top scorer of the Tunisian national team?",
    options: [
      { id: "a", label: "Youssef Msakni" },
      { id: "b", label: "Issam Jemâa" },
      { id: "c", label: "Wahbi Khazri" },
      { id: "d", label: "Francileudo Santos" },
    ],
    correctId: "b",
  },
];
