import axios from "axios";

// Base URL of the backend. Set VITE_API_URL in .env (e.g. the Railway URL in
// production). Falls back to a local dev server.
const ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export const API_ORIGIN = ORIGIN;
export const TOKEN_KEY = "octoscore_token";

const api = axios.create({ baseURL: `${ORIGIN}/api` });

// Attach the JWT (if any) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize server errors to a plain Error with the API's message. The HTTP
// status is preserved on `err.status` so callers can distinguish a genuine auth
// rejection (401/403) from a transient network/cold-start failure (status 0).
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "Network error — is the API running?";
    const err = new Error(message);
    err.status = error.response?.status ?? 0; // 0 = no response (offline / timeout)
    return Promise.reject(err);
  }
);

export default api;
