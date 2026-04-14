import 'dotenv/config';
import { prisma } from './src/utils/prisma.js';
import bcrypt from 'bcrypt';

console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

try {
  console.log('Testing bcrypt...');
  const hash = await bcrypt.hash('password123', 10);
  console.log('bcrypt OK');

  console.log('Testing prisma.user.findUnique...');
  const existing = await prisma.user.findUnique({ where: { email: 'test@test.com' } });
  console.log('findUnique OK:', existing);

  console.log('ALL OK - DB is connected');
} catch (error) {
  console.error('CAUGHT ERROR TYPE:', error.constructor.name);
  console.error('CAUGHT ERROR MESSAGE:', error.message);
  console.error('CAUGHT ERROR CODE:', error.code);
} finally {
  await prisma.$disconnect();
  process.exit(0);
}
