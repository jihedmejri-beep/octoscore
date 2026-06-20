// LLM-backed quiz generation — provider-agnostic.
//
// Works with any LLM that exposes the OpenAI-compatible "chat/completions" API:
// Groq, Google Gemini (its OpenAI endpoint), OpenRouter, Mistral, a local
// Ollama server, etc. Pick one by setting LLM_BASE_URL / LLM_API_KEY /
// LLM_MODEL — no code or dependency changes, and no paid SDK.
//
// When LLM_BASE_URL is unset the generator does nothing, so the app falls back
// to the hand-managed questions in the Quiz collection — same graceful pattern
// as the pluggable mailer. Uses the built-in fetch (Node 18+), no new packages.

import Quiz from "../models/Quiz.js";
import { clearCache } from "../middleware/cache.js";

const BASE_URL = (process.env.LLM_BASE_URL || "").replace(/\/$/, "");
const API_KEY = process.env.LLM_API_KEY || "";
const MODEL = process.env.LLM_MODEL || "llama-3.3-70b-versatile";

// Difficulty mix. Defaults to 2 easy / 3 medium / 2 hard (7 questions); each
// count is overridable, and the totals drive everything downstream.
const clampCount = (val, fallback) => {
  const n = Math.floor(Number(val));
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 6) : fallback;
};
const EASY = clampCount(process.env.QUIZ_EASY, 2);
const MEDIUM = clampCount(process.env.QUIZ_MEDIUM, 3);
const HARD = clampCount(process.env.QUIZ_HARD, 2);
// A sensible floor so a misconfigured mix never produces an empty quiz.
const PLAN =
  EASY + MEDIUM + HARD >= 3
    ? { easy: EASY, medium: MEDIUM, hard: HARD }
    : { easy: 2, medium: 3, hard: 2 };
const COUNT = PLAN.easy + PLAN.medium + PLAN.hard;

// Low temperature for factual accuracy — variety comes from the daily seed and
// topic rotation, not randomness. Override with QUIZ_TEMPERATURE if needed.
const TEMPERATURE = Number.isFinite(Number(process.env.QUIZ_TEMPERATURE))
  ? Number(process.env.QUIZ_TEMPERATURE)
  : 0.3;
// A second LLM pass fact-checks every answer before saving. On by default; set
// QUIZ_VERIFY=false to skip it (one fewer call per refresh, lower accuracy).
const VERIFY = process.env.QUIZ_VERIFY !== "false";
const OPTION_IDS = ["a", "b", "c", "d"];
const DIFFICULTIES = ["easy", "medium", "hard"];
const RANK = { easy: 0, medium: 1, hard: 2 };

// Enabled as soon as an endpoint is configured. The API key is optional so a
// keyless local Ollama (LLM_BASE_URL=http://localhost:11434/v1) just works.
export const isQuizGenEnabled = () => Boolean(BASE_URL);

// --- Day boundaries (drive the once-a-day auto-refresh) ---------------------
const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const startOfNextDay = (d = new Date()) => {
  const x = startOfDay(d);
  x.setDate(x.getDate() + 1);
  return x;
};

