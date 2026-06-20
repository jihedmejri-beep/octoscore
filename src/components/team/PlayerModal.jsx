import { useTranslation } from "react-i18next";

import TeamCrest from "../ui/TeamCrest.jsx";
import { Close, Instagram, Facebook } from "../ui/icons.jsx";
import { useDataStore } from "../../store/dataStore";

// Player info card shown when a player is tapped (lineup or roster list).
export default function PlayerModal({ player, teamId, onClose }) {
  const { t } = useTranslation();
  const team = useDataStore((s) => (teamId ? s.teams.find((tm) => tm.id === teamId) : null));
  if (!player) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl border border-white/10 bg-octo-card p-6 shadow-card sm:rounded-3xl"
        style={{ animation: "fade-up 0.3s cubic-bezier(0.22,1,0.36,1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {team && <TeamCrest teamId={teamId} className="h-12 w-12 text-sm" />}
            <div>
              <div className="font-display text-2xl font-bold uppercase leading-none">
                {player.first} {player.last}
              </div>
              {team && <div className="mt-1 font-mono text-[11px] text-gray-500">{team.name}</div>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 transition-colors hover:text-white">
            <Close />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-white/5 bg-octo-elevated p-3 text-center">
            <div className="font-display text-2xl font-bold text-white">
              {player.number ?? "-"}
            </div>
            <div className="label-mono mt-0.5">{t("player.number")}</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-octo-elevated p-3 text-center">
            <div className="font-display text-2xl font-bold text-octo-purple">{player.pos}</div>
            <div className="label-mono mt-0.5">{t("player.position")}</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-octo-elevated p-3 text-center">
            <div className="font-display text-2xl font-bold text-octo-green">{player.goals}</div>
            <div className="label-mono mt-0.5">{t("player.goals")}</div>
          </div>
        </div>

        {player.isCaptain && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-octo-green/30 bg-octo-green/10 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-octo-green">
            {t("player.captain")}
          </div>
        )}

        {/* Socials */}
        {(player.instagram || player.facebook) && (
          <div className="mt-4 flex gap-2">
            {player.instagram && (
              <a
                href={player.instagram}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-octo-elevated py-2.5 font-mono text-xs text-gray-300 transition-colors hover:text-white"
              >
                <Instagram /> Instagram
              </a>
            )}
            {player.facebook && (
              <a
                href={player.facebook}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-octo-elevated py-2.5 font-mono text-xs text-gray-300 transition-colors hover:text-white"
              >
                <Facebook /> Facebook
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
