// Tiny disciplinary-card markers (yellow / red) shown next to a player, mirroring
// the GoalBalls badge. Counts are the player's cumulative season totals. Renders
// one card per colour, with a small ×N when a player has more than one.
function Card({ color, count, h = 13 }) {
  const w = Math.round(h * 0.72);
  return (
    <span className="inline-flex items-center">
      <span
        className="block rounded-[2px] ring-1 ring-black/50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
        style={{ width: w, height: h, backgroundColor: color }}
      />
      {count > 1 && (
        <span className="ml-0.5 font-mono text-[9px] font-bold leading-none text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
          ×{count}
        </span>
      )}
    </span>
  );
}

export default function CardMarks({ yellow = 0, red = 0, size = 13, className = "" }) {
  if ((yellow || 0) < 1 && (red || 0) < 1) return null;
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-hidden="true">
      {yellow > 0 && <Card color="#FFC700" count={yellow} h={size} />}
      {red > 0 && <Card color="#ef4444" count={red} h={size} />}
    </span>
  );
}
