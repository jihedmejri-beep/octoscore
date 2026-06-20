import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import TeamCrest from "../components/ui/TeamCrest.jsx";
import GoalBalls from "../components/ui/GoalBalls.jsx";
import Pitch from "../components/team/Pitch.jsx";
import PlayerModal from "../components/team/PlayerModal.jsx";
import ScorePrediction from "../components/match/ScorePrediction.jsx";
import Loader from "../components/ui/Loader.jsx";
import { ArrowLeft, Pin, Play, StatusBadge } from "../components/ui/icons.jsx";
import { fetchPlayers } from "../services/playerService";
import { useDataStore, rosterFromPlayers } from "../store/dataStore";

function SectionHeader({ children }) {
  return (
    <h2 className="mb-3 flex items-center gap-2.5 font-display text-lg font-bold uppercase tracking-wide">
      <span className="h-4 w-1 rounded-full bg-octo-purple" />
      {children}
    </h2>
  );
}

// Head-to-head, results coloured from the current home team's perspective.
function HeadToHead({ match }) {
  const { t, i18n } = useTranslation();
  const refTeam = match.homeTeamId;
  if (!match.h2h?.length) {
    return (
      <div className="octo-card p-6 text-center font-mono text-xs uppercase tracking-widest text-gray-500">
        {t("matchDetail.noHistory")}
      </div>
    );
  }
  return (
    <div className="octo-card divide-y divide-white/5">
      {match.h2h.map((g, idx) => {
        const refIsHome = g.homeId === refTeam;
        const refScore = refIsHome ? g.homeScore : g.awayScore;
        const oppScore = refIsHome ? g.awayScore : g.homeScore;
        const result = refScore > oppScore ? "win" : refScore < oppScore ? "loss" : "draw";
        const dot =
          result === "win" ? "bg-octo-green" : result === "loss" ? "bg-red-500" : "bg-gray-500";
        const date = new Date(g.date).toLocaleDateString(i18n.language, {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        return (
          <div key={g.id || idx} className="flex items-center gap-3 px-4 py-3">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
            <div className="flex flex-1 items-center gap-2">
              <TeamCrest teamId={g.homeId} className="h-6 w-6 text-[9px]" />
              <span className="font-mono text-sm font-bold tabular-nums">
                {g.homeScore} - {g.awayScore}
              </span>
              <TeamCrest teamId={g.awayId} className="h-6 w-6 text-[9px]" />
            </div>
            <span className="font-mono text-[11px] text-gray-500">{date}</span>
          </div>
        );
      })}
    </div>
  );
}

// Starting lineup with home/away tabs.
function Lineup({ match, rosters, onPlayer, goalsByPlayer }) {
  const { t } = useTranslation();
  const [side, setSide] = useState("home");
  const teams = useDataStore((s) => s.teams);
  const nameOf = (id) => teams.find((tm) => tm.id === id)?.name;

  const teamId = side === "home" ? match.homeTeamId : match.awayTeamId;
  const accent = side === "home" ? "#6236FF" : "#00E5FF";
  const roster = rosters[teamId];

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex gap-2 rounded-full border border-white/10 bg-octo-card p-1">
        {["home", "away"].map((s) => {
          const id = s === "home" ? match.homeTeamId : match.awayTeamId;
          return (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-2 py-2 font-display text-sm font-bold uppercase tracking-wide transition-colors ${
                side === s ? "bg-octo-purple text-white" : "text-gray-400"
              }`}
            >
              <TeamCrest teamId={id} className="h-5 w-5 shrink-0 text-[8px]" />
              <span className="truncate">{nameOf(id)}</span>
            </button>
          );
        })}
      </div>

      {!roster ? (
        <Loader />
      ) : (
        <>
          {roster.starters.length > 0 && (
            <Pitch
              starters={roster.starters}
              accent={accent}
              onPlayerClick={(p) => onPlayer(p, teamId)}
              goalsByPlayer={goalsByPlayer}
            />
          )}

          {/* Bench + coach */}
          <div className="grid grid-cols-2 gap-3">
            {roster.sub && (
              <button
                onClick={() => onPlayer(roster.sub, teamId)}
                className="octo-card flex items-center gap-3 p-3 text-left"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-octo-elevated font-mono text-xs font-bold text-gray-300">
                  {roster.sub.number}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="label-mono">{t("matchDetail.substitute")}</div>
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-sans text-sm font-semibold">
                      {roster.sub.first} {roster.sub.last}
                    </span>
                    <GoalBalls count={goalsByPlayer?.[roster.sub.id] || 0} size={12} />
                  </div>
                </div>
              </button>
            )}
            {roster.coach && (
              <div className="octo-card flex items-center gap-3 p-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-octo-elevated text-octo-green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                    <circle cx="12" cy="8" r="3.2" />
                    <path d="M5 20a7 7 0 0 1 14 0" strokeLinecap="round" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <div className="label-mono">{t("matchDetail.coach")}</div>
                  <div className="truncate font-sans text-sm font-semibold">
                    {roster.coach.first} {roster.coach.last}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function MatchDetail() {
  const { t, i18n } = useTranslation();
  const { matchId } = useParams();
  const matches = useDataStore((s) => s.matches);
  const teams = useDataStore((s) => s.teams);
  const loaded = useDataStore((s) => s.loaded);
  const [selected, setSelected] = useState(null);
  const [rosters, setRosters] = useState({});

  const match = matches.find((m) => m.id === matchId) || null;

  // playerId -> goals scored in this match (drives the lineup goal balls).
  const goalsByPlayer = useMemo(() => {
    const map = {};
    for (const s of match?.scorers || []) {
      if (s.playerId) map[s.playerId] = (map[s.playerId] || 0) + (s.goals || 1);
    }
    return map;
  }, [match]);

  // playerId -> { name, teamId } from the loaded squads, used to render the
  // scorer names under the score.
  const playerIndex = useMemo(() => {
    const idx = {};
    for (const tid of [match?.homeTeamId, match?.awayTeamId]) {
      const r = rosters[tid];
      if (!r) continue;
      for (const p of [...(r.starters || []), r.sub, r.coach].filter(Boolean)) {
        idx[p.id] = { name: `${p.first} ${p.last}`.trim(), teamId: tid };
      }
    }
    return idx;
  }, [rosters, match]);

  useEffect(() => {
    if (!match) return undefined;
    let active = true;
    Promise.all([
      fetchPlayers({ teamId: match.homeTeamId }),
      fetchPlayers({ teamId: match.awayTeamId }),
    ])
      .then(([h, a]) => {
        if (!active) return;
        setRosters({
          [match.homeTeamId]: rosterFromPlayers(h),
          [match.awayTeamId]: rosterFromPlayers(a),
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [match]);

  if (!loaded) return <Loader />;

  if (!match) {
    return (
      <div className="py-20 text-center">
        <p className="font-mono text-sm text-gray-400">{t("matchDetail.notFound")}</p>
        <Link to="/matches" className="mt-3 inline-block font-display text-sm font-bold uppercase text-octo-purple">
          {t("matchDetail.backToMatches")}
        </Link>
      </div>
    );
  }

  const home = teams.find((tm) => tm.id === match.homeTeamId);
  const away = teams.find((tm) => tm.id === match.awayTeamId);
  const played = match.status !== "upcoming";
  const dateStr = new Date(match.date).toLocaleString(i18n.language, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Split the recorded scorers into the two teams (resolved to player names).
  const homeScorers = [];
  const awayScorers = [];
  for (const s of match.scorers || []) {
    const info = playerIndex[s.playerId];
    if (!info) continue;
    const entry = { id: s.playerId, name: info.name, goals: s.goals || 1 };
    (info.teamId === match.homeTeamId ? homeScorers : awayScorers).push(entry);
  }
  const hasScorers = homeScorers.length > 0 || awayScorers.length > 0;

  return (
    <div className="space-y-7">
      {/* Back */}
      <Link
        to="/matches"
        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-gray-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("matchDetail.backToMatches")}
      </Link>

      {/* Score header */}
      <div className="rise relative overflow-hidden rounded-3xl border border-octo-purple/30 bg-gradient-to-b from-octo-purple/15 via-octo-card to-octo-card p-6 shadow-card">
        <div className="mb-5 flex justify-center">
          <StatusBadge status={match.status} minute={match.minute} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Link to={`/teams/${match.homeTeamId}`} className="flex flex-1 flex-col items-center gap-2.5">
            <TeamCrest teamId={match.homeTeamId} className="h-16 w-16 text-lg" />
            <span className="text-center font-display text-sm font-bold uppercase">{home?.name}</span>
          </Link>
          <div className="shrink-0 text-center">
            {played ? (
              <div className="font-display text-5xl font-bold tabular-nums">
                {match.homeScore}
                <span className="px-1.5 text-gray-600">:</span>
                {match.awayScore}
              </div>
            ) : (
              <div className="font-display text-2xl font-bold text-octo-purple">VS</div>
            )}
          </div>
          <Link to={`/teams/${match.awayTeamId}`} className="flex flex-1 flex-col items-center gap-2.5">
            <TeamCrest teamId={match.awayTeamId} className="h-16 w-16 text-lg" />
            <span className="text-center font-display text-sm font-bold uppercase">{away?.name}</span>
          </Link>
        </div>

        {/* Goal scorers, split by team (like a live result card) */}
        {played && hasScorers && (
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-white/5 pt-4">
            <div className="space-y-1.5">
              {homeScorers.map((s) => (
                <div key={s.id} className="flex items-center gap-1.5">
                  <GoalBalls count={s.goals} size={11} />
                  <span className="truncate font-sans text-xs text-gray-300">
                    {s.name}
                    {s.goals > 1 && <span className="text-gray-500"> ×{s.goals}</span>}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              {awayScorers.map((s) => (
                <div key={s.id} className="flex items-center justify-end gap-1.5">
                  <span className="truncate text-right font-sans text-xs text-gray-300">
                    {s.name}
                    {s.goals > 1 && <span className="text-gray-500"> ×{s.goals}</span>}
                  </span>
                  <GoalBalls count={s.goals} size={11} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 space-y-1 border-t border-white/5 pt-4 text-center">
          <div className="flex items-center justify-center gap-1.5 font-mono text-[11px] text-gray-300">
            <Pin className="h-3.5 w-3.5" />
            {match.location}
          </div>
          <div className="font-mono text-[11px] text-gray-500">{dateStr}</div>
        </div>

        {match.liveLink && (
          <a
            href={match.liveLink}
            target="_blank"
            rel="noreferrer"
            className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-octo-purple py-3 font-display text-sm font-bold uppercase tracking-wide text-white shadow-glow-purple transition-opacity hover:opacity-90"
          >
            <Play className="h-4 w-4" />
            {t("matchDetail.watchLive")}
          </a>
        )}
      </div>

      {/* Score prediction (user voting + community results) */}
      <section className="rise" style={{ "--d": "80ms" }}>
        <SectionHeader>{t("predict.title")}</SectionHeader>
        <ScorePrediction match={match} />
      </section>

      {/* Head to head */}
      <section className="rise" style={{ "--d": "160ms" }}>
        <SectionHeader>{t("matchDetail.headToHead")}</SectionHeader>
        <HeadToHead match={match} />
      </section>

      {/* Lineup */}
      <section className="rise" style={{ "--d": "240ms" }}>
        <SectionHeader>{t("matchDetail.lineup")}</SectionHeader>
        <Lineup
          match={match}
          rosters={rosters}
          onPlayer={(p, tid) => setSelected({ player: p, teamId: tid })}
          goalsByPlayer={goalsByPlayer}
        />
      </section>

      <PlayerModal
        player={selected?.player}
        teamId={selected?.teamId}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
