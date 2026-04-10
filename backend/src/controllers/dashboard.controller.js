import prisma from '../utils/prisma.js';

// GET /api/dashboard/admin
export async function adminDashboard(req, res) {
  try {
    const { instituteId } = req.user;

    const [totalStudents, totalBatches, totalTests, results] = await Promise.all([
      prisma.user.count({ where: { instituteId, role: 'STUDENT' } }),
      prisma.batch.count({ where: { instituteId } }),
      prisma.test.count({ where: { instituteId } }),
      prisma.result.findMany({
        where: { test: { instituteId } },
        select: { percentage: true, submittedAt: true },
      }),
    ]);

    const avgScore =
      results.length > 0
        ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
        : 0;

    // Recent tests with submission counts
    const recentTests = await prisma.test.findMany({
      where: { instituteId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        batch: { select: { name: true } },
        _count: { select: { results: true } },
        results: {
          select: { percentage: true },
        },
      },
    });

    // Monthly performance (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyResults = await prisma.result.findMany({
      where: {
        test: { instituteId },
        submittedAt: { gte: sixMonthsAgo },
      },
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

    return res.json({
      stats: {
        totalStudents,
        totalBatches,
        totalTests,
        avgScore,
      },
      recentTests: recentTests.map((t) => ({
        id: t.id,
        name: t.title,
        batch: t.batch?.name || 'All Batches',
        date: t.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        avgScore:
          t.results.length > 0
            ? Math.round(t.results.reduce((s, r) => s + r.percentage, 0) / t.results.length)
            : 0,
        submissions: t._count.results,
      })),
      monthlyPerformance,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/dashboard/student
export async function studentDashboard(req, res) {
  try {
    const { id: userId, instituteId } = req.user;

    const batchStudents = await prisma.batchStudent.findMany({
      where: { userId },
      select: { batchId: true },
    });
    const batchIds = batchStudents.map((bs) => bs.batchId);

    const [results, assignedTests] = await Promise.all([
      prisma.result.findMany({
        where: { userId },
        include: {
          test: { select: { id: true, title: true, batch: { select: { name: true } } } },
        },
        orderBy: { submittedAt: 'desc' },
      }),
      prisma.test.findMany({
        where: {
          OR: [
            { batchId: { in: batchIds } },
            { batchId: null, instituteId: instituteId || undefined },
          ],
        },
        include: {
          _count: { select: { questions: true } },
          results: { where: { userId }, select: { id: true, score: true, percentage: true } },
          batch: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const pendingTests = assignedTests.filter((t) => t.results.length === 0);
    const completedTests = results;
    const avgScore =
      results.length > 0
        ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
        : 0;

    // Score trend (last 7 results)
    const scoreTrend = results.slice(0, 7).reverse().map((r, i) => ({
      test: `T${i + 1}`,
      score: r.percentage,
    }));

    // Rank among institute students
    const rankData = await prisma.$queryRaw`
      SELECT rank FROM (
        SELECT
          u.id,
          RANK() OVER (ORDER BY COALESCE(SUM(r.score), 0) DESC) AS rank
        FROM users u
        LEFT JOIN results r ON r."userId" = u.id
        LEFT JOIN tests t ON t.id = r."testId" AND t."instituteId" = ${instituteId || ''}
        WHERE u."instituteId" = ${instituteId || ''}
          AND u.role = 'STUDENT'
        GROUP BY u.id
      ) ranked WHERE id = ${userId}
    `;

    const batchRank = rankData[0]?.rank ? Number(rankData[0].rank) : null;

    return res.json({
      pendingCount: pendingTests.length,
      completedCount: completedTests.length,
      avgScore,
      batchRank,
      scoreTrend,
      recentTests: assignedTests.map((t) => ({
        id: t.id,
        name: t.title,
        duration: `${t.duration} min`,
        batchName: t.batch?.name || null,
        status: t.results.length > 0 ? 'completed' : 'pending',
        score: t.results[0]?.percentage ?? null,
        questionCount: t._count.questions,
      })),
    });
  } catch (err) {
    console.error('Student dashboard error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
