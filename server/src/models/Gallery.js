import mongoose from "mongoose";
import { idTransform, prefixedId } from "./_transform.js";

// A "tournament memory" tile. image holds the Cloudinary asset (admin upload);
// when empty the frontend renders a designed accent tile instead.
const gallerySchema = new mongoose.Schema(
  {
    _id: { type: String, default: prefixedId("g") },
    title: { type: String, required: true, trim: true },
    tag: { type: String, default: "" },
    caption: { type: String, default: "" },
    date: { type: Date, default: Date.now },
    accent: {
      type: String,
      enum: ["purple", "green", "cyan", "gold"],
      default: "purple",
    },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
      width: { type: Number, default: null },
      height: { type: Number, default: null },
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

gallerySchema.set("toJSON", idTransform);

export default mongoose.model("Gallery", gallerySchema);
