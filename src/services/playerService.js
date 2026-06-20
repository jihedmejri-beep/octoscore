import api from "./api";

export const fetchPlayers = (params) => api.get("/players", { params }).then((r) => r.data);
export const fetchTopScorers = (limit = 5) =>
  api.get("/players/top", { params: { limit } }).then((r) => r.data);
