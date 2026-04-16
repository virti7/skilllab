import { prisma } from '../utils/prisma.js';

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

// GET /api/admin/students
export async function getAdminStudents(req, res) {
  try {
    const { instituteId } = req.user;

    // Step 1: Get all batches of admin's institute
    const batches = await prisma.batch.findMany({
      where: { instituteId },
      select: { id: true },
    });

    const batchIds = batches.map((b) => b.id);

    if (batchIds.length === 0) {
      return res.json([]);
    }

    // Step 2: Get all students from batch_students table
    const batchStudents = await prisma.batchStudent.findMany({
      where: { batchId: { in: batchIds } },
      include: {
        user: {
          include: {
            results: {
              select: { percentage: true, submittedAt: true },
            },
          },
        },
        batch: { select: { name: true } },
      },
    });

    // Step 3: Transform with Map to avoid duplicates
    const studentsMap = new Map();

    batchStudents.forEach((bs) => {
      const user = bs.user;

      if (!studentsMap.has(user.id)) {
        const totalTests = user.results.length;
        const avgScore =
          totalTests > 0
            ? Math.round(
                user.results.reduce((acc, r) => acc + r.percentage, 0) /
                  totalTests
              )
            : 0;

        const lastActive =
          user.results[0]?.submittedAt || user.createdAt;

        studentsMap.set(user.id, {
          id: user.id,
          name: user.name,
          email: user.email,
          batchName: bs.batch.name,
          totalTests,
          avgScore,
          lastActive: lastActive ? lastActive.toISOString() : null,
        });
      }
    });

    const students = Array.from(studentsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return res.json(students);
  } catch (err) {
    console.error('Get admin students error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/dashboard/batch-performance
export async function getBatchPerformance(req, res) {
  try {
    const { instituteId } = req.user;

    const batches = await prisma.batch.findMany({
      where: { instituteId },
      include: {
        tests: {
          include: {
            results: true
          }
        },
        batchStudents: {
          include: {
            user: true
          }
        }
      }
    });

    const batchAnalytics = batches.map(batch => {
      let totalScore = 0;
      let totalSubmissions = 0;
      let totalTests = batch.tests.length;

      batch.tests.forEach(test => {
        test.results.forEach(result => {
          totalScore += result.percentage || 0;
          totalSubmissions++;
        });
      });

      const avgScore = totalSubmissions > 0
        ? Number((totalScore / totalSubmissions).toFixed(2))
        : 0;

      const uniqueStudents = new Set(batch.batchStudents.map(bs => bs.userId));

      return {
        batchId: batch.id,
        batchName: batch.name,
        avgScore,
        totalStudents: uniqueStudents.size,
        totalTests,
        totalSubmissions
      };
    });

    const sortedByScore = [...batchAnalytics].sort((a, b) => b.avgScore - a.avgScore);
    const bestBatch = sortedByScore.find(b => b.avgScore > 0);
    const worstBatch = [...sortedByScore].reverse().find(b => b.avgScore > 0);
    const overallAvg = batchAnalytics.length > 0
      ? Number((batchAnalytics.reduce((sum, b) => sum + b.avgScore, 0) / batchAnalytics.length).toFixed(2))
      : 0;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trendResults = await prisma.result.findMany({
      where: {
        test: { instituteId },
        submittedAt: { gte: sixMonthsAgo }
      },
      select: {
        percentage: true,
        submittedAt: true
      },
      orderBy: { submittedAt: 'asc' }
    });

    const weeklyMap = {};
    trendResults.forEach(r => {
      const date = new Date(r.submittedAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      if (!weeklyMap[weekKey]) weeklyMap[weekKey] = [];
      weeklyMap[weekKey].push(r.percentage);
    });

    const trendData = Object.entries(weeklyMap)
      .map(([week, scores]) => ({
        week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      }));

    return res.json({
      batches: batchAnalytics,
      summary: {
        totalBatches: batchAnalytics.length,
        bestBatch: bestBatch ? { name: bestBatch.batchName, score: bestBatch.avgScore } : null,
        worstBatch: worstBatch ? { name: worstBatch.batchName, score: worstBatch.avgScore } : null,
        overallAvg
      },
      trend: trendData
    });
  } catch (err) {
    console.error('Batch performance error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/admin/student/:id
export async function getStudentAnalytics(req, res) {
  try {
    const { id: studentId } = req.params;
    const { id: adminId, role, instituteId } = req.user;

    // Check role - admin or super_admin only
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    console.log('Admin request:', { adminId, role, instituteId });
    console.log('Fetch student:', studentId);

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        results: {
          include: {
            test: { select: { title: true } },
            answers: {
              include: {
                question: { select: { topic: true } },
              },
            },
          },
          orderBy: { submittedAt: 'asc' },
        },
        batchStudents: {
          include: {
            batch: { select: { id: true, name: true, instituteId: true } },
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    console.log('Student data:', {
      id: student.id,
      name: student.name,
      instituteId: student.instituteId,
      batches: student.batchStudents.map(bs => ({ batchId: bs.batch.id, instituteId: bs.batch.instituteId }))
    });

    // Verify student belongs to same institute (via user.instituteId OR batch.instituteId)
    const studentBatchInstituteIds = student.batchStudents.map(bs => bs.batch.instituteId);
    const belongsToInstitute =
      (student.instituteId && student.instituteId === instituteId) ||
      studentBatchInstituteIds.includes(instituteId);

    if (!belongsToInstitute) {
      console.log('Access denied - student not in admin institute');
      return res.status(403).json({ error: 'Unauthorized access to this student' });
    }

    const totalTests = student.results.length;
    const avgScore =
      totalTests > 0
        ? Math.round(student.results.reduce((s, r) => s + r.percentage, 0) / totalTests)
        : 0;

    // Calculate rank using batch-based approach (same as admin students list)
    const batches = await prisma.batch.findMany({
      where: { instituteId },
      select: { id: true },
    });
    const batchIds = batches.map(b => b.id);

    let allStudents = [];
    if (batchIds.length > 0) {
      const batchStudents = await prisma.batchStudent.findMany({
        where: { batchId: { in: batchIds } },
        include: {
          user: {
            include: {
              results: { select: { percentage: true } },
            },
          },
        },
      });

      const studentMap = new Map();
      batchStudents.forEach(bs => {
        if (!studentMap.has(bs.user.id)) {
          studentMap.set(bs.user.id, bs.user);
        }
      });
      allStudents = Array.from(studentMap.values());
    }

    const rankedStudents = allStudents
      .map((s) => ({
        id: s.id,
        avgScore: s.results.length > 0
          ? Math.round(s.results.reduce((sum, r) => sum + r.percentage, 0) / s.results.length)
          : 0,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    const rank = rankedStudents.findIndex((s) => s.id === studentId) + 1;

    // Topic breakdown
    const topicStats = {};
    student.results.forEach((result) => {
      result.answers.forEach((answer) => {
        const topic = answer.question?.topic || 'General';
        if (!topicStats[topic]) {
          topicStats[topic] = { total: 0, correct: 0 };
        }
        topicStats[topic].total++;
        if (answer.isCorrect) {
          topicStats[topic].correct++;
        }
      });
    });

    const topicBreakdown = Object.entries(topicStats).map(([topic, stats]) => ({
      topic,
      percentage: Math.round((stats.correct / stats.total) * 100),
    }));

    // Weak topics (< 60%)
    const weakTopics = topicBreakdown
      .filter((t) => t.percentage < 60)
      .map((t) => t.topic);

    // Performance trend
    const performanceTrend = student.results.map((r, i) => ({
      test: `T${i + 1}`,
      score: r.percentage,
    }));

    return res.json({
      id: student.id,
      name: student.name,
      email: student.email,
      batch: student.batchStudents[0]?.batch?.name || 'Not Assigned',
      totalTests,
      avgScore,
      rank,
      performanceTrend,
      topicBreakdown,
      weakTopics,
    });
  } catch (err) {
    console.error('Get student analytics error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}