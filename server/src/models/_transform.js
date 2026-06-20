import mongoose from "mongoose";

// Shared toJSON transform for models that use a human-readable String _id
// (e.g. "t1", "m1", "g1"). Exposes it as `id` and drops Mongo internals so the
// API response shape matches the frontend's existing data objects 1:1.
export const idTransform = {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
};

// Generate a unique String _id with a readable prefix (e.g. "g" + objectId).
export const prefixedId = (prefix) => () =>
  prefix + new mongoose.Types.ObjectId().toString();
