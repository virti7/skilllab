import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import logger from '../utils/logger.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Z]/, 'Password must contain an uppercase letter').regex(/[0-9]/, 'Password must contain a number'),
  role: z.enum(['admin', 'student', 'super_admin', 'ADMIN', 'STUDENT', 'SUPER_ADMIN'], { errorMap: () => ({ message: 'Role must be one of: admin, student, super_admin' }) }),
  instituteName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, instituteId: user.instituteId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.toLowerCase(),
    instituteId: user.instituteId,
  };
}

export async function register(req, res, next) {
  try {
    logger.debug('Register request body', { body: req.body });
    const parsed = registerSchema.parse(req.body);
    const { name, email, password, role, instituteName } = parsed;
    const uppercaseRole = role.toUpperCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return sendError(res, 'User already exists with this email', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    let instituteId = null;

    if (uppercaseRole === 'ADMIN') {
      if (!instituteName) {
        return sendError(res, 'Institute name is required for admin registration', 400);
      }
      const newInstitute = await prisma.institute.create({
        data: { name: instituteName },
      });
      instituteId = newInstitute.id;
    } else {
      const institute = await prisma.institute.findFirst();
      instituteId = institute?.id || null;
    }

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: uppercaseRole, instituteId },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    logger.info('User registered', { userId: user.id, role: uppercaseRole });

    return sendSuccess(res, {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    }, 'User registered successfully', 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, 'Validation failed', 400, error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const parsed = loginSchema.parse(req.body);
    const { email, password } = parsed;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    logger.info('User logged in', { userId: user.id, role: user.role });

    return sendSuccess(res, {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    }, 'Login successful');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, 'Validation failed', 400, error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }
    next(error);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return sendError(res, 'Refresh token is required', 400);
    }

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    logger.info('Token refreshed', { userId: user.id });

    return sendSuccess(res, {
      accessToken,
      refreshToken: newRefreshToken,
    }, 'Token refreshed successfully');
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Refresh token expired, please login again', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid refresh token', 401);
    }
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { institute: true },
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, {
      ...sanitizeUser(user),
      instituteName: user.institute?.name,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res) {
  return sendSuccess(res, null, 'Logged out successfully');
}
