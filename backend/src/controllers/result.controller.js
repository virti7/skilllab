import { prisma } from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import logger from '../utils/logger.js';

export async function getResults(req, res, next) {
  try {
    const { role, id: userId, instituteId } = req.user;

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      const results = await prisma.result.findMany({
        where: {
          test: { instituteId },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          test: { select: { id: true, title: true, batch: { select: { name: true } } } },
          answers: {
            include: {
              question: {
                select: {
                  questionText: true,
                  optionA: true,
                  optionB: true,
                  optionC: true,
                  optionD: true,
                  correctOption: true,
                },
              },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      });

      return res.json(
        results.map((r) => ({
          id: r.id,
          studentName: r.user.name,
          studentEmail: r.user.email,
          testTitle: r.test.title,
          batchName: r.test.batch?.name || null,
          score: r.score,
          totalMarks: r.totalMarks,
          percentage: r.percentage,
          passed: r.percentage >= 50,
          submittedAt: r.submittedAt,
        }))
      );
    }

    const results = await prisma.result.findMany({
      where: { userId },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            batch: { select: { name: true } },
          },
        },
        answers: {
          include: {
            question: {
              select: {
                questionText: true,
                optionA: true,
                optionB: true,
                optionC: true,
                optionD: true,
                correctOption: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return res.json(
      results.map((r) => ({
        id: r.id,
        testId: r.testId,
        testTitle: r.test.title,
        batchName: r.test.batch?.name || null,
        score: r.score,
        totalMarks: r.totalMarks,
        percentage: r.percentage,
        passed: r.percentage >= 50,
        submittedAt: r.submittedAt,
        answers: r.answers.map((a) => ({
          questionText: a.question.questionText,
          options: {
            A: a.question.optionA,
            B: a.question.optionB,
            C: a.question.optionC,
            D: a.question.optionD,
          },
          selectedOption: a.selectedOption,
          correctOption: a.question.correctOption,
          isCorrect: a.isCorrect,
        })),
      }))
    );
  } catch (err) {
    next(err);
  }
}

export async function getResultById(req, res, next) {
  try {
    const { resultId } = req.params;
    const { id: userId, role } = req.user;

    const result = await prisma.result.findUnique({
      where: { id: resultId },
      include: {
        user: { select: { name: true, email: true } },
        test: {
          select: {
            title: true,
            batch: { select: { name: true } },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!result) return sendError(res, 'Result not found', 404);

    if (role === 'STUDENT' && result.userId !== userId) {
      logger.warn('Student attempted to access another student\'s result', { resultId, requestedUserId: userId, resultOwnerId: result.userId, role });
      return sendError(res, 'You can only view your own results', 403);
    }

    return res.json({
      id: result.id,
      studentName: result.user.name,
      testTitle: result.test.title,
      batchName: result.test.batch?.name || null,
      score: result.score,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      passed: result.percentage >= 50,
      submittedAt: result.submittedAt,
      answers: result.answers.map((a) => ({
        questionText: a.question.questionText,
        options: {
          A: a.question.optionA,
          B: a.question.optionB,
          C: a.question.optionC,
          D: a.question.optionD,
        },
        selectedOption: a.selectedOption,
        correctOption: a.question.correctOption,
        isCorrect: a.isCorrect,
      })),
    });
  } catch (err) {
    next(err);
  }
}
