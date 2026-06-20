import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import TeamCrest from "../components/ui/TeamCrest.jsx";
import Loader from "../components/ui/Loader.jsx";
import { Pin, StatusBadge } from "../components/ui/icons.jsx";
import { useDataStore } from "../store/dataStore";

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors ${
        active
          ? "border-octo-purple bg-octo-purple/15 text-white"
          : "border-white/10 bg-octo-card text-gray-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function MatchCard({ match }) {
  const { t, i18n } = useTranslation();
  const home = useDataStore((s) => s.teams.find((tm) => tm.id === match.homeTeamId));
  const away = useDataStore((s) => s.teams.find((tm) => tm.id === match.awayTeamId));
  const groups = useDataStore((s) => s.groups);
  const played = match.status !== "upcoming";
  const groupLabel =
    match.group === "FINAL"
      ? t("matches.final")
      : groups.find((g) => g.id === match.group)?.name ?? match.group;

  const time = new Date(match.date).toLocaleString(i18n.language, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      to={`/matches/${match.id}`}
      className="octo-card block p-4 transition duration-300 hover:-translate-y-1 hover:border-octo-purple/30"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="label-mono truncate">
          {groupLabel} · {match.round}
        </span>
        <StatusBadge status={match.status} minute={match.minute} />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
        {/* Home */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <TeamCrest teamId={match.homeTeamId} className="h-8 w-8 shrink-0 text-xs sm:h-9 sm:w-9" />
          <span className="truncate font-display text-sm font-bold uppercase tracking-wide">
            {home?.name}
          </span>
        </div>

        {/* Score (played) or VS (upcoming) */}
        <div className="shrink-0 px-1 text-center">
          {played ? (
            <div className="font-display text-2xl font-bold tabular-nums">
              {match.homeScore}
              <span className="px-1 text-gray-600">:</span>
              {match.awayScore}
            </div>
          ) : (
            <div className="font-display text-sm font-bold text-gray-600">VS</div>
          )}
        </div>

        {/* Away */}
        <div className="flex min-w-0 items-center justify-end gap-2 text-right sm:gap-2.5">
          <span className="truncate font-display text-sm font-bold uppercase tracking-wide">
            {away?.name}
          </span>
          <TeamCrest teamId={match.awayTeamId} className="h-8 w-8 shrink-0 text-xs sm:h-9 sm:w-9" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/5 pt-3 font-mono text-[11px] text-gray-500">
        <span className="flex min-w-0 items-center gap-1.5">
          <Pin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{match.location}</span>
        </span>
        {!played && <span className="shrink-0 text-gray-400">{time}</span>}
      </div>
    </Link>
  );
}

const GROUP_FILTERS = ["ALL", "A", "B", "FINAL"];
const STATUS_FILTERS = ["ALL", "upcoming", "live", "finished"];

export default function Matches() {
  const { t } = useTranslation();
  const [group, setGroup] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const matches = useDataStore((s) => s.matches);
  const groups = useDataStore((s) => s.groups);
  const loaded = useDataStore((s) => s.loaded);

  const groupName = (g) =>
    g === "ALL"
      ? t("matches.allGroups")
      : g === "FINAL"
      ? t("matches.final")
      : groups.find((x) => x.id === g)?.name ?? g;

  const filtered = matches
    .filter((m) => (group === "ALL" || m.group === group) && (status === "ALL" || m.status === status))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="space-y-5">
      <h1 className="section-title flex items-center gap-2.5 text-2xl">
        <span className="h-5 w-1 rounded-full bg-octo-purple" />
        {t("nav.matches")}
      </h1>

      {/* Filters */}
      <div className="space-y-2">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {GROUP_FILTERS.map((g) => (
            <FilterChip key={g} active={group === g} onClick={() => setGroup(g)}>
              {groupName(g)}
            </FilterChip>
          ))}
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {STATUS_FILTERS.map((s) => (
            <FilterChip key={s} active={status === s} onClick={() => setStatus(s)}>
              {s === "ALL" ? t("matches.allStatus") : t(`match.${s}`)}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* List */}
      {!loaded ? (
        <Loader />
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((m, i) => (
            <div key={m.id} className="rise" style={{ "--d": `${i * 50}ms` }}>
              <MatchCard match={m} />
            </div>
          ))}
        </div>
      ) : (
        <div className="octo-card p-8 text-center font-mono text-xs uppercase tracking-widest text-gray-500">
          {t("matches.noMatches")}
        </div>
      )}
    </div>
  );
}
