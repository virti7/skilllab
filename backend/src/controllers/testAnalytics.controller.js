import { prisma } from '../utils/prisma.js';
import { analyzeStudentPerformance } from '../services/groq.service.js';

export async function getTestAnalytics(req, res) {
  try {
    const { testId } = req.params;
    const { instituteId, role } = req.user;

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          select: {
            id: true,
            questionText: true,
          },
        },
        results: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            answers: {
              include: {
                question: {
                  select: {
                    id: true,
                    questionText: true,
                  },
                },
              },
            },
          },
        },
        batch: {
          select: {
            id: true,
            name: true,
            instituteId: true,
          },
        },
      },
    });

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    if (role === 'ADMIN' && test.batch?.instituteId !== instituteId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const questionAnalysis = test.questions.map((q) => {
      const totalAttempts = test.results.reduce((count, result) => {
        return count + (result.answers.some((a) => a.questionId === q.id) ? 1 : 0);
      }, 0);
      const correctAttempts = test.results.reduce((count, result) => {
        return count + (result.answers.some((a) => a.questionId === q.id && a.isCorrect) ? 1 : 0);
      }, 0);
      const correctPercentage = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

      return {
        questionId: q.id,
        questionText: q.questionText,
        totalAttempts,
        correctAttempts,
        correctPercentage,
        difficulty: correctPercentage >= 70 ? 'easy' : correctPercentage >= 40 ? 'medium' : 'hard',
      };
    });

    const sortedQuestions = [...questionAnalysis].sort((a, b) => a.correctPercentage - b.correctPercentage);

    const studentAnalytics = await Promise.all(
      test.results.map(async (result) => {
        const incorrectAnswers = result.answers.filter((a) => !a.isCorrect);
        const weakAreas = incorrectAnswers.map((a) => {
          const q = test.questions.find((q) => q.id === a.questionId);
          return q?.questionText || 'Unknown';
        });

        let aiAnalysis = null;
        if (weakAreas.length > 0 && process.env.GROQ_API_KEY) {
          try {
            const answersForAnalysis = result.answers.map((a) => ({
              question: test.questions.find((q) => q.id === a.questionId)?.questionText || '',
              isCorrect: a.isCorrect,
            }));
            aiAnalysis = await analyzeStudentPerformance(result.user.name, answersForAnalysis, []);
          } catch (err) {
            console.error('AI analysis failed:', err);
          }
        }

        return {
          studentId: result.user.id,
          name: result.user.name,
          email: result.user.email,
          score: result.score,
          totalMarks: result.totalMarks,
          percentage: result.percentage,
          submittedAt: result.submittedAt,
          weakAreas: weakAreas.slice(0, 5),
          aiAnalysis,
        };
      })
    );

    studentAnalytics.sort((a, b) => b.percentage - a.percentage);

    const totalStudents = test.results.length;
    const avgScore = totalStudents > 0
      ? Math.round(test.results.reduce((sum, r) => sum + r.percentage, 0) / totalStudents)
      : 0;
    const highestScore = totalStudents > 0
      ? Math.max(...test.results.map((r) => r.percentage))
      : 0;
    const lowestScore = totalStudents > 0
      ? Math.min(...test.results.map((r) => r.percentage))
      : 0;
    const passCount = test.results.filter((r) => r.percentage >= 50).length;

    return res.json({
      test: {
        id: test.id,
        title: test.title,
        batchName: test.batch?.name || null,
        totalQuestions: test.questions.length,
        totalAttempts: totalStudents,
        expiryDate: test.expiryDate,
        isExpired: test.expiryDate ? new Date() > new Date(test.expiryDate) : false,
      },
      summary: {
        totalStudents,
        avgScore,
        highestScore,
        lowestScore,
        passRate: totalStudents > 0 ? Math.round((passCount / totalStudents) * 100) : 0,
        totalQuestions: test.questions.length,
      },
      students: studentAnalytics,
      questionAnalysis: sortedQuestions,
      mostDifficultQuestions: sortedQuestions.slice(0, 5),
      easiestQuestions: [...sortedQuestions].reverse().slice(0, 5),
    });
  } catch (err) {
    console.error('Get test analytics error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getTestAnalyticsSimple(req, res) {
  try {
    const { testId } = req.params;
    const { instituteId, role } = req.user;

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        _count: { select: { questions: true, results: true } },
        results: {
          select: {
            score: true,
            percentage: true,
            submittedAt: true,
          },
        },
        batch: {
          select: {
            id: true,
            name: true,
            instituteId: true,
          },
        },
      },
    });

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    if (role === 'ADMIN' && test.batch?.instituteId !== instituteId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const totalStudents = test._count.results;
    const avgScore = totalStudents > 0
      ? Math.round(test.results.reduce((sum, r) => sum + r.percentage, 0) / totalStudents)
      : 0;

    return res.json({
      testId: test.id,
      title: test.title,
      totalAttempts: totalStudents,
      avgScore,
      questionCount: test._count.questions,
      passRate: totalStudents > 0
        ? Math.round((test.results.filter((r) => r.percentage >= 50).length / totalStudents) * 100)
        : 0,
    });
  } catch (err) {
    console.error('Get test analytics simple error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
