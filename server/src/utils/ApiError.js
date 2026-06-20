// Lightweight error carrying an HTTP status code, thrown from controllers.
export default class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
