import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Hero from "../components/home/Hero.jsx";
import TeamCrest from "../components/ui/TeamCrest.jsx";
import { HomeSkeleton } from "../components/ui/Skeleton.jsx";
import Footer from "../components/layout/Footer.jsx";
import useLiveClock from "../hooks/useLiveClock.js";
import { useDataStore } from "../store/dataStore";

// --- Small presentational helpers -----------------------------------------

function formatKickoff(iso, locale) {
  return new Date(iso).toLocaleString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TeamBadge({ teamId, align = "left" }) {
  const team = useDataStore((s) => s.teams.find((t) => t.id === teamId));
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <TeamCrest teamId={teamId} />
      <span className="truncate font-display text-base font-bold uppercase tracking-wide">
        {team?.name}
      </span>
    </div>
  );
}

// --- Sections --------------------------------------------------------------

function LiveBanner({ match, groupName }) {
  const { t } = useTranslation();
  // Ticking 00:00→90:00 clock from the kickoff timestamp (falls back to the
  // manual minute for matches set live before the clock existed).
  const clock = useLiveClock(match?.status === "live" ? match.kickoffAt : null);
  if (!match) {
    return (
      <div className="octo-card p-5 text-center font-mono text-xs uppercase tracking-widest text-gray-500">
        {t("home.noLive")}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-octo-purple/40 bg-gradient-to-br from-octo-purple/25 via-octo-card to-octo-card p-5 shadow-glow-purple">
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full bg-octo-green/15 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-octo-green">
          <span className="h-2 w-2 animate-pulse-live rounded-full bg-octo-green" />
          {t("home.liveNow")} · {clock ? clock.label : `${match.minute ?? 0}'`}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-wider text-gray-500">
          {groupName(match.group)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <TeamBadge teamId={match.homeTeamId} />
        <div className="shrink-0 px-1 font-display text-4xl font-bold tabular-nums sm:text-5xl sm:px-2">
          {match.homeScore}
          <span className="px-1 text-gray-600">:</span>
          {match.awayScore}
        </div>
        <TeamBadge teamId={match.awayTeamId} align="right" />
      </div>

      {match.liveLink && (
        <a
          href={match.liveLink}
          target="_blank"
          rel="noreferrer"
          className="mt-5 block rounded-2xl bg-octo-purple py-3 text-center font-display text-sm font-bold uppercase tracking-wide text-white shadow-glow-purple transition-opacity hover:opacity-90"
        >
          {t("match.watch")}
        </a>
      )}
    </div>
  );
}

function SectionTitle({ children, action }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="section-title flex items-center gap-2.5">
        <span className="h-4 w-1 rounded-full bg-octo-purple" />
        {children}
      </h2>
      {action}
    </div>
  );
}

function ResultCard({ match, groupName }) {
  // Read-at-a-glance: the winner's score stays white, the loser's dims.
  const homeLost = match.homeScore < match.awayScore;
  const awayLost = match.awayScore < match.homeScore;
  return (
    <div className="octo-card min-w-[240px] snap-start scroll-ml-4 p-4 transition duration-300 hover:-translate-y-1 hover:border-octo-purple/30">
      <div className="label-mono mb-3">
        {groupName(match.group)} · {match.round}
      </div>
      <div className="flex items-center justify-between">
        <TeamBadge teamId={match.homeTeamId} />
        <span
          className={`shrink-0 pl-2 font-display text-2xl font-bold tabular-nums ${
            homeLost ? "text-gray-600" : ""
          }`}
        >
          {match.homeScore}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <TeamBadge teamId={match.awayTeamId} />
        <span
          className={`shrink-0 pl-2 font-display text-2xl font-bold tabular-nums ${
            awayLost ? "text-gray-600" : ""
          }`}
        >
          {match.awayScore}
        </span>
      </div>
    </div>
  );
}

// Golden-boot podium: gold / silver / bronze for the top three ranks.
const RANK_COLORS = ["text-octo-gold", "text-gray-300", "text-amber-600"];

function ScorerRow({ scorer, rank }) {
  const { t } = useTranslation();
  const team = useDataStore((s) => s.teams.find((tm) => tm.id === scorer.teamId));
  const rankColor = RANK_COLORS[rank - 1] ?? "text-gray-500";
  return (
    <div className="-mx-2 flex items-center gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-white/[0.03]">
      <span className={`w-5 text-center font-mono text-base font-bold ${rankColor}`}>{rank}</span>
      <TeamCrest teamId={scorer.teamId} className="h-8 w-8 text-[11px]" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-sans text-sm font-semibold">
          {scorer.first} {scorer.last}
        </div>
        <div className="font-mono text-xs text-gray-500">{team?.name}</div>
      </div>
      <div className="text-right">
        <span className="font-display text-2xl font-bold text-octo-green">{scorer.goals}</span>
        <span className="ml-1 font-mono text-[10px] uppercase text-gray-500">{t("home.goals")}</span>
      </div>
    </div>
  );
}

function UpcomingCard({ match, locale, groupName }) {
  return (
    <Link
      to={`/matches/${match.id}`}
      className="octo-card block p-4 transition duration-300 hover:-translate-y-1 hover:border-octo-purple/30 active:scale-[0.98]"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="label-mono">
          {groupName(match.group)} · {match.round}
        </span>
        <span className="font-mono text-[11px] text-gray-500">{formatKickoff(match.date, locale)}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <TeamBadge teamId={match.homeTeamId} />
        <span className="shrink-0 px-1 font-display text-sm font-bold text-gray-600">VS</span>
        <TeamBadge teamId={match.awayTeamId} align="right" />
      </div>
      <div className="mt-3 truncate font-mono text-xs text-gray-500">{match.location}</div>
    </Link>
  );
}

// --- Page ------------------------------------------------------------------

export default function Home() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const matches = useDataStore((s) => s.matches);
  const groups = useDataStore((s) => s.groups);
  const topScorers = useDataStore((s) => s.topScorers);
  const loaded = useDataStore((s) => s.loaded);

  const [showAllScorers, setShowAllScorers] = useState(false);

  const groupName = (g) => groups.find((x) => x.id === g)?.name ?? "Final";
  const liveMatch = matches.find((m) => m.status === "live") ?? null;
  const recent = matches.filter((m) => m.status === "finished");
  const upcoming = matches.filter((m) => m.status === "upcoming");
  const sortedScorers = [...topScorers].sort((a, b) => b.goals - a.goals);
  const visibleScorers = showAllScorers ? sortedScorers : sortedScorers.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Tournament hero / introduction */}
      <section className="rise">
        <Hero />
      </section>

      {!loaded ? (
        <HomeSkeleton />
      ) : (
        <>
          {/* Live match banner */}
          <section className="rise" style={{ "--d": "80ms" }}>
            <LiveBanner match={liveMatch} groupName={groupName} />
          </section>

          {/* Recent results — horizontal rail */}
          {recent.length > 0 && (
            <section className="rise" style={{ "--d": "160ms" }}>
              <SectionTitle>{t("home.recentResults")}</SectionTitle>
              <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
                {recent.map((m) => (
                  <ResultCard key={m.id} match={m} groupName={groupName} />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming matches */}
          {upcoming.length > 0 && (
            <section className="rise" style={{ "--d": "240ms" }}>
              <SectionTitle>{t("home.upcoming")}</SectionTitle>
              <div className="space-y-3">
                {upcoming.map((m) => (
                  <UpcomingCard key={m.id} match={m} locale={locale} groupName={groupName} />
                ))}
              </div>
            </section>
          )}

          {/* Top 3 scorers widget */}
          <section id="top-scorers" className="rise scroll-mt-24" style={{ "--d": "320ms" }}>
            <SectionTitle
              action={
                sortedScorers.length > 3 ? (
                  <button
                    type="button"
                    onClick={() => setShowAllScorers((v) => !v)}
                    className="font-mono text-xs font-bold uppercase tracking-wider text-octo-purple transition-colors hover:text-octo-cyan"
                  >
                    {t(showAllScorers ? "home.showLess" : "home.seeAll")}
                  </button>
                ) : null
              }
            >
              {t("home.topScorers")}
            </SectionTitle>
            {visibleScorers.length > 0 ? (
              <div className="octo-card divide-y divide-white/5 px-4">
                {visibleScorers.map((scorer, i) => (
                  <ScorerRow key={scorer.id} scorer={scorer} rank={i + 1} />
                ))}
              </div>
            ) : (
              <div className="octo-card p-6 text-center font-mono text-xs uppercase tracking-widest text-gray-500">
                {t("home.goals")} — 0
              </div>
            )}
          </section>

          {/* Rules link — opens the tournament rules post on Instagram */}
          <section className="rise" style={{ "--d": "400ms" }}>
            <a
              href="https://www.instagram.com/p/DaK8N5cipI6/"
              target="_blank"
              rel="noreferrer"
              className="group flex w-full items-center justify-between rounded-2xl border border-octo-purple/30 bg-gradient-to-r from-octo-purple/10 to-transparent px-4 py-4 text-left transition hover:border-octo-purple/60 active:scale-[0.98]"
            >
              <span className="font-display text-sm font-bold uppercase tracking-wide">
                {t("home.rules")}
              </span>
              <span className="text-octo-purple transition-transform group-hover:translate-x-1">→</span>
            </a>
          </section>

          {/* Dedication / credits — Home page only */}
          <section className="rise" style={{ "--d": "480ms" }}>
            <Footer />
          </section>
        </>
      )}
    </div>
  );
}
