import Quiz from "../models/Quiz.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import {
  maybeRefreshQuiz,
  regenerateQuiz,
  isQuizGenEnabled,
  getQuizStatus,
} from "../services/quizGenerator.js";

const XP_PER_CORRECT = 20;

// Strip the answer key for public consumption.
const publicQuestion = (q) => {
  const obj = q.toJSON();
  delete obj.correctId;
  return obj;
};

// GET /api/quiz  (public — no answer keys)
export const getQuiz = asyncHandler(async (req, res) => {
  maybeRefreshQuiz(); // background daily refresh when AI generation is enabled
  const questions = await Quiz.find().sort({ order: 1 });
  res.json(questions.map(publicQuestion));
});

// POST /api/quiz/generate (admin) — force a fresh AI-generated quiz now.
export const generateQuiz = asyncHandler(async (req, res) => {
  if (!isQuizGenEnabled())
    throw new ApiError(400, "AI quiz generation is not configured (set LLM_BASE_URL)");
  const count = await regenerateQuiz();
  res.json({ message: `Generated ${count} new questions`, count });
});

// GET /api/quiz/status (admin) — AI config + next daily auto-refresh time.
export const quizStatus = asyncHandler(async (req, res) => {
  res.json(await getQuizStatus());
});

// GET /api/quiz/manage  (admin — includes correctId)
export const getQuizAdmin = asyncHandler(async (req, res) => {
  const questions = await Quiz.find().sort({ order: 1 });
  res.json(questions);
});

// POST /api/quiz/submit  (optional auth — awards XP when logged in)
// body: { answers: { [questionId]: optionId } }
export const submitQuiz = asyncHandler(async (req, res) => {
  const answers = req.body.answers || {};
  const questions = await Quiz.find();

  const results = questions.map((q) => {
    const chosen = answers[q.id] ?? null;
    const correct = chosen !== null && chosen === q.correctId;
    return { questionId: q.id, chosen, correctId: q.correctId, correct };
  });

  const score = results.filter((r) => r.correct).length;
  let xpAwarded = 0;

  if (req.user) {
    // Award XP only for questions answered correctly for the first time — the
    // quiz can be replayed freely, but XP can't be farmed by resubmitting.
    const earned = new Set(req.user.quizAnswered || []);
    const freshlyCorrect = results.filter((r) => r.correct && !earned.has(r.questionId));
    if (freshlyCorrect.length) {
      freshlyCorrect.forEach((r) => earned.add(r.questionId));
      req.user.quizAnswered = [...earned];
      xpAwarded = freshlyCorrect.length * XP_PER_CORRECT;
      req.user.xp += xpAwarded;
      await req.user.save();
    }
  }

  res.json({
    score,
    total: questions.length,
    xpAwarded,
    xp: req.user ? req.user.xp : null,
    results,
  });
});

// POST /api/quiz/:id/answer  (optional auth) — check a single answer.
export const answerQuestion = asyncHandler(async (req, res) => {
  const q = await Quiz.findById(req.params.id);
  if (!q) throw new ApiError(404, "Question not found");

  const chosen = req.body.optionId ?? null;
  const correct = chosen !== null && chosen === q.correctId;
  let xpAwarded = 0;

  if (correct && req.user) {
    // First correct answer for this question only — see submitQuiz.
    const earned = new Set(req.user.quizAnswered || []);
    if (!earned.has(q.id)) {
      earned.add(q.id);
      req.user.quizAnswered = [...earned];
      xpAwarded = XP_PER_CORRECT;
      req.user.xp += xpAwarded;
      await req.user.save();
    }
  }

  res.json({ correct, correctId: q.correctId, xpAwarded, xp: req.user?.xp ?? null });
});

// POST /api/quiz (admin)
export const createQuestion = asyncHandler(async (req, res) => {
  const q = await Quiz.create(req.body);
  res.status(201).json(q);
});

// PUT /api/quiz/:id (admin)
export const updateQuestion = asyncHandler(async (req, res) => {
  const q = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!q) throw new ApiError(404, "Question not found");
  res.json(q);
});

// DELETE /api/quiz/:id (admin)
export const deleteQuestion = asyncHandler(async (req, res) => {
  const q = await Quiz.findByIdAndDelete(req.params.id);
  if (!q) throw new ApiError(404, "Question not found");
  res.json({ message: "Question deleted" });
});
