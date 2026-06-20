import api from "./api";

export const fetchTeams = (params) => api.get("/teams", { params }).then((r) => r.data);
export const fetchTeam = (id) => api.get(`/teams/${id}`).then((r) => r.data);
