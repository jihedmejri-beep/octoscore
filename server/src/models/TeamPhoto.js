import mongoose from "mongoose";
import { idTransform, prefixedId } from "./_transform.js";

// One photo in a team's album. The image lives on Cloudinary; the public API
// derives optimized thumbnail / full / download URLs from its publicId.
const teamPhotoSchema = new mongoose.Schema(
  {
    _id: { type: String, default: prefixedId("tp") },
    teamId: { type: String, required: true, index: true },
    caption: { type: String, default: "", trim: true },
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

teamPhotoSchema.set("toJSON", idTransform);

export default mongoose.model("TeamPhoto", teamPhotoSchema);
