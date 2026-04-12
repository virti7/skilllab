import prisma from '../utils/prisma.js';

export async function getBatchAnalytics(req, res) {
  try {
    const { id } = req.params;
    const { instituteId, role } = req.user;

    console.log('Batch ID:', id);
    console.log('User Institute:', instituteId, 'Role:', role);

    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        batchStudents: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        tests: {
          include: {
            results: {
              select: {
                userId: true,
                score: true,
                totalMarks: true,
                percentage: true,
              },
            },
          },
        },
      },
    });

    if (!batch) {
      console.log('Batch not found for ID:', id);
      return res.status(404).json({ error: 'Batch not found' });
    }

    console.log('Batch Data:', { id: batch.id, name: batch.name, studentCount: batch.batchStudents?.length || 0, testCount: batch.tests?.length || 0 });

    if (role === 'ADMIN' && batch.instituteId !== instituteId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const students = batch.batchStudents.map((bs) => bs.user);
    const tests = batch.tests;

    console.log('Students:', students.length, 'Tests:', tests.length);

    if (students.length === 0 && tests.length === 0) {
      console.log('Empty batch - no students or tests');
      return res.json({
        batch: {
          id: batch.id,
          name: batch.name,
          inviteCode: batch.inviteCode,
          createdAt: batch.createdAt,
        },
        summary: {
          totalStudents: 0,
          totalTests: 0,
          totalAttempts: 0,
          avgBatchScore: null,
        },
        students: [],
        tests: [],
        leaderboard: [],
        trends: { testScoresOverTime: [] },
        insights: {
          topPerformer: null,
          weakStudentsCount: 0,
          weakStudents: [],
          bestTest: null,
          worstTest: null,
        },
        scoreDistribution: {
          excellent: 0,
          average: 0,
          needsImprovement: 0,
          noAttempts: 0,
        },
      });
    }

    const studentIds = students.map((s) => s.id);
    const testIds = tests.map((t) => t.id);

    const resultWhereClause = {
      userId: { in: studentIds },
    };
    if (testIds.length > 0) {
      resultWhereClause.testId = { in: testIds };
    }

    const studentResults = await prisma.result.findMany({
      where: resultWhereClause,
      include: {
        test: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    const studentMap = new Map();
    students.forEach((s) => {
      studentMap.set(s.id, {
        id: s.id,
        name: s.name,
        email: s.email,
        results: [],
      });
    });

    studentResults.forEach((r) => {
      if (studentMap.has(r.userId)) {
        studentMap.get(r.userId).results.push({
          testId: r.test.id,
          testTitle: r.test.title,
          score: r.score,
          totalMarks: r.totalMarks,
          percentage: r.percentage,
        });
      }
    });

    const studentsWithStats = Array.from(studentMap.values()).map((s) => {
      const testsAttempted = s.results.length;
      const avgScore = testsAttempted > 0
        ? Math.round(s.results.reduce((acc, r) => acc + r.percentage, 0) / testsAttempted)
        : null;
      const totalScore = s.results.reduce((acc, r) => acc + r.score, 0);

      return {
        ...s,
        testsAttempted,
        avgScore,
        totalScore,
      };
    });

    const testStats = tests.map((t) => {
      const attempts = t.results.length;
      const avgScore = attempts > 0
        ? Math.round(t.results.reduce((acc, r) => acc + r.percentage, 0) / attempts)
        : null;

      return {
        id: t.id,
        title: t.title,
        attempts,
        avgScore,
      };
    });

    const totalAttempts = studentResults.length;
    const avgBatchScore = totalAttempts > 0
      ? Math.round(studentResults.reduce((acc, r) => acc + r.percentage, 0) / totalAttempts)
      : null;

    const leaderboard = studentsWithStats
      .filter((s) => s.testsAttempted > 0)
      .map((s) => ({
        studentId: s.id,
        name: s.name,
        totalScore: s.totalScore,
        avgScore: s.avgScore,
        testsAttempted: s.testsAttempted,
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    const trends = {
      testScoresOverTime: testStats
        .filter((t) => t.attempts > 0)
        .map((t) => ({
          testName: t.title.length > 20 ? t.title.substring(0, 20) + '...' : t.title,
          avgScore: t.avgScore || 0,
        })),
    };

    const topPerformer = leaderboard.length > 0 ? leaderboard[0] : null;
    const weakStudents = studentsWithStats.filter((s) => s.avgScore !== null && s.avgScore < 40);
    const bestTest = testStats.length > 0
      ? testStats.reduce((best, t) => (t.avgScore > (best.avgScore || 0) ? t : best), testStats[0])
      : null;
    const worstTest = testStats.length > 0
      ? testStats.reduce((worst, t) => ((t.avgScore || 0) < (worst.avgScore || 100) ? t : worst), testStats[0])
      : null;

    const scoreDistribution = {
      excellent: studentsWithStats.filter((s) => s.avgScore !== null && s.avgScore >= 70).length,
      average: studentsWithStats.filter((s) => s.avgScore !== null && s.avgScore >= 40 && s.avgScore < 70).length,
      needsImprovement: studentsWithStats.filter((s) => s.avgScore !== null && s.avgScore < 40).length,
      noAttempts: studentsWithStats.filter((s) => s.testsAttempted === 0).length,
    };

    return res.json({
      batch: {
        id: batch.id,
        name: batch.name,
        inviteCode: batch.inviteCode,
        createdAt: batch.createdAt,
      },
      summary: {
        totalStudents: students.length,
        totalTests: tests.length,
        totalAttempts,
        avgBatchScore,
      },
      students: studentsWithStats.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        testsAttempted: s.testsAttempted,
        avgScore: s.avgScore,
        totalScore: s.totalScore,
      })),
      tests: testStats,
      leaderboard,
      trends,
      insights: {
        topPerformer: topPerformer ? { name: topPerformer.name, score: topPerformer.avgScore } : null,
        weakStudentsCount: weakStudents.length,
        weakStudents: weakStudents.slice(0, 3).map((s) => ({ name: s.name, score: s.avgScore })),
        bestTest: bestTest && bestTest.avgScore !== null ? { title: bestTest.title, score: bestTest.avgScore } : null,
        worstTest: worstTest && worstTest.avgScore !== null ? { title: worstTest.title, score: worstTest.avgScore } : null,
      },
      scoreDistribution,
    });
  } catch (err) {
    console.error('Get batch analytics error:', err);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ error: 'Failed to load analytics' });
  }
}
