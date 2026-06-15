import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { errorHandler, generalLimiter } from './middleware/index.js';
import logger from './utils/logger.js';
import { prisma } from './utils/prisma.js';

import authRoutes from './routes/auth.routes.js';
import batchRoutes from './routes/batch.routes.js';
import testRoutes from './routes/test.routes.js';
import resultRoutes from './routes/result.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import aiRoutes from './routes/ai.routes.js';
import testAnalyticsRoutes from './routes/testAnalytics.routes.js';
import testResultRoutes from './routes/testResult.routes.js';
import studentRoutes from './routes/student.routes.js';
import practiceSheetsRoutes from './routes/practiceSheets.routes.js';
import codingRoutes from './routes/coding.routes.js';
import compilerRoutes from './routes/compiler.routes.js';

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:5173'];

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Rate limiting
app.use('/api', generalLimiter);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SkillLab API is running successfully',
    status: 'healthy',
    environment: process.env.NODE_ENV,
  });
});

// Startup env validation
const REQUIRED_ENV_VARS = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
if (missing.length > 0) {
  logger.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-in-production' || process.env.JWT_SECRET?.length < 16) {
  logger.warn('JWT_SECRET is weak or still set to default value');
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', async (req, res) => {
  const dbStatus = { status: 'unknown' };
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus.status = 'connected';
  } catch (err) {
    dbStatus.status = 'disconnected';
    dbStatus.error = err.message;
  }
  res.status(200).json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: dbStatus,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/test', testRoutes);
app.use('/api/test', testAnalyticsRoutes);
app.use('/api/test', testResultRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/result', resultRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/compiler', compilerRoutes);
app.use('/api/practice-sheets', practiceSheetsRoutes);

// 404 handler - must be after all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`SkillLab backend running on http://localhost:${PORT}`, { environment: process.env.NODE_ENV });
});

export default app;
