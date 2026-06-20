import api from "./api";

// Aggregated community stats for a match (public).
export const getPredictionStats = (matchId) =>
  api.get(`/matches/${matchId}/predictions`).then((r) => r.data);

// The signed-in user's own prediction, or null (requires auth).
export const getMyPrediction = (matchId) =>
  api.get(`/matches/${matchId}/prediction/me`).then((r) => r.data);

// Create or update the signed-in user's prediction (requires auth).
export const submitPrediction = (matchId, payload) =>
  api.post(`/matches/${matchId}/predict`, payload).then((r) => r.data);
