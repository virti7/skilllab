import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { errorHandler, generalLimiter } from './middleware/index.js';
import logger from './utils/logger.js';

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

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) || 'http://localhost:5173',
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.get('/api/health', async (req, res) => {
  const dbStatus = { status: 'unknown' };
  try {
    const { prisma } = await import('./utils/prisma.js');
    await prisma.$queryRaw`SELECT 1`;
    dbStatus.status = 'connected';
  } catch {
    dbStatus.status = 'disconnected';
  }
  res.json({ status: 'ok', db: dbStatus, timestamp: new Date().toISOString(), uptime: process.uptime() });
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`SkillLab backend running on http://localhost:${PORT}`, { environment: process.env.NODE_ENV });
});

export default app;
