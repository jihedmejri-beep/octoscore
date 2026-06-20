import { Router } from "express";

import {
  getQuiz,
  getQuizAdmin,
  quizStatus,
  submitQuiz,
  answerQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  generateQuiz,
} from "../controllers/quizController.js";
import { protect, admin, optionalAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", getQuiz);
router.get("/manage", protect, admin, getQuizAdmin); // before /:id
router.get("/status", protect, admin, quizStatus); // AI config + next refresh
router.post("/generate", protect, admin, generateQuiz); // force AI regeneration
router.post("/submit", optionalAuth, submitQuiz);
router.post("/:id/answer", optionalAuth, answerQuestion);
router.post("/", protect, admin, createQuestion);
router.put("/:id", protect, admin, updateQuestion);
router.delete("/:id", protect, admin, deleteQuestion);

export default router;
