import { sendError } from '../utils/response.js';

export function requireRole(...roles) {
  const normalized = roles.map(r => r.toUpperCase());
  return (req, res, next) => {
    if (!req.user || !normalized.includes(req.user.role)) {
      return sendError(res, 'Forbidden: insufficient permissions', 403);
    }
    next();
  };
}
