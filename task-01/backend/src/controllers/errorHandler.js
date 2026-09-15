const AppError = require("../services/AppError");

function catchAsync(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error(err);

  if (err.code === "23505") {
    return res.status(409).json({ message: "That value must be unique — it's already in use." });
  }
  res.status(500).json({ message: "Internal server error." });
}

function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { catchAsync, errorHandler, notFound };
