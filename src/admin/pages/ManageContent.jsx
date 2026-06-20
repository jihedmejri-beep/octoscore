import { useEffect, useState } from "react";

import { AdminPageHeader, Spinner, ErrorNote } from "../components/AdminTable.jsx";
import { getContent, putContent } from "../adminApi.js";

// Structured JSON editor for a single content key (e.g. "rules", "bracket").
function JsonEditor({ contentKey, title, description }) {
  const [text, setText] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getContent(contentKey)
      .then((doc) => {
        if (active) setText(JSON.stringify(doc?.data ?? {}, null, 2));
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [contentKey]);

  const save = async () => {
    setError("");
    setStatus("");
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("Invalid JSON — check your brackets, commas and quotes.");
      return;
    }
    setBusy(true);
    try {
      await putContent(contentKey, parsed);
      setStatus("Saved ✓");
      setTimeout(() => setStatus(""), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="octo-card p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold uppercase tracking-wide">{title}</h2>
          <p className="font-mono text-[11px] text-gray-500">{description}</p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={busy || text === null}
          className="shrink-0 rounded-2xl bg-octo-purple px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-white shadow-glow-purple transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>

      <ErrorNote>{error}</ErrorNote>
      {status && <p className="mb-2 font-mono text-xs text-octo-green">{status}</p>}

      {text === null ? (
        <Spinner label="Loading…" />
      ) : (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          rows={14}
          className="auth-input resize-y font-mono text-xs leading-relaxed"
        />
      )}
    </section>
  );
}

export default function ManageContent() {
  return (
    <div>
      <AdminPageHeader title="Content" subtitle="Rules & bracket (advanced JSON)" />
      <div className="space-y-5">
        <JsonEditor
          contentKey="rules"
          title="Tournament Rules"
          description="Edit the rules sections shown to fans."
        />
        <JsonEditor
          contentKey="bracket"
          title="Bracket"
          description="Knockout bracket data (groups A/B + grand final)."
        />
      </div>
    </div>
  );
}
