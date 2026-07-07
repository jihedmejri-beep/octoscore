import { useEffect, useState } from "react";

const CAP_MS = 90 * 60 * 1000; // the clock runs 00:00 → 90:00, then holds

// Running football clock derived from the match's kickoff timestamp. Ticks
// every second while mounted; returns null when there's no kickoff to count
// from (legacy live matches fall back to the manual `minute` field).
//   { label: "37:42", minute: 38 }  — minute is the football convention
//   (a goal 30s in is the 1st minute).
export default function useLiveClock(kickoffAt) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!kickoffAt) return undefined;
    // First tick lands within a second, so no need to sync state up front.
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [kickoffAt]);

  if (!kickoffAt) return null;
  const start = new Date(kickoffAt).getTime();
  if (Number.isNaN(start)) return null;

  const elapsed = Math.max(0, Math.min(now - start, CAP_MS));
  const totalSec = Math.floor(elapsed / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  return {
    label: `${mm}:${ss}`,
    minute: Math.min(90, Math.floor(totalSec / 60) + 1),
  };
}

// The current football minute for a live match — used by the admin panel to
// stamp goals as they're entered. Non-hook so it can run inside handlers.
export function liveMinuteNow(kickoffAt) {
  if (!kickoffAt) return null;
  const start = new Date(kickoffAt).getTime();
  if (Number.isNaN(start)) return null;
  const elapsed = Math.max(0, Date.now() - start);
  return Math.min(90, Math.floor(elapsed / 60000) + 1);
}
