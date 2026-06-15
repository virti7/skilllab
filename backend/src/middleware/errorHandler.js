import logger from '../utils/logger.js';
import { sendError } from '../utils/response.js';

export function errorHandler(err, req, res, _next) {
  logger.error('Unhandled error', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    method: req.method,
    path: req.path,
  });

  if (res.headersSent) return;

  // Zod validation errors
  if (err.name === 'ZodError') {
    return sendError(res, 'Validation failed', 400, err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    })));
  }

  // Prisma known errors
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        return sendError(res, 'Resource already exists', 409);
      case 'P2025':
        return sendError(res, 'Resource not found', 404);
      case 'P2003':
        return sendError(res, 'Referenced resource not found', 400);
      default:
        break;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return sendError(res, 'Invalid or expired token', 401);
  }

  const statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  if (process.env.NODE_ENV === 'production') {
    if (statusCode === 500) message = 'Internal server error';
    if (statusCode >= 500) logger.error('Server error', { message: err.message, stack: err.stack });
  }

  return sendError(res, message, statusCode);
}
