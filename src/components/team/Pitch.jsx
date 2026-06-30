import GoalBalls from "../ui/GoalBalls.jsx";
import CardMarks from "../ui/CardMarks.jsx";

// Vertical football pitch graphic that places a team's starting lineup by the
// x/y coordinates defined on each player (see FORMATION in mockData).
// Used by both Match Detail (Starting Lineup) and Team Detail.
// `goalsByPlayer` (optional): map of playerId -> goals scored in this match.
export default function Pitch({ starters, accent = "#6236FF", onPlayerClick, goalsByPlayer }) {
  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/[0.07] shadow-card">
      {/* Pitch surface: dark green-tinted turf with subtle mowing stripes */}
      <div
        className="relative aspect-[3/4] w-full"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(57,255,20,0.045) 0px, rgba(57,255,20,0.045) 28px, rgba(57,255,20,0.02) 28px, rgba(57,255,20,0.02) 56px)",
          backgroundColor: "#0c120e",
        }}
      >
        {/* Line markings */}
        <svg
          viewBox="0 0 100 133"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full text-white/15"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.4"
        >
          <rect x="3" y="3" width="94" height="127" rx="1.5" />
          <line x1="3" y1="66.5" x2="97" y2="66.5" />
          <circle cx="50" cy="66.5" r="11" />
          <circle cx="50" cy="66.5" r="0.8" fill="currentColor" />
          {/* Top penalty area (attacking) */}
          <rect x="28" y="3" width="44" height="16" />
          <rect x="40" y="3" width="20" height="7" />
          {/* Bottom penalty area (own) */}
          <rect x="28" y="114" width="44" height="16" />
          <rect x="40" y="123" width="20" height="7" />
        </svg>

        {/* Players */}
        {starters.map((p) => {
          const Tag = onPlayerClick ? "button" : "div";
          const goals = goalsByPlayer?.[p.id] || 0;
          return (
            <Tag
              key={p.id}
              onClick={onPlayerClick ? () => onPlayerClick(p) : undefined}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 text-center"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <span className="relative grid h-9 w-9 place-items-center rounded-full font-mono text-sm font-bold text-white shadow-lg transition-transform active:scale-90 sm:h-10 sm:w-10"
                style={{ backgroundColor: accent, boxShadow: `0 0 16px -4px ${accent}` }}
              >
                {p.number}
                {p.isCaptain && (
                  <span className="absolute -left-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-octo-green font-mono text-[8px] font-bold text-black">
                    C
                  </span>
                )}
                {goals > 0 && (
                  <span className="absolute -right-1.5 -top-1.5">
                    <GoalBalls count={goals} size={14} />
                  </span>
                )}
                {(p.yellowCards > 0 || p.redCards > 0) && (
                  <span className="absolute -bottom-1 -right-1">
                    <CardMarks yellow={p.yellowCards} red={p.redCards} size={12} />
                  </span>
                )}
              </span>
              <span className="max-w-[64px] truncate rounded bg-black/55 px-1 py-0.5 font-sans text-[10px] font-semibold leading-tight text-white backdrop-blur-sm">
                {p.last}
              </span>
            </Tag>
          );
        })}
      </div>
    </div>
  );
}
