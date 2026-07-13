import { prisma } from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import logger from '../utils/logger.js';

export async function superAdminDashboard(req, res, next) {
  try {
    const [
      totalInstitutes,
      totalUsers,
      totalStudents,
      totalAdmins,
      totalTests,
      totalResults,
    ] = await Promise.all([
      prisma.institute.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { role: 'STUDENT', deletedAt: null } }),
      prisma.user.count({ where: { role: 'ADMIN', deletedAt: null } }),
      prisma.test.count({ where: { deletedAt: null } }),
      prisma.result.count(),
    ]);

    const avgScore = totalResults > 0
      ? Math.round(
          (await prisma.result.aggregate({ _avg: { percentage: true } }))._avg.percentage || 0
        )
      : 0;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyResults = await prisma.result.findMany({
      where: { submittedAt: { gte: sixMonthsAgo } },
      select: { percentage: true, submittedAt: true },
    });

    const monthlyMap = {};
    monthlyResults.forEach((r) => {
      const month = r.submittedAt.toLocaleString('en-US', { month: 'short' });
      if (!monthlyMap[month]) monthlyMap[month] = [];
      monthlyMap[month].push(r.percentage);
    });

    const monthlyPerformance = Object.entries(monthlyMap).map(([month, scores]) => ({
      month,
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));

    const recentInstitutes = await prisma.institute.findMany({
      where: { deletedAt: null },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { users: true, batches: true } },
      },
    });

    return sendSuccess(res, {
      stats: {
        totalInstitutes,
        totalUsers,
        totalStudents,
        totalAdmins,
        totalTests,
        avgScore,
      },
      monthlyPerformance,
      recentInstitutes: recentInstitutes.map((i) => ({
        id: i.id,
        name: i.name,
        userCount: i._count.users,
        batchCount: i._count.batches,
        createdAt: i.createdAt.toISOString(),
      })),
    }, 'Super admin dashboard data retrieved');
  } catch (err) {
    logger.error('superAdminDashboard error', { error: err.message });
    next(err);
  }
}

export async function getInstitutes(req, res, next) {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = { deletedAt: null };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [institutes, total] = await Promise.all([
      prisma.institute.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              batches: true,
            },
          },
          users: {
            where: { role: 'STUDENT' },
            select: { id: true },
          },
        },
      }),
      prisma.institute.count({ where }),
    ]);

    return sendSuccess(res, {
      institutes: institutes.map((i) => ({
        id: i.id,
        name: i.name,
        studentCount: i.users.length,
        userCount: i._count.users,
        batchCount: i._count.batches,
        createdAt: i.createdAt.toISOString(),
      })),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    }, 'Institutes retrieved');
  } catch (err) {
    logger.error('getInstitutes error', { error: err.message });
    next(err);
  }
}

export async function getUsers(req, res, next) {
  try {
    const { search, role, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) {
      where.role = role.toUpperCase();
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          institute: { select: { id: true, name: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return sendSuccess(res, {
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        instituteName: u.institute?.name || null,
        instituteId: u.instituteId,
        createdAt: u.createdAt.toISOString(),
      })),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    }, 'Users retrieved');
  } catch (err) {
    logger.error('getUsers error', { error: err.message });
    next(err);
  }
}

export async function getSubscriptions(req, res, next) {
  return sendSuccess(res, {
    plans: [],
    message: 'Subscription management coming soon',
  }, 'Subscriptions retrieved');
}
