import api from "./api";

export const fetchQuiz = () => api.get("/quiz").then((r) => r.data);
export const submitQuiz = (answers) =>
  api.post("/quiz/submit", { answers }).then((r) => r.data);

// Check a single answer — returns { correct, correctId, xpAwarded, xp }.
export const answerQuiz = (id, optionId) =>
  api.post(`/quiz/${id}/answer`, { optionId }).then((r) => r.data);
