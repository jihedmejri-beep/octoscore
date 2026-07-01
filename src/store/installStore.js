import { create } from "zustand";

// Remembers that the visitor already dealt with the install nudge (installed or
// dismissed) so we don't pester them on every visit.
const DISMISS_KEY = "octoscore_install_prompt";

// iOS Safari never fires `beforeinstallprompt` and offers no programmatic
// install — the only path is the manual "Share → Add to Home Screen". We detect
// it so we can show instructions instead of a dead install button.
const isIOS = () =>
  typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

// Already launched as an installed app? Covers the standard display-mode signal
// and the iOS-only navigator.standalone flag.
const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true);

const alreadyHandled = () => {
  try {
    return !!localStorage.getItem(DISMISS_KEY);
  } catch {
    return false;
  }
};

// Shared "Add to Home Screen" state. Kept in a store (not local component state)
// because the browser fires `beforeinstallprompt` once, early — we capture it at
// import time below — and several surfaces may want to reflect install status.
export const useInstallStore = create((set, get) => ({
  deferred: null, // the captured beforeinstallprompt event (Chromium only)
  canInstall: false, // a native install prompt is ready to fire
  isIOS: isIOS(),
  installed: isStandalone(),
  dismissed: alreadyHandled(),

  // Fire the native install dialog and report the user's choice
  // ("accepted" | "dismissed" | "unavailable").
  async promptInstall() {
    const e = get().deferred;
    if (!e) return "unavailable";
    e.prompt();
    const choice = await e.userChoice.catch(() => ({ outcome: "dismissed" }));
    set({ deferred: null, canInstall: false });
    if (choice.outcome === "accepted") {
      try {
        localStorage.setItem(DISMISS_KEY, "installed");
      } catch {
        /* private mode — nothing to persist */
      }
      set({ installed: true });
    }
    return choice.outcome;
  },

  // The user closed our banner — remember it so we stop nudging.
  dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "dismissed");
    } catch {
      /* private mode — best effort */
    }
    set({ dismissed: true });
  },
}));

// Wire the browser events exactly once, at module-eval time. This runs while the
// import graph resolves — before React renders — so we don't miss an early
// `beforeinstallprompt` (which some browsers dispatch before the app mounts).
let wired = false;
function wireInstallEvents() {
  if (wired || typeof window === "undefined") return;
  wired = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // suppress Chrome's default mini-infobar; we show our own
    useInstallStore.setState({ deferred: e, canInstall: true });
  });
  window.addEventListener("appinstalled", () => {
    try {
      localStorage.setItem(DISMISS_KEY, "installed");
    } catch {
      /* ignore */
    }
    useInstallStore.setState({ deferred: null, canInstall: false, installed: true });
  });
}
wireInstallEvents();
