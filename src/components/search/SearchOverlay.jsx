import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import TeamCrest from "../ui/TeamCrest.jsx";
import { useDataStore } from "../../store/dataStore";
import { fetchPlayers } from "../../services/playerService";

// Accent/case-insensitive normalisation so "jose" matches "José".
const COMBINING = /[̀-ͯ]/g;
const norm = (s = "") =>
  s.toLowerCase().normalize("NFD").replace(COMBINING, "").trim();

// Module-level cache: the full squad list is fetched once and reused across
// every time the overlay is opened.
let playersCache = null;

const SearchIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

const Chevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-gray-600">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

function Group({ label, children }) {
  return (
    <div className="mb-1">
      <div className="label-mono px-3 pb-1 pt-2">{label}</div>
      {children}
    </div>
  );
}

const rowClass =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.05]";

export default function SearchOverlay({ onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const teams = useDataStore((s) => s.teams);

  const [players, setPlayers] = useState(playersCache || []);
  const [q, setQ] = useState("");
  const inputRef = useRef(null);

  // Lock scroll, wire Escape, autofocus the input.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const id = setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      clearTimeout(id);
    };
  }, [onClose]);

  // Load the squad once (cached for subsequent opens).
  useEffect(() => {
    if (playersCache) return;
    fetchPlayers()
      .then((data) => {
        playersCache = data;
        setPlayers(data);
      })
      .catch(() => {});
  }, []);

  const teamName = (id) => teams.find((tm) => tm.id === id)?.name;

  const results = useMemo(() => {
    const nq = norm(q);
    if (!nq) return null;
    const hit = (...parts) => norm(parts.filter(Boolean).join(" ")).includes(nq);

    const teamHits = teams.filter((tm) => hit(tm.name, tm.city)).slice(0, 6);
    const playerHits = players
      .filter((p) => p.role !== "coach" && (hit(p.first, p.last) || hit(teamName(p.teamId))))
      .slice(0, 8);
    const coachHits = players
      .filter((p) => p.role === "coach" && (hit(p.first, p.last) || hit(teamName(p.teamId))))
      .slice(0, 6);
    return { teamHits, playerHits, coachHits };
  }, [q, teams, players]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (teamId) => {
    onClose();
    navigate(`/teams/${teamId}`);
  };

  const total = results
    ? results.teamHits.length + results.playerHits.length + results.coachHits.length
    : 0;

  return createPortal(
    <div className="fixed inset-0 z-[95] flex justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label={t("search.label")}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative z-10 flex max-h-[76vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-octo-card shadow-card animate-fade-up">
        {/* Search field */}
        <div className="group flex items-center gap-3 border-b border-white/5 px-5 py-4 transition-colors duration-200 focus-within:border-octo-purple/30">
          <SearchIcon className="h-5 w-5 shrink-0 text-gray-500 transition-colors group-focus-within:text-octo-purple" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search.placeholder")}
            className="min-w-0 flex-1 bg-transparent font-sans text-lg text-white outline-none placeholder:text-gray-500"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear"
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-gray-300 transition-colors hover:bg-white/20 hover:text-white"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="no-scrollbar flex-1 overflow-y-auto p-2">
          {!results ? (
            <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
              <SearchIcon className="h-8 w-8 text-octo-purple/50" />
              <p className="font-mono text-xs uppercase tracking-widest text-gray-500">{t("search.prompt")}</p>
            </div>
          ) : total === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="font-sans text-sm text-gray-400">
                {t("search.noResults")} <span className="font-semibold text-white">“{q}”</span>
              </p>
            </div>
          ) : (
            <>
              {results.teamHits.length > 0 && (
                <Group label={t("search.teams")}>
                  {results.teamHits.map((tm) => (
                    <button key={tm.id} type="button" onClick={() => go(tm.id)} className={rowClass}>
                      <TeamCrest teamId={tm.id} className="h-9 w-9 text-xs" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-sans text-sm font-semibold text-white">{tm.name}</div>
                        {tm.city && <div className="truncate font-mono text-[11px] text-gray-500">{tm.city}</div>}
                      </div>
                      <Chevron />
                    </button>
                  ))}
                </Group>
              )}

              {results.playerHits.length > 0 && (
                <Group label={t("search.players")}>
                  {results.playerHits.map((p) => (
                    <button key={p.id} type="button" onClick={() => go(p.teamId)} className={rowClass}>
                      <span className="relative shrink-0">
                        <TeamCrest teamId={p.teamId} className="h-9 w-9 text-xs" />
                        {p.number != null && (
                          <span className="absolute -bottom-1 -end-1 grid h-4 min-w-4 place-items-center rounded-full bg-octo-purple px-1 font-mono text-[9px] font-bold text-white ring-2 ring-octo-card">
                            {p.number}
                          </span>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-sans text-sm font-semibold text-white">
                          {p.first} {p.last}
                        </div>
                        <div className="truncate font-mono text-[11px] text-gray-500">
                          {teamName(p.teamId)}
                          {p.pos ? ` · ${p.pos}` : ""}
                        </div>
                      </div>
                      <Chevron />
                    </button>
                  ))}
                </Group>
              )}

              {results.coachHits.length > 0 && (
                <Group label={t("search.coaches")}>
                  {results.coachHits.map((p) => (
                    <button key={p.id} type="button" onClick={() => go(p.teamId)} className={rowClass}>
                      <TeamCrest teamId={p.teamId} className="h-9 w-9 text-xs" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-sans text-sm font-semibold text-white">
                          {p.first} {p.last}
                        </div>
                        <div className="truncate font-mono text-[11px] text-gray-500">{teamName(p.teamId)}</div>
                      </div>
                      <Chevron />
                    </button>
                  ))}
                </Group>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
