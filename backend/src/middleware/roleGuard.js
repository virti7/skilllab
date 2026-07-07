import { prisma } from '../utils/prisma.js';
import { sendError } from '../utils/response.js';
import logger from '../utils/logger.js';

export function requireRole(...roles) {
  const normalized = roles.map(r => r.toUpperCase());
  return async (req, res, next) => {
    logger.debug('requireRole check', {
      userId: req.user?.id,
      userRole: req.user?.role,
      requiredRoles: normalized,
      path: req.path,
      method: req.method,
    });

    if (!req.user) {
      logger.warn('requireRole failed: no user on request', { path: req.path, method: req.method });
      return sendError(res, 'Authentication required. Please login.', 401);
    }

    if (normalized.includes(req.user.role)) {
      return next();
    }

    logger.info('requireRole: role mismatch — checking database', {
      userId: req.user.id,
      userRole: req.user.role,
      requiredRoles: normalized,
    });

    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true },
      });

      if (dbUser) {
        const dbRole = dbUser.role;
        logger.info('requireRole: database role', {
          userId: req.user.id,
          dbRole,
          requiredRoles: normalized,
        });

        if (normalized.includes(dbRole)) {
          req.user.role = dbRole;
          logger.info('requireRole: role corrected from database', {
            userId: req.user.id,
            correctedRole: dbRole,
          });
          return next();
        }

        logger.warn('requireRole: database role also does not match', {
          userId: req.user.id,
          dbRole,
          requiredRoles: normalized,
        });
      } else {
        logger.error('requireRole: user not found in database', { userId: req.user.id });
        return sendError(res, 'User account not found', 401);
      }
    } catch (dbErr) {
      logger.error('requireRole: database lookup failed', { userId: req.user.id, error: dbErr.message });
      return sendError(res, 'Authentication error. Please login again.', 500);
    }

    logger.warn('requireRole: access denied', {
      userId: req.user.id,
      userRole: req.user.role,
      requiredRoles: normalized,
      path: req.path,
      method: req.method,
    });

    const roleNames = normalized.map(r => r.toLowerCase().replace(/_/g, ' '));
    const message = `Access denied. Required role: ${roleNames.join(' or ')}. Your role: ${req.user.role ? req.user.role.toLowerCase().replace(/_/g, ' ') : 'none'}`;
    return sendError(res, message, 403);
  };
}
