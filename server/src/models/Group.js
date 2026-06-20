import mongoose from "mongoose";
import { idTransform, prefixedId } from "./_transform.js";

// Tournament group / zone, e.g. A = "Sousse", B = "Teboulba".
const groupSchema = new mongoose.Schema(
  {
    _id: { type: String, default: prefixedId("grp") },
    name: { type: String, required: true, trim: true },
    city: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

groupSchema.set("toJSON", idTransform);

export default mongoose.model("Group", groupSchema);
