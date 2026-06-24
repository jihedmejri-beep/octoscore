// ---------------------------------------------------------------------------
// Seed source data — mirrors the frontend's mock data so the database starts in
// the exact same state the UI was designed against. The admin edits it later.
// ---------------------------------------------------------------------------

export const GROUPS = [
  { _id: "A", name: "Sousse", city: "Sousse, Tunisia", order: 0 },
  { _id: "B", name: "Teboulba", city: "Teboulba, Monastir, Tunisia", order: 1 },
];

// No demo teams — the admin adds real teams via the panel. (Kept empty so a
// re-seed never repopulates fake teams.)
export const TEAMS = [];

// 7-a-side formation (2-3-1).
const FORMATION = [
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

// Deterministic roster generator (matches the frontend's buildRoster) so the
// seeded squad lines up with what the UI rendered before the backend existed.
export function buildPlayers(teamId) {
  const seed = seedOf(teamId);
  const pick = (arr, i, off) => arr[(seed * (off + 3) + i * (off + 7)) % arr.length];
  const docs = [];

  FORMATION.forEach((p, i) => {
    const first = pick(FIRST_NAMES, i, 5);
    const last = pick(LAST_NAMES, i, 11);
    const goals = p.slot === "GK" ? 0 : (seed + i * i * 3) % 8;
    const doc = {
      _id: `${teamId}-p${i + 1}`,
      teamId,
      role: "player",
      number: i + 1,
      first,
      last,
      pos: p.pos,
      slot: p.slot,
      x: p.x,
      y: p.y,
      goals,
      isCaptain: i === 4,
    };
    if (i % 2 === 0)
      doc.instagram = `https://instagram.com/${first.toLowerCase()}.${last
        .toLowerCase()
        .replace(/\s/g, "")}`;
    else
      doc.facebook = `https://facebook.com/${first.toLowerCase()}${last
        .toLowerCase()
        .replace(/\s/g, "")}`;
    docs.push(doc);
  });

  docs.push({
    _id: `${teamId}-sub`,
    teamId,
    role: "sub",
    number: 12,
    first: pick(FIRST_NAMES, 9, 13),
    last: pick(LAST_NAMES, 9, 17),
    pos: "SUB",
    goals: (seed + 9) % 4,
  });

  docs.push({
    _id: `${teamId}-coach`,
    teamId,
    role: "coach",
    first: pick(FIRST_NAMES, 13, 19),
    last: pick(LAST_NAMES, 13, 23),
    pos: "",
  });

  return docs;
}

// No demo matches — scores/fixtures are entered by the admin.
export const MATCHES = [];

// No demo gallery — memories are added by the admin.
export const GALLERY = [];

export const QUIZ = [
  {
    _id: "q1",
    question: 'In which year did the octopus "Paul" correctly predict all of Germany\'s World Cup matches?',
    options: [{ id: "a", label: "2006" }, { id: "b", label: "2010" }, { id: "c", label: "2014" }, { id: "d", label: "2018" }],
    correctId: "b", order: 1,
  },
  {
    _id: "q2",
    question: "Which country has won the most FIFA World Cup titles?",
    options: [{ id: "a", label: "Germany" }, { id: "b", label: "Italy" }, { id: "c", label: "Brazil" }, { id: "d", label: "Argentina" }],
    correctId: "c", order: 2,
  },
  {
    _id: "q3",
    question: "How many players from each team are on the pitch in a standard match?",
    options: [{ id: "a", label: "9" }, { id: "b", label: "10" }, { id: "c", label: "11" }, { id: "d", label: "12" }],
    correctId: "c", order: 3,
  },
  {
    _id: "q4",
    question: "Which club has won the most UEFA Champions League titles?",
    options: [{ id: "a", label: "Real Madrid" }, { id: "b", label: "AC Milan" }, { id: "c", label: "Bayern Munich" }, { id: "d", label: "Liverpool" }],
    correctId: "a", order: 4,
  },
  {
    _id: "q5",
    question: "Who is the all-time top scorer of the Tunisian national team?",
    options: [{ id: "a", label: "Youssef Msakni" }, { id: "b", label: "Issam Jemâa" }, { id: "c", label: "Wahbi Khazri" }, { id: "d", label: "Francileudo Santos" }],
    correctId: "b", order: 5,
  },
];

// No demo bracket — the Tournament page stays empty until the admin builds one.
export const BRACKET = null;

export const RULES = {
  sections: [
    {
      title: "Format",
      items: [
        "16 teams split into two groups — Sousse (A) and Teboulba (B).",
        "Single-elimination knockout: Quarterfinals → Semifinals → Group Final.",
        "Group winners meet in the Grand Final at a neutral venue.",
      ],
    },
    {
      title: "Matches",
      items: [
        "7-a-side, two halves.",
        "Knockout ties before the finals are played over two legs (aggregate score).",
        "Finals are a single match; a draw goes to a penalty shootout.",
      ],
    },
    {
      title: "Conduct",
      items: [
        "Two yellow cards in one match equal a red and a one-match suspension.",
        "Respect referees, opponents, and supporters at all times.",
      ],
    },
  ],
};
