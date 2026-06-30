import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { usePushStore } from "../../store/pushStore";

const BellIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

// A small "off" slash for the disabled/blocked state.
const BellOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M18 8a6 6 0 0 0-9.33-5M6 8c0 7-3 9-3 9h13" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <path d="m2 2 20 20" />
  </svg>
);

// Header toggle to enable/disable Web Push match alerts. Hidden entirely on
// browsers that don't support push (e.g. iOS Safari unless installed).
export default function NotifyBell() {
  const { t } = useTranslation();
  const supported = usePushStore((s) => s.supported);
  const on = usePushStore((s) => s.subscribed);
  const busy = usePushStore((s) => s.busy);
  const enable = usePushStore((s) => s.enable);
  const disable = usePushStore((s) => s.disable);
  const [note, setNote] = useState("");
  const noteTimer = useRef(null);

  useEffect(() => () => clearTimeout(noteTimer.current), []);

  const flash = (msg) => {
    setNote(msg);
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNote(""), 3500);
  };

  if (!supported) return null;

  const blocked = typeof Notification !== "undefined" && Notification.permission === "denied";

  const toggle = async () => {
    if (busy) return;
    if (blocked) {
      flash(t("notify.blocked"));
      return;
    }
    if (on) {
      await disable();
      flash(t("notify.off"));
      return;
    }
    const res = await enable();
    if (res.ok) flash(t("notify.enabled"));
    else if (res.reason === "denied") flash(t("notify.blocked"));
    else if (res.reason !== "busy") flash(t("notify.unavailable"));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-label={t("notify.enable")}
        aria-pressed={on}
        title={on ? t("notify.on") : t("notify.enable")}
        className={`grid h-8 w-8 place-items-center rounded-full border transition-colors disabled:opacity-50 ${
          on
            ? "border-octo-purple/60 bg-octo-purple/15 text-octo-purple"
            : "border-white/10 text-gray-300 hover:border-octo-purple/50 hover:text-white"
        }`}
      >
        {blocked ? <BellOff /> : <BellIcon active={on} />}
      </button>

      {note && (
        <span className="absolute end-0 top-10 z-50 w-52 animate-fade-up rounded-xl border border-white/10 bg-octo-card/95 px-3 py-2 text-end font-mono text-[11px] leading-snug text-gray-200 shadow-card backdrop-blur-xl">
          {note}
        </span>
      )}
    </div>
  );
}
