import { create } from "zustand";

import { TOKEN_KEY } from "../services/api";
import * as authService from "../services/authService";

// Auth state. The JWT lives in localStorage (read by the axios interceptor);
// the user object is hydrated from /auth/me on boot and after login/signup.
export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem(TOKEN_KEY) || null,
  user: null,
  loading: false,
  error: null,
  ready: false, // initial hydration finished

  setSession(token, user) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
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
    set({ token: null, user: null, error: null });
  },

  // Validate the stored token and load the current user. Safe to call on boot.
  async hydrate() {
    const { token } = get();
    if (!token) {
      set({ ready: true });
      return;
    }
    try {
      const user = await authService.getMe();
      set({ user, ready: true });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({ token: null, user: null, ready: true });
    }
  },

  // Keep XP in sync after quiz rewards etc.
  setXp(xp) {
    const { user } = get();
    if (user) set({ user: { ...user, xp } });
  },

  clearError() {
    set({ error: null });
  },
}));
