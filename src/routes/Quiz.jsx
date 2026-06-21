import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Loader from "../components/ui/Loader.jsx";
import QuizBackground from "../components/quiz/QuizBackground.jsx";
import { fetchQuiz, answerQuiz } from "../services/quizService";
import { useAuthStore } from "../store/authStore";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke} className="h-5 w-5">
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke} className="h-5 w-5">
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </svg>
);
const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke} className="h-10 w-10">
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
  </svg>
);

const LETTERS = ["A", "B", "C", "D"];
const DIFFICULTY_COLOR = { easy: "#39FF14", medium: "#FFC700", hard: "#FF5C5C" };
const AUTO_ADVANCE_MS = 1400; // pause to read the result before moving on

// Small spinner shown on the chosen option while the server checks the answer.
const Spinner = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 animate-spin" {...stroke}>
    <path d="M12 3a9 9 0 1 0 9 9" />
  </svg>
);

// Small coloured difficulty chip shown on each question card.
function DifficultyChip({ level }) {
  const { t } = useTranslation();
  if (!level) return null;
  const color = DIFFICULTY_COLOR[level] || "#c084fc";
  return (
    <span
      className="inline-block rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider"
      style={{ color, backgroundColor: `${color}22`, border: `1px solid ${color}55` }}
    >
      {t(`quiz.${level}`)}
    </span>
  );
}

// Wraps every quiz screen so the esports backdrop sits behind the content.
// Module-level so it keeps a stable identity across re-renders — otherwise the
// star field would remount (and reset) on every answer.
function Arena({ children, onClick }) {
  return (
    <div className="quiz-arena relative" onClick={onClick}>
      <QuizBackground />
      <div className="relative z-10 space-y-7">{children}</div>
    </div>
  );
}

// Small esports-style header reused across every quiz screen.
function ArenaHeading() {
  const { t } = useTranslation();
  return (
    <div className="rise text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-[var(--q-p3)]">
        Octopus Tournament
      </p>
      <h1 className="quiz-neon-title mt-1.5 font-display text-4xl font-bold uppercase tracking-wide sm:text-5xl">
        {t("nav.quiz")}
      </h1>
    </div>
  );
}

// --- Results screen ---------------------------------------------------------
function Results({ score, total, xpEarned, onRestart }) {
  const { t } = useTranslation();
  const pct = total ? Math.round((score / total) * 100) : 0;
  const message =
    pct >= 80 ? t("quiz.resultGreat") : pct >= 50 ? t("quiz.resultGood") : t("quiz.resultTry");

  return (
    <div className="rise flex min-h-[55vh] flex-col items-center justify-center text-center">
      <div className="relative mb-6">
        <span className="absolute inset-0 -z-10 rounded-full bg-[rgba(147,51,234,0.4)] blur-2xl" />
        <span className="grid h-24 w-24 place-items-center rounded-full border border-[rgba(192,132,252,0.6)] bg-[rgba(124,58,237,0.2)] text-[var(--q-p3)] shadow-[0_0_30px_-6px_rgba(192,132,252,0.8)]">
          <TrophyIcon />
        </span>
      </div>

      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[rgba(192,132,252,0.8)]">
        {t("quiz.yourScore")}
      </div>
      <div className="quiz-neon-title font-display text-6xl font-bold leading-none">
        <span>{score}</span>
        <span className="text-white/30">/{total}</span>
      </div>
      <div className="mt-2 font-mono text-sm text-[var(--q-p3)]">{pct}%</div>

      {/* Reward earned this run (XP is only awarded to signed-in players, and
          only the first time each question is answered correctly). */}
      {xpEarned > 0 && (
        <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-[rgba(57,255,20,0.4)] bg-[rgba(57,255,20,0.1)] px-5 py-2.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[rgba(192,132,252,0.8)]">
            {t("quiz.reward")}
          </span>
          <span className="font-display text-2xl font-bold text-octo-green">+{xpEarned}</span>
          <span className="font-mono text-xs font-bold text-octo-green">XP</span>
        </div>
      )}

      <p className="mt-4 max-w-xs font-sans text-sm text-purple-100/70">{message}</p>

      <button
        onClick={onRestart}
        className="mt-8 rounded-2xl bg-[var(--q-p1)] px-8 py-3 font-display text-sm font-bold uppercase tracking-wide text-white shadow-[0_0_30px_-6px_rgba(147,51,234,0.9)] transition-opacity hover:opacity-90"
      >
        {t("quiz.playAgain")}
      </button>
    </div>
  );
}

