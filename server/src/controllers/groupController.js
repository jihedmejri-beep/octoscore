import Group from "../models/Group.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

// GET /api/groups
export const getGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find().sort({ order: 1, _id: 1 });
  res.json(groups);
});

// GET /api/groups/:id
export const getGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) throw new ApiError(404, "Group not found");
  res.json(group);
});

// POST /api/groups (admin)
export const createGroup = asyncHandler(async (req, res) => {
  const group = await Group.create(req.body);
  res.status(201).json(group);
});

// PUT /api/groups/:id (admin)
export const updateGroup = asyncHandler(async (req, res) => {
  const group = await Group.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!group) throw new ApiError(404, "Group not found");
  res.json(group);
});

// DELETE /api/groups/:id (admin)
export const deleteGroup = asyncHandler(async (req, res) => {
  const group = await Group.findByIdAndDelete(req.params.id);
  if (!group) throw new ApiError(404, "Group not found");
  res.json({ message: "Group deleted" });
});
