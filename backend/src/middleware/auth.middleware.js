import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';
import { sendError } from '../utils/response.js';
import logger from '../utils/logger.js';

export async function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    logger.debug('JWT payload decoded', {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      instituteId: payload.instituteId,
      name: payload.name,
    });

    let role = payload.role ? payload.role.toUpperCase() : null;

    if (!role) {
      logger.warn('JWT missing role field — fetching from database', { userId: payload.id });
      try {
        const user = await prisma.user.findUnique({
          where: { id: payload.id },
          select: { role: true },
        });
        if (user) {
          role = user.role;
          logger.info('Role resolved from database fallback', { userId: payload.id, role });
        } else {
          logger.error('User not found in database during authenticate', { userId: payload.id });
          return sendError(res, 'User not found', 401);
        }
      } catch (dbErr) {
        logger.error('Database lookup failed during authenticate', { userId: payload.id, error: dbErr.message });
        return sendError(res, 'Authentication error', 500);
      }
    }

    req.user = {
      id: payload.id,
      email: payload.email,
      role,
      name: payload.name,
      instituteId: payload.instituteId,
    };

    logger.debug('Authenticated user set on request', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      instituteId: req.user.instituteId,
    });

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      logger.warn('Token expired', { error: err.message });
      return sendError(res, 'Session expired. Please login again.', 401);
    }
    logger.warn('Invalid token', { error: err.message });
    return sendError(res, 'Invalid token. Please login again.', 401);
  }
}

export { requireRole } from './roleGuard.js';

export async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    let role = payload.role ? payload.role.toUpperCase() : null;

    if (!role) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: payload.id },
          select: { role: true },
        });
        if (user) {
          role = user.role;
        }
      } catch {
        // Silently continue with null role for optional auth
      }
    }

    req.user = {
      id: payload.id,
      email: payload.email,
      role,
      name: payload.name,
      instituteId: payload.instituteId,
    };
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
}
