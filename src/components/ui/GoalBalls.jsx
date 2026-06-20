// A small soccer-ball marker, repeated once per goal — the badge shown next to
// a player who scored in a match (FlashScore / Sofascore style).
function Ball({ size = 12 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className="shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="11" fill="#fff" stroke="#0a0a0a" strokeWidth="1.2" />
      {/* Central pentagon + a few seams to read as a football at tiny sizes */}
      <path
        d="M12 7.2l3.2 2.3-1.2 3.8h-4l-1.2-3.8z"
        fill="#0a0a0a"
      />
      <path
        d="M12 2.6v2.4M4.5 8.6l2 1.4M19.5 8.6l-2 1.4M7.3 19l1.2-2.1M16.7 19l-1.2-2.1"
        stroke="#0a0a0a"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// Renders `count` balls in a row. Caps the visual at 5 and shows "×N" beyond
// that so a hat-trick+ stays tidy. Renders nothing for 0/undefined.
export default function GoalBalls({ count = 0, size = 12, className = "" }) {
  if (!count || count < 1) return null;
  const shown = Math.min(count, 5);
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: shown }).map((_, i) => (
        <Ball key={i} size={size} />
      ))}
      {count > 5 && (
        <span className="ml-0.5 font-mono text-[10px] font-bold text-white">×{count}</span>
      )}
    </span>
  );
}
