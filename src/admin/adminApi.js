import api from "../services/api";

// --- Teams (multipart: logo file) ------------------------------------------
export const listTeams = () => api.get("/teams").then((r) => r.data);
export const createTeam = (formData) => api.post("/teams", formData).then((r) => r.data);
export const updateTeam = (id, formData) =>
  api.put(`/teams/${id}`, formData).then((r) => r.data);
export const deleteTeam = (id) => api.delete(`/teams/${id}`).then((r) => r.data);

// Team photo album (multipart: one or more "photos" files)
export const listTeamPhotos = (id) => api.get(`/teams/${id}/photos`).then((r) => r.data);
export const uploadTeamPhotos = (id, formData) =>
  api.post(`/teams/${id}/photos`, formData).then((r) => r.data);
export const deleteTeamPhoto = (teamId, photoId) =>
  api.delete(`/teams/${teamId}/photos/${photoId}`).then((r) => r.data);

// --- Players ---------------------------------------------------------------
export const listPlayers = (teamId) =>
  api.get("/players", { params: teamId ? { teamId } : {} }).then((r) => r.data);
export const createPlayer = (body) => api.post("/players", body).then((r) => r.data);
export const updatePlayer = (id, body) => api.put(`/players/${id}`, body).then((r) => r.data);
export const deletePlayer = (id) => api.delete(`/players/${id}`).then((r) => r.data);

// --- Matches ---------------------------------------------------------------
export const listMatches = () => api.get("/matches").then((r) => r.data);
export const createMatch = (body) => api.post("/matches", body).then((r) => r.data);
export const updateMatch = (id, body) => api.put(`/matches/${id}`, body).then((r) => r.data);
export const deleteMatch = (id) => api.delete(`/matches/${id}`).then((r) => r.data);

// --- Quiz ------------------------------------------------------------------
export const listQuizAdmin = () => api.get("/quiz/manage").then((r) => r.data);
export const createQuiz = (body) => api.post("/quiz", body).then((r) => r.data);
export const updateQuiz = (id, body) => api.put(`/quiz/${id}`, body).then((r) => r.data);
export const deleteQuiz = (id) => api.delete(`/quiz/${id}`).then((r) => r.data);
export const generateQuiz = () => api.post("/quiz/generate").then((r) => r.data);
export const quizStatus = () => api.get("/quiz/status").then((r) => r.data);

// --- Groups ----------------------------------------------------------------
export const listGroups = () => api.get("/groups").then((r) => r.data);
export const createGroup = (body) => api.post("/groups", body).then((r) => r.data);
export const updateGroup = (id, body) => api.put(`/groups/${id}`, body).then((r) => r.data);
export const deleteGroup = (id) => api.delete(`/groups/${id}`).then((r) => r.data);

// --- Content singletons (bracket / rules) ----------------------------------
// ?raw=1 returns the authored bracket without live match scores overlaid, so
// the admin edits and saves its true source values (see contentController).
export const getContent = (key) =>
  api.get(`/content/${key}`, { params: { raw: 1 } }).then((r) => r.data);
export const putContent = (key, data) =>
  api.put(`/content/${key}`, { data }).then((r) => r.data);
