import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import TeamCrest from "../components/ui/TeamCrest.jsx";
import Pitch from "../components/team/Pitch.jsx";
import PlayerModal from "../components/team/PlayerModal.jsx";
import TeamAlbum from "../components/team/TeamAlbum.jsx";
import Loader from "../components/ui/Loader.jsx";
import { ArrowLeft, Instagram, Facebook } from "../components/ui/icons.jsx";
import { fetchTeam } from "../services/teamService";
import { useDataStore, rosterFromPlayers } from "../store/dataStore";

function SectionHeader({ children }) {
  return (
    <h2 className="mb-3 flex items-center gap-2.5 font-display text-lg font-bold uppercase tracking-wide">
      <span className="h-4 w-1 rounded-full bg-octo-purple" />
      {children}
    </h2>
  );
}

function PlayerRow({ player, onClick }) {
  const { t } = useTranslation();
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-octo-elevated font-mono text-sm font-bold text-gray-300">
        {player.number}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-sans text-sm font-semibold">
            {player.first} {player.last}
          </span>
          {player.isCaptain && (
            <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-octo-green font-mono text-[8px] font-bold text-black">
              C
            </span>
          )}
        </div>
        <div className="font-mono text-[11px] text-gray-500">{player.pos}</div>
      </div>
      {(player.instagram || player.facebook) && (
        <span className="flex shrink-0 gap-1.5 text-gray-500">
          {player.instagram && <Instagram />}
          {player.facebook && <Facebook />}
        </span>
      )}
      <span className="shrink-0 text-right">
        <span className="font-display text-lg font-bold text-octo-green">{player.goals}</span>
        <span className="ml-1 font-mono text-[10px] uppercase text-gray-500">{t("player.goals")}</span>
      </span>
    </button>
  );
}

export default function TeamDetail() {
  const { t } = useTranslation();
  const { teamId } = useParams();
  const [status, setStatus] = useState("loading"); // loading | ready | notfound
  const [team, setTeam] = useState(null);
  const [roster, setRoster] = useState({ starters: [], sub: null, coach: null });
  const [player, setPlayer] = useState(null);

  const group = useDataStore((s) => s.groups.find((g) => g.id === team?.group));

  useEffect(() => {
    let active = true;
    fetchTeam(teamId)
      .then((data) => {
        if (!active) return;
        setTeam(data);
        setRoster(rosterFromPlayers(data.players || []));
        setStatus("ready");
      })
      .catch(() => active && setStatus("notfound"));
    return () => {
      active = false;
    };
  }, [teamId]);

  if (status === "loading") return <Loader />;

  if (status === "notfound" || !team) {
    return (
      <div className="py-20 text-center">
        <p className="font-mono text-sm text-gray-400">{t("teams.notFound")}</p>
        <Link to="/teams" className="mt-3 inline-block font-display text-sm font-bold uppercase text-octo-purple">
          {t("teams.backToTeams")}
        </Link>
      </div>
    );
  }

  const accent = team.group === "A" ? "#6236FF" : "#00E5FF";

  return (
    <div className="space-y-7">
      <Link
        to="/teams"
        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-gray-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("teams.backToTeams")}
      </Link>

      {/* Team header */}
      <div className="rise flex items-center gap-4 rounded-3xl border border-white/[0.07] bg-octo-card p-6 shadow-card">
        <TeamCrest teamId={teamId} name={team.name} className="h-20 w-20 text-2xl" />
        <div>
          <h1 className="font-display text-3xl font-bold uppercase leading-none">{team.name}</h1>
          <p className="mt-2 font-mono text-[11px] text-gray-500">{group?.city || team.city}</p>
          <span className="mt-2 inline-block rounded-full bg-octo-purple/15 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-octo-purple">
            {group?.name || team.group} {t("tournament.path")}
          </span>
        </div>
      </div>

      {/* Lineup pitch */}
      {roster.starters.length > 0 && (
        <section className="rise" style={{ "--d": "80ms" }}>
          <SectionHeader>{t("teamDetail.lineup")}</SectionHeader>
          <Pitch starters={roster.starters} accent={accent} onPlayerClick={setPlayer} />
        </section>
      )}

      {/* Squad list */}
      <section className="rise" style={{ "--d": "160ms" }}>
        <SectionHeader>{t("teamDetail.squad")}</SectionHeader>
        <div className="octo-card divide-y divide-white/5">
          {roster.starters.map((p) => (
            <PlayerRow key={p.id} player={p} onClick={() => setPlayer(p)} />
          ))}
          {roster.sub && <PlayerRow player={roster.sub} onClick={() => setPlayer(roster.sub)} />}
        </div>
      </section>

      {/* Coach */}
      {roster.coach && (
        <section className="rise" style={{ "--d": "240ms" }}>
          <SectionHeader>{t("teamDetail.coach")}</SectionHeader>
          <div className="octo-card flex items-center gap-4 p-4">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-octo-elevated text-octo-green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20a7 7 0 0 1 14 0" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <div className="font-sans text-base font-semibold">
                {roster.coach.first} {roster.coach.last}
              </div>
              <div className="font-mono text-[11px] text-gray-500">{t("teamDetail.headCoach")}</div>
            </div>
          </div>
        </section>
      )}

      {/* Photo album */}
      <TeamAlbum teamId={teamId} />

      <PlayerModal player={player} teamId={teamId} onClose={() => setPlayer(null)} />
    </div>
  );
}
