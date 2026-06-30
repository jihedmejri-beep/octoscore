import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth.js";
import {
  listTeams,
  listMatches,
  listQuizAdmin,
  listGroups,
  sendTestPush,
  sendPush,
} from "../adminApi.js";
import { Spinner, ErrorNote } from "../components/AdminTable.jsx";
import { TextField, TextAreaField } from "../components/AdminForm.jsx";

const CARDS = [
  { key: "teams", label: "Teams", to: "/admin/teams", color: "#6236FF" },
  { key: "matches", label: "Matches", to: "/admin/matches", color: "#00E5FF" },
  { key: "quiz", label: "Questions", to: "/admin/quiz", color: "#39FF14" },
  { key: "groups", label: "Groups", to: "/admin/groups", color: "#FF5CAA" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(""); // "" | "send" | "test"
  const [pushMsg, setPushMsg] = useState(null); // { ok, text }
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");

  // Turn a delivery result into the standard "Sent to X of Y devices" message.
  const deliveryNote = ({ total, sent }) =>
    total === 0
      ? { ok: true, text: "No one has enabled notifications yet — turn on the bell first." }
      : { ok: true, text: `Sent to ${sent} of ${total} subscribed device${total > 1 ? "s" : ""}.` };

  const handleTestPush = async () => {
    setBusy("test");
    setPushMsg(null);
    try {
      setPushMsg(deliveryNote(await sendTestPush()));
    } catch (e) {
      setPushMsg({ ok: false, text: e.message });
    } finally {
      setBusy("");
    }
  };

  const handleSendPush = async () => {
    if (!title.trim() || !body.trim()) {
      setPushMsg({ ok: false, text: "Add a title and a message first." });
      return;
    }
    setBusy("send");
    setPushMsg(null);
    try {
      const res = await sendPush({ title: title.trim(), body: body.trim(), url: link.trim() });
      setPushMsg(deliveryNote(res));
      setTitle("");
      setBody("");
      setLink("");
    } catch (e) {
      setPushMsg({ ok: false, text: e.message });
    } finally {
      setBusy("");
    }
  };

  useEffect(() => {
    Promise.all([listTeams(), listMatches(), listQuizAdmin(), listGroups()])
      .then(([teams, matches, quiz, groups]) =>
        setCounts({
          teams: teams.length,
          matches: matches.length,
          quiz: quiz.length,
          groups: groups.length,
        })
      )
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <div className="octo-card mb-6 overflow-hidden">
        <div className="bg-gradient-to-br from-octo-purple/25 via-octo-card to-octo-card p-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-gray-400">Welcome back</p>
          <h2 className="mt-1 font-display text-2xl font-bold uppercase tracking-wide text-white">
            {user?.name}
          </h2>
          <p className="mt-1 font-sans text-sm text-gray-400">
            Manage every part of the tournament from here.
          </p>
        </div>
      </div>

      <ErrorNote>{error}</ErrorNote>

      {!counts && !error ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CARDS.map((c) => (
            <Link
              key={c.key}
              to={c.to}
              className="octo-card group p-4 transition duration-300 hover:-translate-y-1 hover:border-octo-purple/30"
            >
              <div className="font-display text-4xl font-bold tabular-nums" style={{ color: c.color }}>
                {counts ? counts[c.key] : "—"}
              </div>
              <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-gray-400 transition-colors group-hover:text-white">
                {c.label}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Notifications: compose & broadcast a push to every subscribed device. */}
      <div className="octo-card mt-6 p-5">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white">
          Send a notification
        </h3>
        <p className="mt-1 font-mono text-[11px] text-gray-400">
          Push a custom message to everyone who enabled the bell.
        </p>

        <div className="mt-4 space-y-3">
          <TextField
            label="Title"
            placeholder="e.g. Final tonight! 🏆"
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextAreaField
            label="Message"
            rows={3}
            placeholder="What do you want to tell everyone?"
            maxLength={250}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <TextField
            label="Link (optional)"
            hint="Where tapping the notification opens, e.g. /matches or /tournament. Defaults to the home page."
            placeholder="/matches"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSendPush}
            disabled={Boolean(busy)}
            className="rounded-2xl bg-octo-purple px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-white shadow-glow-purple transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy === "send" ? "Sending…" : "Send to everyone"}
          </button>
          <button
            type="button"
            onClick={handleTestPush}
            disabled={Boolean(busy)}
            className="rounded-2xl border border-white/10 px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-gray-300 transition-colors hover:text-white disabled:opacity-50"
          >
            {busy === "test" ? "Sending…" : "Send test"}
          </button>
        </div>

        {pushMsg && (
          <p
            className={`mt-3 rounded-xl border px-3 py-2 font-mono text-[11px] ${
              pushMsg.ok
                ? "border-octo-green/30 bg-octo-green/10 text-octo-green"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {pushMsg.text}
          </p>
        )}
      </div>
    </div>
  );
}
