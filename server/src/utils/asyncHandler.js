// Wrap async route handlers so rejected promises flow to the error middleware
// instead of crashing the process.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
