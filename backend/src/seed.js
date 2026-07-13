import bcrypt from 'bcryptjs';
import { prisma } from './utils/prisma.js';
import logger from './utils/logger.js';

const SUPER_ADMIN_EMAIL = 'admin@skilllab.com';
const SUPER_ADMIN_PASSWORD = 'SkillLab@123';
const SUPER_ADMIN_NAME = 'Super Admin';

export async function seedSuperAdmin() {
  try {
    const existing = await prisma.user.findUnique({
      where: { email: SUPER_ADMIN_EMAIL },
    });

    if (existing) {
      logger.info('Super Admin account already exists — skipping seed', { email: SUPER_ADMIN_EMAIL });
      return;
    }

    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);

    const institute = await prisma.institute.findFirst();
    const instituteId = institute?.id || null;

    await prisma.user.create({
      data: {
        name: SUPER_ADMIN_NAME,
        email: SUPER_ADMIN_EMAIL,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        instituteId,
      },
    });

    logger.info('Default Super Admin account created', { email: SUPER_ADMIN_EMAIL });
  } catch (error) {
    logger.error('Failed to seed Super Admin account', { message: error.message });
  }
}
