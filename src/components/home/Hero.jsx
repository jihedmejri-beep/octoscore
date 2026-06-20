import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useDataStore } from "../../store/dataStore";

// Decorative octopus motif — mirrors the emblem used on the Tournament page so
// the home hero stays on-brand. Purely ornamental, hidden from assistive tech.
function Octopus({ className = "h-10 w-10" }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M28 42a22 18 0 0 1 44 0v5a22 16 0 0 1-44 0z" />
      <circle cx="42" cy="40" r="2.6" fill="currentColor" stroke="none" />
      <circle cx="58" cy="40" r="2.6" fill="currentColor" stroke="none" />
      <path d="M30 52c-6 6-10 6-16 14M38 56c-4 8-10 10-12 20M50 58c0 9-2 14-2 24M62 56c4 8 10 10 12 20M70 52c6 6 10 6 16 14" />
    </svg>
  );
}

export default function Hero() {
  const { t } = useTranslation();
  const teamCount = useDataStore((s) => s.teams.length);
  const groupCount = useDataStore((s) => s.groups.length);
  const matchCount = useDataStore((s) => s.matches.length);

  // Headline stats are derived from the data so the copy never drifts.
  const stats = [
    { value: teamCount, label: t("hero.teams") },
    { value: groupCount, label: t("hero.groups") },
    { value: matchCount, label: t("hero.matches") },
  ];

  // Reveal the Top Scorers widget already rendered further down the page.
  const scrollToScorers = () => {
    document
      .getElementById("top-scorers")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.07] shadow-card">
      {/* Layered ambience: purple wash, faint grid, breathing glows, octopus */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-octo-purple/35 via-octo-card to-octo-bg" />
        <div className="absolute inset-0 bg-grid-faint [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_75%)]" />
        <div className="absolute -right-16 -top-24 h-64 w-64 animate-glow-breathe rounded-full bg-octo-purple/40 blur-[100px]" />
        <div className="absolute -bottom-24 right-1/3 h-56 w-56 animate-glow-breathe rounded-full bg-octo-cyan/15 blur-[110px] [animation-delay:2s]" />
        <Octopus className="absolute -right-6 -top-8 h-44 w-44 animate-float text-octo-purple/10 sm:h-56 sm:w-56" />
      </div>

      <div className="relative px-6 py-10 sm:px-9 sm:py-12">
        {/* Season badge */}
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300">
          <span className="h-2 w-2 animate-pulse-live rounded-full bg-octo-gold" />
          {t("hero.badge")}
        </span>

        {/* Wordmark — white line over a gold line. The brand "OCTOPUS
            TOURNAMENT" is intentionally NOT translated: it stays identical in
            every language (incl. RTL Arabic) so it always matches the logo. */}
        <h1
          dir="ltr"
          className="mt-5 font-display font-bold uppercase leading-[0.85] tracking-tight"
        >
          <span className="block text-6xl text-white sm:text-7xl">Octopus</span>
          <span className="block text-6xl text-octo-gold [text-shadow:0_0_45px_rgba(255,199,0,0.35)] sm:text-7xl">
            Tournament
          </span>
        </h1>

        {/* Lede */}
        <p className="mt-5 max-w-md font-sans text-sm leading-relaxed text-gray-400 sm:text-base">
          {t("hero.lede", { teams: teamCount })}
        </p>

        {/* Live stat chips */}
        <div className="mt-6 flex flex-wrap gap-2.5">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex items-baseline gap-1.5 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2"
            >
              <span className="font-display text-2xl font-bold tabular-nums text-white">
                {s.value}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-gray-500">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Calls to action */}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/tournament"
            className="inline-flex items-center justify-center rounded-2xl bg-octo-purple px-6 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-white shadow-glow-purple transition-transform hover:-translate-y-0.5"
          >
            {t("hero.ctaStandings")}
          </Link>
          <button
            type="button"
            onClick={scrollToScorers}
            className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.02] px-6 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-white transition-colors hover:border-octo-purple/60"
          >
            {t("hero.ctaScorers")}
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
