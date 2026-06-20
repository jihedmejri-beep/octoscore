import { useCallback, useEffect, useState } from "react";

import {
  AdminPageHeader,
  AdminRow,
  Spinner,
  EmptyState,
  ErrorNote,
  ConfirmDialog,
  Pill,
} from "../components/AdminTable.jsx";
import {
  AdminModal,
  useForm,
  TextField,
  NumberField,
  TextAreaField,
  SelectField,
} from "../components/AdminForm.jsx";
import {
  listQuizAdmin,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  generateQuiz,
  quizStatus,
} from "../adminApi.js";

const LETTERS = ["a", "b", "c", "d"];
const CORRECT_OPTS = LETTERS.map((l) => ({ value: l, label: l.toUpperCase() }));
const DIFFICULTY_COLOR = { easy: "#39FF14", medium: "#FFC700", hard: "#FF5C5C" };

// "2h 14m 03s" style countdown; collapses to "now" once the moment passes.
function formatCountdown(ms) {
  if (ms <= 0) return "now";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}h ${pad(m)}m ${pad(sec)}s` : `${m}m ${pad(sec)}s`;
}

export default function ManageQuiz() {
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genNote, setGenNote] = useState("");
  const [status, setStatus] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const form = useForm({
    question: "",
    a: "",
    b: "",
    c: "",
    d: "",
    correctId: "a",
    difficulty: "medium",
    order: "",
  });

  const loadStatus = useCallback(() => {
    quizStatus()
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  const load = useCallback(() => {
    listQuizAdmin()
      .then((d) => {
        setQuestions(d);
        setError("");
      })
      .catch((e) => setError(e.message));
    loadStatus();
  }, [loadStatus]);
  useEffect(() => {
    load();
  }, [load]);

  // Tick once a second to drive the live auto-refresh countdown.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.setValues({
      question: "",
      a: "",
      b: "",
      c: "",
      d: "",
      correctId: "a",
      difficulty: "medium",
      order: "",
    });
    setFormError("");
    setModal(true);
  };
  const openEdit = (q) => {
    setEditing(q);
    const byId = Object.fromEntries((q.options || []).map((o) => [o.id, o.label]));
    form.setValues({
      question: q.question,
      a: byId.a || "",
      b: byId.b || "",
      c: byId.c || "",
      d: byId.d || "",
      correctId: q.correctId || "a",
      difficulty: q.difficulty || "medium",
      order: q.order ?? "",
    });
    setFormError("");
    setModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      const v = form.values;
      const options = LETTERS.map((l) => ({ id: l, label: v[l] }));
      const body = {
        question: v.question,
        options,
        correctId: v.correctId,
        difficulty: v.difficulty,
        order: v.order === "" ? 0 : Number(v.order),
      };
      if (editing) await updateQuiz(editing.id, body);
      else await createQuiz(body);
      setModal(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteQuiz(confirm.id);
      setConfirm(null);
      load();
    } catch (e) {
      setError(e.message);
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  const answerLabel = (q) => q.options?.find((o) => o.id === q.correctId)?.label || q.correctId;

  const regenerate = async () => {
    setGenerating(true);
    setGenNote("");
    setError("");
    try {
      const res = await generateQuiz();
      setGenNote(`✓ ${res.message}`);
      load();
    } catch (e) {
      // 400 means AI generation isn't configured (no LLM_BASE_URL on the server).
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Quiz"
        subtitle={questions ? `${questions.length} questions` : ""}
        actionLabel="Add question"
        onAction={openCreate}
      />

      {/* AI generation: the quiz auto-refreshes once a day when configured; this
          button forces a fresh Arabic set on demand. */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-octo-purple/25 bg-octo-purple/5 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-white">
            AI Arabic quiz
          </p>
          <p className="font-mono text-[11px] text-gray-400">
            {status?.plan
              ? `${status.plan.easy} easy · ${status.plan.medium} medium · ${status.plan.hard} hard — auto-refreshes daily.`
              : "Auto-refreshes daily. Click to generate a fresh set now."}
          </p>

          {status?.enabled ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px]">
              <span className="text-gray-400">
                Next auto-refresh:{" "}
                <span className="font-bold text-octo-cyan">
                  {status.refreshing
                    ? "refreshing…"
                    : formatCountdown(new Date(status.nextRefreshAt).getTime() - now)}
                </span>
              </span>
              {status.lastGeneratedAt && (
                <span className="text-gray-500">
                  Last: {new Date(status.lastGeneratedAt).toLocaleString()}
                </span>
              )}
            </div>
          ) : (
            <p className="mt-1.5 font-mono text-[11px] text-gray-500">
              AI generation off — set LLM_BASE_URL to enable the daily refresh.
            </p>
          )}

          {genNote && <p className="mt-1 font-mono text-[11px] text-octo-green">{genNote}</p>}
        </div>
        <button
          type="button"
          onClick={regenerate}
          disabled={generating}
          className="shrink-0 rounded-2xl bg-octo-purple px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-white shadow-glow-purple transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {generating ? "Generating…" : "Regenerate"}
        </button>
      </div>

      <ErrorNote>{error}</ErrorNote>

      {!questions ? (
        <Spinner />
      ) : questions.length === 0 ? (
        <EmptyState>No questions yet</EmptyState>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <AdminRow
              key={q.id}
              title={q.question}
              meta={`Answer: ${answerLabel(q)}`}
              badges={
                <>
                  <Pill color="#39FF14">{q.correctId?.toUpperCase()}</Pill>
                  {q.difficulty && (
                    <Pill color={DIFFICULTY_COLOR[q.difficulty] || "#6236FF"}>{q.difficulty}</Pill>
                  )}
                </>
              }
              onEdit={() => openEdit(q)}
              onDelete={() => setConfirm(q)}
            />
          ))}
        </div>
      )}

      {modal && (
        <AdminModal
          title={editing ? "Edit question" : "Add question"}
          onClose={() => setModal(false)}
          onSubmit={submit}
          busy={busy}
          error={formError}
          submitLabel={editing ? "Save" : "Create"}
        >
          <TextAreaField label="Question" required {...form.bind("question")} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Option A" required {...form.bind("a")} />
            <TextField label="Option B" required {...form.bind("b")} />
            <TextField label="Option C" required {...form.bind("c")} />
            <TextField label="Option D" required {...form.bind("d")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <SelectField label="Correct answer" options={CORRECT_OPTS} {...form.bind("correctId")} />
            <SelectField
              label="Difficulty"
              options={[
                { value: "easy", label: "Easy" },
                { value: "medium", label: "Medium" },
                { value: "hard", label: "Hard" },
              ]}
              {...form.bind("difficulty")}
            />
            <NumberField label="Order" {...form.bind("order")} />
          </div>
        </AdminModal>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete question"
        message={confirm ? "Delete this question?" : ""}
        busy={busy}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
