// Preview the AI quiz generator end-to-end (strict prompt + fact-check pass).
//   node scripts/test-quiz-llm.js
// Reads LLM_* from .env, generates a full set exactly as it would be saved, and
// prints every question with the correct answer marked. Does NOT touch the
// database. Never prints your API key.
import "dotenv/config";

import { isQuizGenEnabled, generateQuestions } from "../src/services/quizGenerator.js";

if (!isQuizGenEnabled()) {
  console.error("✖ LLM_BASE_URL is not set in .env — nothing to test.");
  process.exit(1);
}

console.log(`→ Endpoint    : ${process.env.LLM_BASE_URL}`);
console.log(`→ Model       : ${process.env.LLM_MODEL || "llama-3.3-70b-versatile"}`);
console.log(`→ Temperature : ${process.env.QUIZ_TEMPERATURE || "0.4"}`);
console.log(`→ Fact-check  : ${process.env.QUIZ_VERIFY !== "false" ? "on" : "off"}`);
console.log("→ Generating (this runs the real prompt + verification, ~2 calls)…\n");

try {
  const questions = await generateQuestions();
  console.log(`✓ ${questions.length} questions generated:\n`);
  questions.forEach((q, i) => {
    console.log(`${i + 1}. ${q.question}`);
    q.options.forEach((o) => {
      console.log(`    ${o.id === q.correctId ? "✓" : " "} ${o.id}) ${o.label}`);
    });
    console.log("");
  });
  console.log("If these look good, click Regenerate in admin (or restart the server) to go live.");
} catch (err) {
  console.error("✖ Generation failed:", err.message);
  process.exit(1);
}