function buildPrompt() {
  // The date + nonce nudge the model to vary the set between daily refreshes.
  const nonce = `${new Date().toISOString().slice(0, 10)} #${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  return `You are an expert football (soccer) historian writing a daily trivia quiz in Modern Standard Arabic (العربية الفصحى). ACCURACY IS THE SINGLE MOST IMPORTANT REQUIREMENT — a wrong answer is far worse than an easy question.

Produce EXACTLY ${COUNT} multiple-choice questions, with this difficulty mix:
- ${PLAN.easy} EASY: facts almost every casual fan knows (famous World Cup winners, superstar players, the biggest clubs).
- ${PLAN.medium} MEDIUM: facts a regular fan knows (host countries, well-known records, famous finals, the Laws of the Game).
- ${PLAN.hard} HARD: facts only a dedicated fan knows — but still 100% indisputable and verifiable. "Hard" means LESS COMMONLY KNOWN, never uncertain, debatable, or obscure to the point of being arguable.

Rules for EVERY question, regardless of difficulty:
- Use ONLY a fact you are completely certain is correct and universally agreed upon. If you have ANY doubt, replace it with a fact you are sure of. Never guess.
- Exactly ONE correct answer and three clearly wrong but plausible options. No "all of the above", no two options that could both be correct, no opinions.
- NEVER ask "who won X more than once / several times" — many options are usually correct. Instead ask for the UNIQUE record holder ("الأكثر تتويجًا" = who won the MOST) or one specific fact (a single year's winner, a one-time event, a single all-time record). Make sure only ONE of the four options can possibly be correct.
- Avoid anything that changes over time (no "current" champion, ranking, club, or transfer). Prefer evergreen facts.
- Write EVERYTHING in Arabic script only. Do NOT use words from any other language (no Vietnamese, English, French, etc.). The only Latin letters allowed are inside a well-known person's or club's proper name. Write years as plain numbers (e.g. 2018) — never the word "year" in any language.
- Vary which option (a/b/c/d) is correct across the quiz.
- Double-check the fact before choosing correctId, and make correctId point to the truly correct option.

Respond with ONLY a JSON array — no markdown fences, no commentary. Each element must be exactly:
{"question":"…","options":[{"id":"a","label":"…"},{"id":"b","label":"…"},{"id":"c","label":"…"},{"id":"d","label":"…"}],"correctId":"a","difficulty":"easy","reason":"one short sentence stating the verifiable fact that makes correctId correct"}

The "difficulty" field must be exactly "easy", "medium", or "hard" and match the mix above. The "reason" field forces you to justify the answer — make sure it is true and matches correctId.

Variety seed: ${nonce}`;
}

// Second pass: hand the questions back to the model as a fact-checker so wrong
// answers get corrected (or shaky questions replaced) before anything is saved.
function buildVerifyPrompt(docs) {
  const payload = JSON.stringify(
    docs.map((d) => ({
      question: d.question,
      options: d.options,
      correctId: d.correctId,
      difficulty: d.difficulty,
    }))
  );
  return `You are a meticulous football (soccer) fact-checker. Below is a JSON array of Arabic trivia questions, each with a marked correct answer (correctId) and a difficulty.

Check EVERY question carefully:
- If the marked answer is factually correct AND the question is unambiguous, keep it unchanged.
- If the marked answer is wrong, set "correctId" to the option that is actually correct.
- If the question is ambiguous, has more than one correct option, is subjective, season-dependent, or you cannot verify it with full confidence, REPLACE it entirely with a new, simple, indisputable Arabic football question of the SAME difficulty (4 options, exactly one clearly correct).
- In particular, REPLACE any "won X more than once / several times" question (e.g. "who won the Ballon d'Or more than once") — these have several correct options. Use a uniquely-answerable question instead ("who won the MOST", or a specific single year/record).
- Keep each question's "difficulty" value, and make sure every question and option is written in Arabic script only, with no words from other languages.

Keep the same number of questions and the exact same JSON shape (including the "difficulty" field). Respond with ONLY the corrected JSON array — no commentary, no markdown.

Questions to check:
${payload}`;
}

// Parse + strictly validate the model's output into Quiz documents. Throws on
// any malformed item so a bad generation never replaces a good pool.
export function parseQuestions(text, count = COUNT) {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array in model output");

  const arr = JSON.parse(text.slice(start, end + 1));
  if (!Array.isArray(arr) || arr.length === 0) throw new Error("Model returned no questions");

  const docs = arr.slice(0, count).map((q, i) => {
    if (!q || typeof q.question !== "string" || !q.question.trim())
      throw new Error(`Question ${i + 1} is missing text`);
    if (!Array.isArray(q.options) || q.options.length !== 4)
      throw new Error(`Question ${i + 1} must have exactly 4 options`);

    const options = q.options.map((o, j) => {
      const label = o && typeof o.label === "string" ? o.label.trim() : "";
      if (!label) throw new Error(`Question ${i + 1} option ${j + 1} is missing a label`);
      return { id: OPTION_IDS[j], label };
    });

    const correctId = String(q.correctId || "").trim().toLowerCase();
    if (!OPTION_IDS.includes(correctId))
      throw new Error(`Question ${i + 1} has an invalid correctId`);

    const raw = String(q.difficulty || "").trim().toLowerCase();
    const difficulty = DIFFICULTIES.includes(raw) ? raw : "medium";

    return { question: q.question.trim(), options, correctId, difficulty, order: i + 1, generated: true };
  });

  return docs;
}

// Order easy → medium → hard so the quiz ramps up, then number sequentially.
function sortByDifficulty(docs) {
  return [...docs]
    .sort((a, b) => RANK[a.difficulty] - RANK[b.difficulty])
    .map((d, i) => ({ ...d, order: i + 1 }));
}

async function callLLM(prompt, count, temperature, attempt = 0) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: MODEL,
      temperature,
      max_tokens: 600 * count + 600, // room for the per-question "reason" field
      messages: [{ role: "user", content: prompt }],
    }),
  });

  // Rate limited (free tiers cap tokens-per-minute): wait out the window and
  // retry so the fact-check pass isn't dropped. Capped so we never hang long.
  if (res.status === 429 && attempt < 2) {
    const retryAfter = Number(res.headers.get("retry-after"));
    const waitMs = Math.min((Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 8) * 1000, 25000);
    await new Promise((r) => setTimeout(r, waitMs));
    return callLLM(prompt, count, temperature, attempt + 1);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LLM request failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("LLM returned an empty response");
  return text;
}

// Fact-check pass. Returns corrected questions, or the originals untouched if
// the review can't be parsed — verification never makes the set worse.
async function verifyQuestions(docs) {
  try {
    const text = await callLLM(buildVerifyPrompt(docs), docs.length, 0.2);
    const checked = parseQuestions(text, docs.length);
    if (checked.length >= Math.min(3, docs.length)) return checked;
  } catch (err) {
    console.error("Quiz verification skipped:", err.message);
  }
  return docs;
}

export async function generateQuestions() {
  const text = await callLLM(buildPrompt(), COUNT, TEMPERATURE);
  const docs = parseQuestions(text, COUNT);
  const checked = VERIFY ? await verifyQuestions(docs) : docs;
  return sortByDifficulty(checked);
}

// Force a fresh pool now. The old questions are only deleted once the new set is
// generated and validated, so a failure leaves the existing quiz intact.
export async function regenerateQuiz() {
  if (!isQuizGenEnabled())
    throw new Error("Quiz generation is not configured — set LLM_BASE_URL");
  const docs = await generateQuestions();
  await Quiz.deleteMany({});
  await Quiz.insertMany(docs);
  clearCache();
  return docs.length;
}

// Concurrency guards: one regeneration at a time, with a cooldown after a
// failure so a bad endpoint doesn't get hammered on every cache miss.
let refreshing = false;
let cooldownUntil = 0;

// Fire-and-forget daily refresh. Never blocks the request: if the newest
// generated question was made on an earlier calendar day, it regenerates in the
// background so each day gets a fresh quiz. The new set shows on a later load.
export function maybeRefreshQuiz() {
  if (!isQuizGenEnabled() || refreshing || Date.now() < cooldownUntil) return;
  refreshing = true;
  (async () => {
    try {
      const newest = await Quiz.findOne({ generated: true })
        .sort({ updatedAt: -1 })
        .select("updatedAt")
        .lean();
      // Already refreshed today → nothing to do until tomorrow.
      if (newest && new Date(newest.updatedAt) >= startOfDay()) return;

      const n = await regenerateQuiz();
      console.log(`Quiz auto-refreshed with ${n} fresh Arabic questions`);
    } catch (err) {
      cooldownUntil = Date.now() + 15 * 60 * 1000; // back off 15 min on failure
      console.error("Quiz auto-refresh failed:", err.message);
    } finally {
      refreshing = false;
    }
  })();
}

// Snapshot for the admin panel: whether AI generation is on, the difficulty
// mix, when the pool was last generated, and when the next daily refresh is due.
export async function getQuizStatus() {
  const newest = await Quiz.findOne({ generated: true })
    .sort({ updatedAt: -1 })
    .select("updatedAt")
    .lean();
  const count = await Quiz.countDocuments();
  const lastGeneratedAt = newest ? newest.updatedAt : null;
  // The refresh fires on the first quiz load of a new day, so the next refresh
  // is the start of the day after the last generation (or now, if overdue).
  const nextRefreshAt = lastGeneratedAt ? startOfNextDay(lastGeneratedAt) : new Date();

  return {
    enabled: isQuizGenEnabled(),
    count,
    lastGeneratedAt,
    nextRefreshAt,
    refreshing,
    plan: { ...PLAN, total: COUNT },
  };
}
