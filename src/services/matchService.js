import api from "./api";

export const fetchMatches = (params) => api.get("/matches", { params }).then((r) => r.data);
export const fetchMatch = (id) => api.get(`/matches/${id}`).then((r) => r.data);
