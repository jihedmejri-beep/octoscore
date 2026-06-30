import { create } from "zustand";

import { pushSupported, isSubscribed, enablePush, disablePush } from "../services/pushService";

// Shared Web Push state so every surface that touches notifications (the header
// bell, the first-visit prompt) reflects the same subscription status. Enabling
// from the banner instantly flips the bell to "on", and vice-versa.
export const usePushStore = create((set, get) => ({
  supported: pushSupported(),
  subscribed: false,
  busy: false,

  // Read the current subscription once on boot.
  async init() {
    if (!get().supported) return;
    try {
      set({ subscribed: await isSubscribed() });
    } catch {
      /* leave as not-subscribed */
    }
  },

  // Ask permission + subscribe. Returns pushService's { ok, reason } so callers
  // can show the right message.
  async enable() {
    if (get().busy) return { ok: false, reason: "busy" };
    set({ busy: true });
    try {
      const res = await enablePush();
      if (res.ok) set({ subscribed: true });
      return res;
    } catch {
      return { ok: false, reason: "error" };
    } finally {
      set({ busy: false });
    }
  },

  async disable() {
    if (get().busy) return;
    set({ busy: true });
    try {
      await disablePush();
      set({ subscribed: false });
    } finally {
      set({ busy: false });
    }
  },
}));
