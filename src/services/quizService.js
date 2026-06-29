import api from "./api";

// Quiz questions rarely change (a background daily refresh on the server), so
// cache them for the session: the first load warms the cache and every later
// visit to the Quiz tab is instant instead of waiting on the network (which can
// be slow on the API's cold start). Concurrent calls share one in-flight request.
let quizCache = null;
let inflight = null;

export const getCachedQuiz = () => quizCache;

export const fetchQuiz = ({ force = false } = {}) => {
  if (quizCache && !force) return Promise.resolve(quizCache);
  if (inflight) return inflight;
  inflight = api
    .get("/quiz")
    .then((r) => {
      quizCache = r.data;
      return quizCache;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
};

// Fire-and-forget warm-up, called at app boot so the questions (and the API
// instance) are ready before the user opens the Quiz tab.
export const prefetchQuiz = () => {
  fetchQuiz().catch(() => {});
};
export const submitQuiz = (answers) =>
  api.post("/quiz/submit", { answers }).then((r) => r.data);

// Check a single answer — returns { correct, correctId, xpAwarded, xp }.
export const answerQuiz = (id, optionId) =>
  api.post(`/quiz/${id}/answer`, { optionId }).then((r) => r.data);
