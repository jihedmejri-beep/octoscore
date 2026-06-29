import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth.js";
import { listTeams, listMatches, listQuizAdmin, listGroups, sendTestPush } from "../adminApi.js";
import { Spinner, ErrorNote } from "../components/AdminTable.jsx";

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
  const [testBusy, setTestBusy] = useState(false);
  const [testMsg, setTestMsg] = useState(null); // { ok, text }

  const handleTestPush = async () => {
    setTestBusy(true);
    setTestMsg(null);
    try {
      const { total, sent } = await sendTestPush();
      setTestMsg(
        total === 0
          ? { ok: true, text: "No one has enabled notifications yet — turn on the bell first." }
          : { ok: true, text: `Sent to ${sent} of ${total} subscribed device${total > 1 ? "s" : ""}.` }
      );
    } catch (e) {
      setTestMsg({ ok: false, text: e.message });
    } finally {
      setTestBusy(false);
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

      {/* Notifications: fire a sample push to every subscribed device. */}
      <div className="octo-card mt-6 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white">
              Match notifications
            </h3>
            <p className="mt-1 font-mono text-[11px] text-gray-400">
              Send a test alert to everyone who enabled the bell.
            </p>
          </div>
          <button
            type="button"
            onClick={handleTestPush}
            disabled={testBusy}
            className="shrink-0 rounded-2xl bg-octo-purple px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-white shadow-glow-purple transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {testBusy ? "Sending…" : "Send test"}
          </button>
        </div>
        {testMsg && (
          <p
            className={`mt-3 rounded-xl border px-3 py-2 font-mono text-[11px] ${
              testMsg.ok
                ? "border-octo-green/30 bg-octo-green/10 text-octo-green"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {testMsg.text}
          </p>
        )}
      </div>
    </div>
  );
}
