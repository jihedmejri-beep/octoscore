import api from "./api";

export const signup = (payload) => api.post("/auth/signup", payload).then((r) => r.data);
export const login = (payload) => api.post("/auth/login", payload).then((r) => r.data);
// Returns { user, token } — the server slides the session by re-issuing a fresh
// token on each call, so an active user's login keeps renewing.
export const getMe = () => api.get("/auth/me").then((r) => r.data);
export const updateMe = (payload) => api.patch("/auth/me", payload).then((r) => r.data.user);
export const verifyEmail = (token) =>
  api.get("/auth/verify-email", { params: { token } }).then((r) => r.data);
export const resendVerification = () =>
  api.post("/auth/resend-verification").then((r) => r.data);
export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email }).then((r) => r.data);
export const resetPassword = (token, password) =>
  api.post("/auth/reset-password", { token, password }).then((r) => r.data);
