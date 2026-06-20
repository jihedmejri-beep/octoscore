// 404 for unmatched routes.
export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`));
};

// Central error handler — normalizes Mongoose/JWT errors to clean JSON.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status =
    err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || "Server error";

  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `That ${field} is already taken` : "Duplicate value";
  } else if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  } else if (err.name === "CastError") {
    status = 400;
    message = `Invalid value for "${err.path}"`;
  } else if (err.name === "MulterError") {
    status = 400;
    message =
      err.code === "LIMIT_FILE_SIZE" ? "Image is too large (max 8 MB)" : err.message;
  }

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV === "production" ? {} : { stack: err.stack }),
  });
};
