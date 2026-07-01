import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import { useInstallStore } from "../../store/installStore";

// A down-into-tray glyph for the Chromium "Install" action.
const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);

// The iOS Safari "Share" glyph, shown next to the manual instructions.
const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M12 15V4" />
    <path d="m8 8 4-4 4 4" />
    <path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
  </svg>
);

// Invites visitors to install the PWA to their home screen. On Chromium/Android
// and desktop it fires the real `beforeinstallprompt` dialog; on iOS Safari —
// which has no programmatic install — it shows the manual Share steps instead.
// Never appears in the admin area, once installed, or after it's dismissed.
export default function InstallPrompt() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const canInstall = useInstallStore((s) => s.canInstall);
  const isIOS = useInstallStore((s) => s.isIOS);
  const installed = useInstallStore((s) => s.installed);
  const dismissed = useInstallStore((s) => s.dismissed);
  const promptInstall = useInstallStore((s) => s.promptInstall);
  const dismiss = useInstallStore((s) => s.dismiss);

  const [ready, setReady] = useState(false);

  // Show only when there's actually a way to install: a captured native prompt
  // (Chromium) or an iOS device we can hand instructions to.
  const eligible =
    !pathname.startsWith("/admin") && !installed && !dismissed && (canInstall || isIOS);

  // Let the page settle before nudging. Reset lives in cleanup so each fresh
  // eligibility re-applies the delay (and we never setState in the effect body).
  useEffect(() => {
    if (!eligible) return undefined;
    const id = setTimeout(() => setReady(true), 1500);
    return () => {
      clearTimeout(id);
      setReady(false);
    };
  }, [eligible]);

  if (!eligible || !ready) return null;

  const install = async () => {
    const outcome = await promptInstall();
    // If they declined the native dialog, don't keep nagging on every visit.
    if (outcome !== "accepted") dismiss();
  };

  return (
    <div className="fixed inset-x-0 z-40 px-4" style={{ bottom: "calc(96px + env(safe-area-inset-bottom))" }}>
      <div className="mx-auto flex max-w-md animate-fade-up items-center gap-3 rounded-2xl border border-octo-purple/30 bg-octo-card/95 p-3 shadow-card backdrop-blur-xl">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-octo-purple/15 text-octo-purple">
          {isIOS ? <ShareIcon /> : <DownloadIcon />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-white">
            {t("install.title")}
          </p>
          <p className="font-mono text-[11px] leading-snug text-gray-400">
            {isIOS ? t("install.iosHint") : t("install.body")}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          {isIOS ? (
            <button
              type="button"
              onClick={() => dismiss()}
              className="rounded-xl bg-octo-purple px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-wide text-white shadow-glow-purple transition-opacity hover:opacity-90"
            >
              {t("install.iosDone")}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={install}
                className="rounded-xl bg-octo-purple px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-wide text-white shadow-glow-purple transition-opacity hover:opacity-90"
              >
                {t("install.button")}
              </button>
              <button
                type="button"
                onClick={() => dismiss()}
                className="rounded-xl border border-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-gray-400 transition-colors hover:text-white"
              >
                {t("install.dismiss")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
