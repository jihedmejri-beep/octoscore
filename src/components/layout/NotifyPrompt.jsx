import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import { pushSupported, enablePush } from "../../services/pushService";

// Remembers that we've already asked, so a visitor is nudged at most once.
const PROMPT_KEY = "octoscore_notify_prompt";

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

// A gentle, one-time banner that invites new visitors to turn on match alerts.
// It appears only when the browser supports push and the user hasn't already
// decided (granted/denied) or dismissed it. Tapping "Enable" fires the native
// permission prompt off a real click — which browsers require.
export default function NotifyPrompt() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return undefined;
    if (!pushSupported()) return undefined;
    // permission "default" = the user hasn't been asked yet on this device.
    if (typeof Notification !== "undefined" && Notification.permission !== "default") return undefined;
    if (localStorage.getItem(PROMPT_KEY)) return undefined;
    // Let the page settle before nudging.
    const id = setTimeout(() => setVisible(true), 2200);
    return () => clearTimeout(id);
  }, [pathname]);

  const close = (flag) => {
    if (flag) localStorage.setItem(PROMPT_KEY, flag);
    setVisible(false);
  };

  const enable = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await enablePush();
    } catch {
      /* ignore — they can still use the bell in the header */
    } finally {
      setBusy(false);
      close("done"); // whatever the outcome, don't ask again
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 z-40 px-4" style={{ bottom: "calc(96px + env(safe-area-inset-bottom))" }}>
      <div className="mx-auto flex max-w-md animate-fade-up items-center gap-3 rounded-2xl border border-octo-purple/30 bg-octo-card/95 p-3 shadow-card backdrop-blur-xl">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-octo-purple/15 text-octo-purple">
          <BellIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-white">
            {t("notify.promptTitle")}
          </p>
          <p className="font-mono text-[11px] leading-snug text-gray-400">{t("notify.promptBody")}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          <button
            type="button"
            onClick={enable}
            disabled={busy}
            className="rounded-xl bg-octo-purple px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-wide text-white shadow-glow-purple transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {t("notify.promptEnable")}
          </button>
          <button
            type="button"
            onClick={() => close("dismissed")}
            className="rounded-xl border border-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-gray-400 transition-colors hover:text-white"
          >
            {t("notify.promptDismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}
