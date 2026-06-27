import mongoose from "mongoose";
import { idTransform, prefixedId } from "./_transform.js";

const teamSchema = new mongoose.Schema(
  {
    _id: { type: String, default: prefixedId("t") },
    name: { type: String, required: true, trim: true },
    group: { type: String, required: true }, // Group _id ("A" / "B" / "FINAL")
    city: { type: String, default: "" },
    // Optional crest image (Cloudinary). The UI falls back to text initials.
    logo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    color: { type: String, default: "" }, // optional brand accent
    // Lineup shape used to auto-place starters on the pitch.
    formation: {
      type: String,
      enum: ["3-2-2", "2-2-3", "3-1-1"],
      default: "3-2-2",
    },
  },
  { timestamps: true }
);

teamSchema.set("toJSON", idTransform);

export default mongoose.model("Team", teamSchema);
