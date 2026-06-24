import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import TeamCrest from "../components/ui/TeamCrest.jsx";
import Loader from "../components/ui/Loader.jsx";
import { useDataStore } from "../store/dataStore";
import { buildBracket } from "../lib/bracket.js";

// --- Decorative octopus mark (line-art, on-theme) --------------------------
function Octopus({ className = "h-10 w-10" }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M28 42a22 18 0 0 1 44 0v5a22 16 0 0 1-44 0z" />
      <circle cx="42" cy="40" r="2.6" fill="currentColor" stroke="none" />
      <circle cx="58" cy="40" r="2.6" fill="currentColor" stroke="none" />
      <path d="M30 52c-6 6-10 6-16 14M38 56c-4 8-10 10-12 20M50 58c0 9-2 14-2 24M62 56c4 8 10 10 12 20M70 52c6 6 10 6 16 14" />
    </svg>
  );
}

const TrophyIcon = ({ className = "h-7 w-7" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
    <path d="m5 12 5 5L20 7" />
  </svg>
);

// --- Bracket match card -----------------------------------------------------
function TeamRow({ teamId, score, isWinner }) {
  const team = useDataStore((s) => s.teams.find((t) => t.id === teamId));
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 transition-colors ${
        isWinner ? "bg-octo-purple/12" : ""
      }`}
    >
      <Link to={`/teams/${teamId}`} className="flex min-w-0 items-center gap-2.5">
        <TeamCrest teamId={teamId} className="h-7 w-7 text-[10px]" />
        <span
          className={`truncate font-display text-sm font-bold uppercase tracking-wide ${
            isWinner ? "text-white" : "text-gray-500"
          }`}
        >
          {team?.name}
        </span>
      </Link>
      <span className="flex items-center gap-2">
        {isWinner && (
          <span className="text-octo-green">
            <CheckIcon />
          </span>
        )}
        <span
          className={`font-mono text-base font-bold tabular-nums ${
            isWinner ? "text-octo-green" : "text-gray-500"
          }`}
        >
          {score ?? "-"}
        </span>
      </span>
    </div>
  );
}

function BracketMatch({ match, label }) {
  const twoLeg = !match.single;
  return (
    <div className="octo-card p-2.5">
      <div className="mb-1.5 flex items-center justify-between px-1">
        <span className="label-mono">{label}</span>
        {twoLeg && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-octo-purple">Agg</span>
        )}
      </div>
      <TeamRow teamId={match.homeId} score={match.homeAgg} isWinner={match.winnerId === match.homeId} />
      <TeamRow teamId={match.awayId} score={match.awayAgg} isWinner={match.winnerId === match.awayId} />
    </div>
  );
}

// Converging tentacle connector between rounds.
function Connector() {
  return (
    <div className="flex justify-center py-1.5" aria-hidden>
      <svg viewBox="0 0 120 36" className="h-7 w-28 text-octo-purple/50" fill="none"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M14 2c0 14 20 16 46 16M106 2c0 14-20 16-46 16" />
        <path d="M60 18v14" />
        <circle cx="60" cy="33" r="2.2" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}

function RoundLabel({ children }) {
  return (
    <div className="mb-2 mt-1 flex items-center justify-center gap-2">
      <span className="h-px w-6 bg-white/10" />
      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-gray-400">{children}</span>
      <span className="h-px w-6 bg-white/10" />
    </div>
  );
}

function GroupWinnerBadge({ teamId }) {
  const { t } = useTranslation();
  const team = useDataStore((s) => s.teams.find((tm) => tm.id === teamId));
  return (
    <div className="mt-2 flex items-center justify-center gap-3 rounded-2xl border border-octo-green/40 bg-octo-green/10 px-4 py-3 shadow-glow-green">
      <TeamCrest teamId={teamId} className="h-9 w-9 text-xs" />
      <div className="text-left">
        <div className="label-mono text-octo-green/80">{t("tournament.groupWinner")}</div>
        <div className="font-display text-lg font-bold uppercase leading-none">{team?.name}</div>
      </div>
    </div>
  );
}

// --- A full group path (QF -> SF -> Final) ----------------------------------
function GroupPath({ groupId, data, delay }) {
  const { t } = useTranslation();
  const group = useDataStore((s) => s.groups.find((g) => g.id === groupId));
  if (!data) return null;

  const hasQf = data.qf?.length > 0;
  const hasSf = data.sf?.length > 0;
  const hasFinal = Boolean(data.final);

  return (
    <section className="rise" style={{ "--d": `${delay}ms` }}>
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border border-octo-purple/30 bg-octo-purple/10 text-octo-purple">
          <Octopus className="h-7 w-7" />
        </span>
        <div>
          <h2 className="font-display text-2xl font-bold uppercase leading-none">
            {group?.name} {t("tournament.path")}
          </h2>
          <p className="font-mono text-[11px] text-gray-500">{group?.city}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/[0.05] bg-white/[0.015] p-3">
        {hasQf && (
          <>
            <RoundLabel>{t("tournament.quarterfinals")}</RoundLabel>
            <div className="grid grid-cols-2 gap-2.5">
              {data.qf.map((m) => (
                <BracketMatch key={m.id} match={m} label="QF" />
              ))}
            </div>
          </>
        )}

        {hasQf && hasSf && <Connector />}

        {hasSf && (
          <>
            <RoundLabel>{t("tournament.semifinals")}</RoundLabel>
            <div className="grid grid-cols-2 gap-2.5">
              {data.sf.map((m) => (
                <BracketMatch key={m.id} match={m} label="SF" />
              ))}
            </div>
          </>
        )}

        {(hasQf || hasSf) && hasFinal && <Connector />}

        {hasFinal && (
          <>
            <RoundLabel>{t("tournament.groupFinal")}</RoundLabel>
            <div className="mx-auto max-w-[260px]">
              <BracketMatch match={data.final} label={t("tournament.final")} />
              {data.final.winnerId && <GroupWinnerBadge teamId={data.final.winnerId} />}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// --- Page -------------------------------------------------------------------
export default function Tournament() {
  const { t, i18n } = useTranslation();
  const matches = useDataStore((s) => s.matches);
  const groups = useDataStore((s) => s.groups);
  const teams = useDataStore((s) => s.teams);
  const loaded = useDataStore((s) => s.loaded);

  // The bracket is derived from the matches the admin enters — no separate
  // hand-maintained bracket document.
  const bracket = useMemo(() => buildBracket(matches, groups), [matches, groups]);
  const isEmpty = Object.keys(bracket).length === 0;

  const nameOf = (id) => teams.find((tm) => tm.id === id)?.name;

  return (
    <div className="space-y-10">
      {/* Hero */}
      <header className="rise relative overflow-hidden rounded-3xl border border-white/[0.07] bg-octo-card p-6 text-center shadow-card">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-0 -translate-x-1/2 text-octo-purple/10">
          <Octopus className="h-40 w-40" />
        </div>
        <div className="relative">
          <h1 className="font-display text-4xl font-bold uppercase leading-[0.95] text-white">
            {t("tournament.title")}
          </h1>
          <p className="mt-2 font-sans text-sm text-gray-400">{t("tournament.subtitle")}</p>
        </div>
      </header>

      {!loaded ? (
        <Loader />
      ) : isEmpty ? (
        <div className="octo-card p-8 text-center font-mono text-xs uppercase tracking-widest text-gray-500">
          {t("matches.noMatches")}
        </div>
      ) : (
        <>
          {Object.keys(bracket)
            .filter((k) => k !== "grandFinal")
            .map((groupId, i) => (
              <GroupPath key={groupId} groupId={groupId} data={bracket[groupId]} delay={80 + i * 80} />
            ))}

          {/* Grand Final */}
          {bracket.grandFinal && (
            <section className="rise" style={{ "--d": "240ms" }}>
              <div className="relative overflow-hidden rounded-3xl border border-octo-purple/40 bg-gradient-to-b from-octo-purple/20 via-octo-card to-octo-card p-6 text-center shadow-glow-purple">
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full border border-octo-purple/50 bg-octo-purple/15 text-octo-green shadow-glow-purple">
                  <TrophyIcon className="h-8 w-8" />
                </div>
                <h2 className="font-display text-2xl font-bold uppercase text-white">
                  {t("tournament.grandFinal")}
                </h2>
                <p className="mb-5 font-mono text-[11px] uppercase tracking-widest text-gray-500">
                  {bracket.grandFinal.location}
                </p>

                <div className="mb-5 flex items-center justify-center gap-4">
                  <Link to={`/teams/${bracket.grandFinal.homeId}`} className="flex flex-col items-center gap-2">
                    <TeamCrest teamId={bracket.grandFinal.homeId} className="h-14 w-14 text-base" />
                    <span className="font-display text-sm font-bold uppercase">{nameOf(bracket.grandFinal.homeId)}</span>
                  </Link>
                  <span className="font-display text-2xl font-bold text-octo-purple">VS</span>
                  <Link to={`/teams/${bracket.grandFinal.awayId}`} className="flex flex-col items-center gap-2">
                    <TeamCrest teamId={bracket.grandFinal.awayId} className="h-14 w-14 text-base" />
                    <span className="font-display text-sm font-bold uppercase">{nameOf(bracket.grandFinal.awayId)}</span>
                  </Link>
                </div>

                {bracket.grandFinal.date && (
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-octo-elevated px-4 py-1.5 font-mono text-xs text-gray-300">
                    {new Date(bracket.grandFinal.date).toLocaleString(i18n.language, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}

                {bracket.grandFinal.id && (
                  <Link
                    to={`/matches/${bracket.grandFinal.id}`}
                    className="block rounded-2xl bg-octo-purple py-3 font-display text-sm font-bold uppercase tracking-wide text-white shadow-glow-purple transition-opacity hover:opacity-90"
                  >
                    {t("tournament.viewFinal")}
                  </Link>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
