import mongoose from "mongoose";
import { idTransform, prefixedId } from "./_transform.js";

const optionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // "a" / "b" / "c" / "d"
    label: { type: String, required: true },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    _id: { type: String, default: prefixedId("q") },
    question: { type: String, required: true, trim: true },
    options: { type: [optionSchema], default: [] },
    correctId: { type: String, required: true }, // hidden from public API
    // Relative challenge of the question. Generated quizzes ship a fixed mix
    // (easy → medium → hard); hand-added questions default to medium.
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    order: { type: Number, default: 0 },
    // True for LLM-generated questions; lets the daily auto-refresh tell its own
    // pool apart from hand-seeded/admin questions (see services/quizGenerator).
    generated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

quizSchema.set("toJSON", idTransform);

export default mongoose.model("Quiz", quizSchema);
