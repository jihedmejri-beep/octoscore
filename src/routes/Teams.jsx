import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import TeamCrest from "../components/ui/TeamCrest.jsx";
import { TeamGridSkeleton } from "../components/ui/Skeleton.jsx";
import { useDataStore } from "../store/dataStore";

// Accent palette cycled by the group's position, so any set of groups gets a
// distinct color (no longer assumes there are exactly two groups, A and B).
const GROUP_BADGE = [
  "bg-octo-purple/15 text-octo-purple",
  "bg-octo-cyan/15 text-octo-cyan",
  "bg-octo-gold/15 text-octo-gold",
  "bg-octo-green/15 text-octo-green",
];

function GroupBadge({ group }) {
  const groups = useDataStore((s) => s.groups);
  // With a single group every card would repeat the same name — say nothing.
  if (groups.length < 2) return null;
  const idx = groups.findIndex((g) => g.id === group);
  const name = groups[idx]?.name ?? group;
  const cls = GROUP_BADGE[(idx < 0 ? 0 : idx) % GROUP_BADGE.length];
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${cls}`}
    >
      {name}
    </span>
  );
}

function TeamCard({ team }) {
  return (
    <Link
      to={`/teams/${team.id}`}
      className="octo-card flex flex-col items-center gap-3 p-5 text-center transition duration-300 hover:-translate-y-1 hover:border-octo-purple/30 active:scale-[0.98]"
    >
      <TeamCrest teamId={team.id} name={team.name} className="h-16 w-16 text-lg" />
      <div>
        <div className="font-display text-sm font-bold uppercase leading-tight">{team.name}</div>
        <div className="mt-1.5">
          <GroupBadge group={team.group} />
        </div>
      </div>
    </Link>
  );
}

export default function Teams() {
  const { t } = useTranslation();
  const [group, setGroup] = useState("ALL");

  const allTeams = useDataStore((s) => s.teams);
  const groups = useDataStore((s) => s.groups);
  const loaded = useDataStore((s) => s.loaded);

  // Build the filter row from the real groups so a team always has a matching
  // filter (sorted by the group's display order).
  const FILTERS = ["ALL", ...[...groups].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((g) => g.id)];

  const teams = allTeams.filter((tm) => group === "ALL" || tm.group === group);
  const filterLabel = (g) =>
    g === "ALL" ? t("teams.all") : groups.find((x) => x.id === g)?.name ?? g;

  return (
    <div>
      <section className="space-y-5">
        <h1 className="section-title flex items-center gap-2.5 text-2xl">
          <span className="h-5 w-1 rounded-full bg-octo-purple" />
          {t("nav.teams")}
        </h1>

        {/* Group filter — pointless with a single group, so it hides itself */}
        {groups.length > 1 && (
          <div className="flex gap-2">
            {FILTERS.map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className={`rounded-full border px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                  group === g
                    ? "border-octo-purple bg-octo-purple/15 text-white"
                    : "border-white/10 bg-octo-card text-gray-400 hover:text-white"
                }`}
              >
                {filterLabel(g)}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {!loaded ? (
          <TeamGridSkeleton />
        ) : teams.length === 0 ? (
          <div className="octo-card p-8 text-center font-mono text-xs uppercase tracking-widest text-gray-500">
            {t("teams.notFound")}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {teams.map((team, i) => (
              <div key={team.id} className="rise" style={{ "--d": `${i * 35}ms` }}>
                <TeamCard team={team} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
