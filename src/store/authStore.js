import { create } from "zustand";

import { TOKEN_KEY } from "../services/api";
import * as authService from "../services/authService";

// The signed-in user is cached here (not sensitive — the JWT is the actual
// credential) so the session is restored *instantly* on boot and survives the
// browser being closed, without waiting on a network round-trip.
const USER_KEY = "octoscore_user";

function readUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Auth state. The JWT lives in localStorage (read by the axios interceptor) and
// the user object is cached alongside it, so a returning visitor is logged in
// immediately. The token + user are re-validated against /auth/me in the
// background; we only sign out on a real auth rejection, never on a flaky
// connection or a cold-starting server.
const initialToken = localStorage.getItem(TOKEN_KEY) || null;

export const useAuthStore = create((set, get) => ({
  token: initialToken,
  user: initialToken ? readUser() : null,
  loading: false,
  error: null,
  ready: false, // initial hydration finished

  setSession(token, user) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user, error: null });
  },

  async login(payload) {
    set({ loading: true, error: null });
    try {
      const { token, user } = await authService.login(payload);
      get().setSession(token, user);
      return user;
    } catch (e) {
      set({ error: e.message });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  async signup(payload) {
    set({ loading: true, error: null });
    try {
      const { token, user } = await authService.signup(payload);
      get().setSession(token, user);
      return user;
    } catch (e) {
      set({ error: e.message });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null, error: null });
  },

  // Validate the stored token and refresh the cached user. Safe to call on boot.
  // Optimistic: if we already have a cached session we mark the app ready right
  // away (so the UI is logged-in instantly and never blocks on a slow server),
  // then reconcile in the background.
  async hydrate() {
    const { token, user } = get();
    if (!token) {
      localStorage.removeItem(USER_KEY);
      set({ user: null, ready: true });
      return;
    }
    if (user) set({ ready: true }); // trust the cache while we re-validate

    try {
      const { user: fresh, token: refreshed } = await authService.getMe();
      // Slide the session with the freshly-issued token when present.
      get().setSession(refreshed || token, fresh);
      set({ ready: true });
    } catch (e) {
      // Only sign out when the server explicitly rejects the credential. A
      // network error / timeout / 5xx (status 0 or 5xx — common on a free-tier
      // cold start) must NOT log a valid user out: keep the cached session.
      if (e.status === 401 || e.status === 403) {
        get().logout();
      }
      set({ ready: true });
    }
  },

  // Keep XP in sync after quiz rewards etc. (and re-cache so it survives reload).
  setXp(xp) {
    const { user } = get();
    if (!user) return;
    const next = { ...user, xp };
    localStorage.setItem(USER_KEY, JSON.stringify(next));
    set({ user: next });
  },

  clearError() {
    set({ error: null });
  },
}));
