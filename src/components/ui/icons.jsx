import useLiveClock from "../../hooks/useLiveClock.js";

// Shared outline icons (stroke = currentColor). No emojis anywhere.
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const ArrowLeft = ({ className = "h-5 w-5" }) => (
  <svg {...base} className={className}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

export const Pin = ({ className = "h-4 w-4" }) => (
  <svg {...base} className={className}>
    <path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export const Clock = ({ className = "h-4 w-4" }) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const Play = ({ className = "h-5 w-5" }) => (
  <svg {...base} className={className}>
    <path d="M6 4.5v15l13-7.5-13-7.5Z" />
  </svg>
);

export const Instagram = ({ className = "h-4 w-4" }) => (
  <svg {...base} className={className}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="3.8" />
    <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const Facebook = ({ className = "h-4 w-4" }) => (
  <svg {...base} className={className}>
    <path d="M14 8.5h2.5V5H14a3.5 3.5 0 0 0-3.5 3.5V11H8v3.5h2.5V21H14v-6.5h2.5L17 11h-3V8.9c0-.3.1-.4.5-.4Z" />
  </svg>
);

export const Close = ({ className = "h-5 w-5" }) => (
  <svg {...base} className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const Whistle = ({ className = "h-4 w-4" }) => (
  <svg {...base} className={className}>
    <path d="M3 10a4 4 0 0 1 4-4h9l5-2v6a7 7 0 1 1-13-2H7" />
    <circle cx="9" cy="14" r="3" />
  </svg>
);

// Live / status badge. When the match carries a kickoff timestamp the badge
// shows the running 00:00→90:00 clock, ticking every second; otherwise it
// falls back to the manually-entered minute.
export function StatusBadge({ status, minute, kickoffAt }) {
  const clock = useLiveClock(status === "live" ? kickoffAt : null);
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-octo-green/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-octo-green">
        <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-octo-green" />
        Live{clock ? ` ${clock.label}` : minute ? ` ${minute}'` : ""}
      </span>
    );
  }
  if (status === "finished") {
    return (
      <span className="rounded-full bg-white/5 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400">
        FT
      </span>
    );
  }
  return (
    <span className="rounded-full bg-octo-purple/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-octo-purple">
      Upcoming
    </span>
  );
}
