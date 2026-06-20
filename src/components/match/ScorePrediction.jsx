import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import TeamCrest from "../ui/TeamCrest.jsx";
import AuthModal from "../auth/AuthModal.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { useDataStore } from "../../store/dataStore";
import {
  getPredictionStats,
  getMyPrediction,
  submitPrediction,
} from "../../services/predictionService";

const outcome = (h, a) => (h > a ? "home" : h < a ? "away" : "draw");

// Shared per-outcome accent colours (home win / draw / away win).
const OUTCOME_COLOR = { home: "#39FF14", draw: "#9ca3af", away: "#6236FF" };

// Community outcome distribution (home win / draw / away win). `showGrid` adds
// the per-outcome number cards (used on finished matches, where there are no
// pick buttons carrying the percentages).
function CommunityResults({ stats, match, myPick, showGrid }) {
  const { t } = useTranslation();
  if (!stats || stats.total === 0) {
    return (
      <p className="text-center font-mono text-xs uppercase tracking-widest text-gray-500">
        {t("predict.beFirst")}
      </p>
    );
  }
  const rows = [
    { key: "home", crest: match.homeTeamId, label: null, value: stats.homePct, color: OUTCOME_COLOR.home },
    { key: "draw", crest: null, label: t("matchDetail.draw"), value: stats.drawPct, color: OUTCOME_COLOR.draw },
    { key: "away", crest: match.awayTeamId, label: null, value: stats.awayPct, color: OUTCOME_COLOR.away },
  ];
  return (
    <div className="space-y-3">
      {showGrid && (
        <div className="grid grid-cols-3 gap-2">
          {rows.map((r) => (
            <div
              key={r.key}
              className={`rounded-2xl border p-3 text-center transition-colors ${
                myPick === r.key ? "border-white/30 bg-white/[0.06]" : "border-white/5 bg-octo-elevated"
              }`}
            >
              <div className="mb-1 flex h-6 items-center justify-center">
                {r.crest ? (
                  <TeamCrest teamId={r.crest} className="h-6 w-6 text-[8px]" />
                ) : (
                  <span className="label-mono">{r.label}</span>
                )}
              </div>
              <div className="font-display text-2xl font-bold" style={{ color: r.color }}>
                {r.value}%
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex h-2.5 overflow-hidden rounded-full bg-octo-elevated">
        {rows.map((r) => (
          <div key={r.key} style={{ width: `${r.value}%`, backgroundColor: r.color }} />
        ))}
      </div>
      <p className="text-center font-mono text-[11px] text-gray-500">
        {stats.total} {t("predict.votes")}
      </p>
    </div>
  );
}

export default function ScorePrediction({ match }) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const teams = useDataStore((s) => s.teams);
  const matchId = match.id;
  const finished = match.status === "finished";

  const [stats, setStats] = useState(null);
  const [mine, setMine] = useState(null);
  const [pick, setPick] = useState(null); // null | "home" | "draw" | "away"
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null | "signin"

  const nameOf = (id) => teams.find((tm) => tm.id === id)?.name;

  const loadStats = useCallback(() => {
    getPredictionStats(matchId).then(setStats).catch(() => {});
  }, [matchId]);

  // Community stats (public).
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // The user's own pick — preselect it if it exists.
  useEffect(() => {
    if (!isAuthenticated) return;
    getMyPrediction(matchId)
      .then((m) => {
        if (!m) return;
        setMine(m);
        setPick(m.pick);
      })
      .catch(() => {});
  }, [isAuthenticated, matchId]);

  // Only treat a stored pick as the user's while they're signed in.
  const myPrediction = isAuthenticated ? mine : null;

  const submit = async () => {
    if (!pick) return;
    if (!isAuthenticated) {
      setModal("signin");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const saved = await submitPrediction(matchId, { pick });
      setMine(saved);
      loadStats();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // The three outcome choices.
  const options = [
    { key: "home", crest: match.homeTeamId, label: nameOf(match.homeTeamId) },
    { key: "draw", crest: null, label: t("matchDetail.draw") },
    { key: "away", crest: match.awayTeamId, label: nameOf(match.awayTeamId) },
  ];

  // Result feedback once the match is over and the user picked.
  let resultTag = null;
  if (finished && myPrediction && match.homeScore != null && match.awayScore != null) {
    const correct = myPrediction.pick === outcome(match.homeScore, match.awayScore);
    resultTag = correct
      ? { label: t("predict.correct"), cls: "bg-octo-green/15 text-octo-green" }
      : { label: t("predict.missed"), cls: "bg-red-500/15 text-red-400" };
  }

  const verdict =
    finished && match.homeScore != null && match.awayScore != null
      ? outcome(match.homeScore, match.awayScore)
      : null;

  const submitLabel = !isAuthenticated
    ? t("predict.signInToPredict")
    : submitting
      ? t("predict.submitting")
      : myPrediction
        ? t("predict.update")
        : t("predict.submit");

  const pickLabel = (key) => {
    const o = options.find((x) => x.key === key);
    return o?.label || key;
  };

  return (
    <div className="octo-card space-y-4 p-4">
      {finished ? (
        // Match over: no voting — show the actual result + the user's pick.
        <div className="space-y-3 text-center">
          {myPrediction ? (
            <>
              <div className="label-mono">{t("predict.yourPrediction")}</div>
              <div className="font-display text-xl font-bold uppercase">{pickLabel(myPrediction.pick)}</div>
              <div className="flex items-center justify-center gap-2">
                {resultTag && (
                  <span className={`inline-block rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider ${resultTag.cls}`}>
                    {resultTag.label}
                  </span>
                )}
                {myPrediction.awardedXp > 0 && (
                  <span className="inline-block rounded-full bg-octo-gold/15 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-octo-gold">
                    +{myPrediction.awardedXp} XP
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="font-mono text-xs uppercase tracking-widest text-gray-500">
              {t("predict.closed")}
            </p>
          )}
        </div>
      ) : (
        // Open for predictions — pick the outcome.
        <>
          <div className="label-mono text-center">{t("predict.whoWins")}</div>
          <div className="grid grid-cols-3 gap-2">
            {options.map((o) => {
              const selected = pick === o.key;
              const color = OUTCOME_COLOR[o.key];
              const hasVotes = stats && stats.total > 0;
              const pct = hasVotes ? stats[`${o.key}Pct`] : 0;
              return (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setPick(o.key)}
                  disabled={submitting}
                  className={`flex flex-col items-center gap-2 rounded-2xl border px-2 py-3 transition-all ${
                    selected
                      ? "border-octo-purple bg-octo-purple/15 shadow-glow-purple"
                      : "border-white/10 bg-octo-elevated hover:border-white/25"
                  }`}
                >
                  {o.crest ? (
                    <TeamCrest teamId={o.crest} className="h-10 w-10 text-sm" />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-octo-card font-display text-base font-bold text-gray-300">
                      X
                    </span>
                  )}
                  <span className="line-clamp-2 text-center font-display text-xs font-bold uppercase leading-tight tracking-wide">
                    {o.label}
                  </span>
                  {/* Live community win-share for this outcome */}
                  <span className="font-display text-lg font-bold leading-none" style={{ color }}>
                    {hasVotes ? `${pct}%` : "—"}
                  </span>
                  <span className="h-1.5 w-full overflow-hidden rounded-full bg-octo-card">
                    <span
                      className="block h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-center font-mono text-xs text-red-300">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={submitting || !pick}
            className="flex w-full items-center justify-center rounded-2xl bg-octo-purple py-3 font-display text-sm font-bold uppercase tracking-wide text-white shadow-glow-purple transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitLabel}
          </button>

          {myPrediction && !submitting ? (
            <p className="text-center font-mono text-[11px] text-octo-green">{t("predict.saved")}</p>
          ) : (
            <p className="text-center font-mono text-[11px] text-gray-500">{t("predict.rewardHint")}</p>
          )}
        </>
      )}

      <div className="border-t border-white/5 pt-4">
        <div className="label-mono mb-3">{t("predict.community")}</div>
        <CommunityResults
          stats={stats}
          match={match}
          myPick={verdict || myPrediction?.pick}
          showGrid={finished}
        />
      </div>

      {modal && <AuthModal key={modal} initialMode={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
