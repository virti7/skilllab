import { PrismaClient } from '@prisma/client';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error'],
  });
} else {
  if (!global._prisma) {
    global._prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  prisma = global._prisma;
}

export { prisma };
