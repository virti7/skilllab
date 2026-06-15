import { PrismaClient } from '@prisma/client';
import logger from './logger.js';

function sanitizeDatabaseUrl(url) {
  if (!url) return url;
  let cleaned = url.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
    logger.warn('DATABASE_URL contained quote characters — stripped automatically');
  }
  return cleaned;
}

const rawUrl = process.env.DATABASE_URL;
const cleanUrl = sanitizeDatabaseUrl(rawUrl);
if (rawUrl !== cleanUrl) {
  process.env.DATABASE_URL = cleanUrl;
}

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn', 'info'],
  });
} else {
  if (!global._prisma) {
    global._prisma = new PrismaClient({
      log: ['error', 'warn', 'info', 'query'],
    });
  }
  prisma = global._prisma;
}

async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
    return true;
  } catch (error) {
    logger.error('Database connection failed', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return false;
  }
}

async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Database disconnect error', { message: error.message });
  }
}

export { prisma, connectDatabase, disconnectDatabase };
