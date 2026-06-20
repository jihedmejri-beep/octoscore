import mongoose from "mongoose";
import { idTransform } from "./_transform.js";

// Generic singleton store for structured site content the admin edits as a
// whole: keyed documents such as "bracket" and "rules".
const contentSchema = new mongoose.Schema(
  {
    _id: { type: String }, // the key, e.g. "bracket" | "rules"
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false }
);

contentSchema.set("toJSON", idTransform);

export default mongoose.model("Content", contentSchema);
