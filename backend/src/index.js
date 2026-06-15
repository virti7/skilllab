import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { errorHandler, generalLimiter } from './middleware/index.js';
import logger from './utils/logger.js';
import { prisma, connectDatabase, disconnectDatabase } from './utils/prisma.js';

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

const envDiagnostics = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  JWT_SECRET: process.env.JWT_SECRET ? `${process.env.JWT_SECRET.slice(0, 8)}...` : 'MISSING',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? `${process.env.JWT_REFRESH_SECRET.slice(0, 8)}...` : 'MISSING',
  DATABASE_URL: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@') : 'MISSING',
  FRONTEND_URL: process.env.FRONTEND_URL,
  GROQ_API_KEY: process.env.GROQ_API_KEY ? 'present' : 'MISSING',
};

logger.info('Environment variables loaded', envDiagnostics);

// Check for quoted DATABASE_URL
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  if ((dbUrl.startsWith('"') || dbUrl.startsWith("'")) && (dbUrl.endsWith('"') || dbUrl.endsWith("'"))) {
    logger.error('DATABASE_URL contains quote/apostrophe characters — Prisma will fail to connect. Remove quotes in Render environment variable.');
  }
}

if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-in-production' || process.env.JWT_SECRET?.length < 16) {
  logger.warn('JWT_SECRET is weak or still set to default value');
}

// Health check
app.get('/health', async (req, res) => {
  let dbConnected = false;
  let dbError = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch (err) {
    dbError = err.message;
  }
  res.status(200).json({
    success: true,
    status: dbConnected ? 'healthy' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: dbConnected ? 'connected' : 'disconnected',
    databaseError: dbError,
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
    dbStatus.code = err.code;
  }
  res.status(200).json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
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

async function startServer() {
  const dbConnected = await connectDatabase();
  if (dbConnected) {
    logger.info('Startup complete — database connection verified');
  } else {
    logger.error('Startup complete — database connection FAILED. Requests will return errors until database is reachable.');
  }

  app.listen(PORT, () => {
    logger.info(`SkillLab backend running on http://localhost:${PORT}`, {
      environment: process.env.NODE_ENV,
      database: dbConnected ? 'connected' : 'disconnected',
      port: PORT,
    });
  });
}

startServer().catch((err) => {
  logger.error('Failed to start server', { message: err.message, stack: err.stack });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down gracefully');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received — shutting down gracefully');
  await disconnectDatabase();
  process.exit(0);
});

export default app;
