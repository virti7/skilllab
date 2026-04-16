import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

function createPrismaClient() {
  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const urlWithNoCache = dbUrl.includes('statement_cache_size') 
    ? dbUrl 
    : dbUrl + (dbUrl.includes('?') ? '&' : '?') + 'statement_cache_size=0';
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: urlWithNoCache,
      },
    },
  });
}

export const prisma = createPrismaClient();