// --- Quiz flow --------------------------------------------------------------
export default function Quiz() {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState(null);

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [reveal, setReveal] = useState(null); // correctId from the server
  const [pending, setPending] = useState(false);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let active = true;
    fetchQuiz()
      .then((data) => active && setQuestions(data))
      .catch(() => active && setQuestions([]));
    return () => {
      active = false;
    };
  }, []);

  // Advance to the next question, or finish on the last one. Stable identity so
  // both the auto-advance timer and tap-to-skip share one code path.
  const finishOrNext = useCallback((curStep, qs) => {
    if (!qs) return;
    if (curStep + 1 >= qs.length) {
      setFinished(true);
    } else {
      setStep(curStep + 1);
      setSelected(null);
      setAnswered(false);
      setReveal(null);
    }
  }, []);

  // Once an answer is revealed, auto-advance after a short pause. Tapping to skip
  // changes state, which re-runs this effect and clears the pending timer.
  useEffect(() => {
    if (!answered || !questions) return undefined;
    const id = setTimeout(() => finishOrNext(step, questions), AUTO_ADVANCE_MS);
    return () => clearTimeout(id);
  }, [answered, step, questions, finishOrNext]);

  const restart = () => {
    setStep(0);
    setSelected(null);
    setAnswered(false);
    setReveal(null);
    setScore(0);
    setXpEarned(0);
    setFinished(false);
  };

  if (questions === null) {
    return (
      <Arena>
        <Loader />
      </Arena>
    );
  }

  if (questions.length === 0) {
    return (
      <Arena>
        <ArenaHeading />
        <div className="quiz-glass rounded-3xl p-8 text-center font-mono text-xs uppercase tracking-widest text-purple-100/60">
          {t("matches.noMatches")}
        </div>
      </Arena>
    );
  }

  const total = questions.length;
  if (finished) {
    return (
      <Arena>
        <Results score={score} total={total} xpEarned={xpEarned} onRestart={restart} />
      </Arena>
    );
  }

  const q = questions[step];
  const progress = Math.round(((step + (answered ? 1 : 0)) / total) * 100);

  const choose = (id) => {
    if (answered || pending) return;
    setSelected(id);
    setPending(true);
    answerQuiz(q.id, id)
      .then((res) => {
        setPending(false);
        setAnswered(true);
        setReveal(res.correctId);
        if (res.correct) setScore((s) => s + 1);
        if (res.xpAwarded) setXpEarned((x) => x + res.xpAwarded);
        if (res.xp != null) useAuthStore.getState().setXp(res.xp);
      })
      .catch(() => setPending(false));
  };

  const isLast = step + 1 >= total;
  const skip = () => answered && finishOrNext(step, questions);

  return (
    // When an answer is revealed, tapping anywhere on the arena skips the wait.
    <Arena onClick={skip}>
      <ArenaHeading />

      {/* Progress: counter + bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-[rgba(192,132,252,0.8)]">
          <span>
            {t("quiz.question")} {step + 1}/{total}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full border border-[rgba(168,85,247,0.25)] bg-black/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--q-p1)] to-[var(--q-p3)] shadow-[0_0_12px_rgba(192,132,252,0.8)] transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div key={q.id} className="rise quiz-glass rounded-3xl p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-block rounded-full border border-[rgba(192,132,252,0.4)] bg-[rgba(124,58,237,0.2)] px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--q-p3)]">
            {t("quiz.question")} {step + 1}
          </span>
          <DifficultyChip level={q.difficulty} />
        </div>
        <h2 className="font-sans text-xl font-semibold normal-case leading-snug tracking-normal text-white">
          {q.question}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {q.options.map((opt, i) => {
          const isCorrect = opt.id === reveal;
          const isSelected = opt.id === selected;
          const loading = pending && isSelected;

          let cls = "quiz-option hover:-translate-y-0.5 hover:border-[rgba(192,132,252,0.6)]";
          if (loading) {
            cls = "quiz-option border-[var(--q-p3)] bg-[rgba(124,58,237,0.28)]";
          } else if (answered) {
            if (isCorrect) cls = "quiz-option quiz-option-correct";
            else if (isSelected) cls = "border border-red-500 bg-red-500/10";
            else cls = "quiz-option opacity-40";
          }

          return (
            <button
              key={opt.id}
              onClick={() => choose(opt.id)}
              disabled={pending}
              className={`flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-start transition-all duration-300 active:scale-[0.99] ${cls}`}
            >
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-mono text-sm font-bold ${
                  (answered && isCorrect) || loading
                    ? "bg-[var(--q-p3)] text-black"
                    : answered && isSelected
                    ? "bg-red-500 text-white"
                    : "bg-white/10 text-[var(--q-p3)]"
                }`}
              >
                {loading ? <Spinner /> : LETTERS[i]}
              </span>
              <span className="flex-1 font-sans text-base font-medium text-white">{opt.label}</span>
              {answered && isCorrect && (
                <span className="text-[var(--q-p3)]">
                  <CheckIcon />
                </span>
              )}
              {answered && isSelected && !isCorrect && (
                <span className="text-red-500">
                  <XIcon />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Next / Finish — auto-fires after AUTO_ADVANCE_MS; the bar shows the
          countdown and tapping it (or anywhere) skips the wait immediately. */}
      {answered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            skip();
          }}
          className="rise w-full overflow-hidden rounded-2xl bg-[var(--q-p1)] shadow-[0_0_30px_-6px_rgba(147,51,234,0.9)] transition-opacity hover:opacity-90"
        >
          <span className="flex items-center justify-center gap-2 py-4 font-display text-sm font-bold uppercase tracking-wide text-white">
            {isLast ? t("quiz.finish") : t("quiz.next")}
            <span className="font-mono text-[11px] normal-case opacity-60">· tap or wait</span>
          </span>
          <span className="block h-1 w-full bg-black/25">
            <span
              className="quiz-countdown-bar block h-full bg-white/80"
              style={{ animationDuration: `${AUTO_ADVANCE_MS}ms` }}
            />
          </span>
        </button>
      )}
    </Arena>
  );
}
