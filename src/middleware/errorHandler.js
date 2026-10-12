export class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function notFound(request, _response, next) {
  next(new AppError(404, `Route not found: ${request.method} ${request.originalUrl}`));
}

export function errorHandler(error, _request, response, _next) {
  const statusCode = error.statusCode || (error.name === 'MulterError' ? 400 : 500);
  const message = statusCode >= 500 ? 'Something went wrong.' : error.message;
  response.status(statusCode).json({ error: message });
}