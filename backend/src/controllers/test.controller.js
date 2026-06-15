import { prisma } from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getTestsByBatch(req, res, next) {
  try {
    const { batchId } = req.params;
    const { instituteId } = req.user;

    const tests = await prisma.test.findMany({
      where: { batchId },
      include: {
        batch: { select: { name: true } },
        _count: { select: { questions: true, results: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const testsWithStats = await Promise.all(
      tests.map(async (test) => {
        const results = await prisma.result.findMany({
          where: { testId: test.id },
          select: { percentage: true, score: true, totalMarks: true },
        });

        const avgScore =
          results.length > 0
            ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
            : null;

        return {
          id: test.id,
          title: test.title,
          duration: test.duration,
          batchId: test.batchId,
          batchName: test.batch?.name || null,
          questionCount: test._count.questions,
          submissionCount: test._count.results,
          avgScore,
          expiryDate: test.expiryDate,
          isExpired: test.expiryDate ? new Date() > new Date(test.expiryDate) : false,
          createdAt: test.createdAt,
        };
      })
    );

    return res.json(testsWithStats);
  } catch (err) {
    next(err);
  }
}

export async function getUpcomingTests(req, res, next) {
  try {
    const { id: userId, instituteId } = req.user;

    const batchStudents = await prisma.batchStudent.findMany({
      where: { userId },
      select: { batchId: true },
    });
    const batchIds = batchStudents.map((bs) => bs.batchId);

    const completedTestIds = await prisma.result.findMany({
      where: { userId },
      select: { testId: true },
    });
    const completedIds = completedTestIds.map((r) => r.testId);

    const upcomingTests = await prisma.test.findMany({
      where: {
        OR: [
          { batchId: { in: batchIds } },
          { batchId: null, instituteId: instituteId || undefined },
        ],
        id: { notIn: completedIds },
        isActive: true,
      },
      include: {
        batch: { select: { name: true } },
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    return res.json(
      upcomingTests.map((t) => ({
        id: t.id,
        name: t.title,
        batchName: t.batch?.name || null,
        duration: t.duration,
        questionCount: t._count.questions,
        createdAt: t.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
}

export async function createTest(req, res, next) {
  try {
    const { title, duration, batchId, questions, expiryDate } = req.body;
    const { id: adminId, instituteId } = req.user;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return sendError(res, 'title and at least one question are required', 400);
    }

    if (!instituteId) {
      return sendError(res, 'Admin must belong to an institute', 400);
    }

    for (const q of questions) {
      if (!q.questionText || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.correctOption) {
        return sendError(res, 'Each question must have questionText, optionA-D, and correctOption', 400);
      }
      if (!['A', 'B', 'C', 'D'].includes(q.correctOption.toUpperCase())) {
        return sendError(res, 'correctOption must be A, B, C, or D', 400);
      }
    }

    let parsedExpiryDate = null;
    if (expiryDate) {
      parsedExpiryDate = new Date(expiryDate);
      if (isNaN(parsedExpiryDate.getTime())) {
        return sendError(res, 'Invalid expiry date format', 400);
      }
    }

    const test = await prisma.test.create({
      data: {
        title,
        duration: duration || 30,
        instituteId,
        batchId: batchId || null,
        expiryDate: parsedExpiryDate,
        createdBy: adminId,
        questions: {
          create: questions.map((q) => ({
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctOption: q.correctOption.toUpperCase(),
          })),
        },
      },
      include: { questions: true },
    });

    return sendSuccess(res, test, 'Test created', 201);
  } catch (err) {
    next(err);
  }
}

export async function getTests(req, res, next) {
  try {
    const { role, instituteId, id: userId } = req.user;

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      const tests = await prisma.test.findMany({
        where: { instituteId },
        include: {
          batch: { select: { id: true, name: true } },
          _count: { select: { questions: true, results: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json(
        tests.map((t) => ({
          id: t.id,
          title: t.title,
          duration: t.duration,
          batchId: t.batchId,
          batchName: t.batch?.name || null,
          questionCount: t._count.questions,
          submissionCount: t._count.results,
          expiryDate: t.expiryDate,
          isExpired: t.expiryDate ? new Date() > new Date(t.expiryDate) : false,
          createdAt: t.createdAt,
        }))
      );
    }

    const batchStudents = await prisma.batchStudent.findMany({
      where: { userId },
      select: { batchId: true },
    });

    const batchIds = batchStudents.map((bs) => bs.batchId);

    const tests = await prisma.test.findMany({
      where: {
        OR: [
          { batchId: { in: batchIds } },
          { batchId: null, instituteId: req.user.instituteId || undefined },
        ],
        isActive: true,
      },
      include: {
        batch: { select: { name: true } },
        _count: { select: { questions: true } },
        results: {
          where: { userId },
          select: { id: true, score: true, percentage: true, submittedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const validTests = tests.filter((test) => {
      return !test.expiryDate || new Date(test.expiryDate) > now;
    });

    const finalTests = validTests.map((t) => ({
      id: t.id,
      title: t.title,
      duration: t.duration,
      batchName: t.batch?.name || null,
      questionCount: t._count.questions,
      status: t.results.length > 0 ? 'completed' : 'pending',
      result: t.results[0] || null,
      expiryDate: t.expiryDate,
    }));

    return res.json(finalTests);
  } catch (err) {
    next(err);
  }
}

export async function getTestById(req, res, next) {
  try {
    const { testId } = req.params;
    const { id: userId, role } = req.user;

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          select: {
            id: true,
            questionText: true,
            optionA: true,
            optionB: true,
            optionC: true,
            optionD: true,
          },
        },
        batch: {
          select: { name: true },
        },
      },
    });

    if (!test) {
      return sendError(res, "Test not found", 404);
    }

    if (role === "STUDENT") {
      const existingResult = await prisma.result.findUnique({
        where: {
          userId_testId: {
            userId,
            testId,
          },
        },
      });

      if (existingResult) {
        return sendError(res, "You have already submitted this test", 409);
      }
    }

    return res.json({
      ...test,
      batchName: test.batch?.name || null,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteTest(req, res, next) {
  try {
    const { testId } = req.params;
    const { role, instituteId } = req.user;

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return sendError(res, 'Only admins can delete tests', 403);
    }

    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: { id: true, instituteId: true },
    });

    if (!test) {
      return sendError(res, 'Test not found', 404);
    }

    if (test.instituteId !== instituteId) {
      return sendError(res, 'You can only delete tests from your institute', 403);
    }

    await prisma.$transaction(async (tx) => {
      await tx.answer.deleteMany({
        where: { question: { testId } },
      });
      await tx.question.deleteMany({
        where: { testId },
      });
      await tx.result.deleteMany({
        where: { testId },
      });
      await tx.test.delete({
        where: { id: testId },
      });
    });

    return sendSuccess(res, { message: 'Test deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getTestsForStudent(req, res, next) {
  try {
    const { batchId } = req.query;
    const { id: userId, instituteId } = req.user;

    const batchStudents = await prisma.batchStudent.findMany({
      where: { userId },
      select: { batchId: true },
    });
    const enrolledBatchIds = batchStudents.map((bs) => bs.batchId);

    const completedTests = await prisma.result.findMany({
      where: { userId },
      select: { testId: true, score: true, percentage: true, totalMarks: true, submittedAt: true },
    });
    const completedTestMap = Object.fromEntries(
      completedTests.map((r) => [
        r.testId,
        { id: r.testId, score: r.score, percentage: r.percentage, totalMarks: r.totalMarks, submittedAt: r.submittedAt },
      ])
    );
    const completedTestIds = completedTests.map((r) => r.testId);

    let whereClause = {
      isActive: true,
      OR: [],
    };

    if (batchId) {
      if (!enrolledBatchIds.includes(batchId)) {
        return sendError(res, 'You are not enrolled in this batch', 403);
      }
      whereClause.OR.push({ batchId });
    } else {
      whereClause.OR.push({ batchId: { in: enrolledBatchIds } });
      whereClause.OR.push({ batchId: null, instituteId });
    }

    const tests = await prisma.test.findMany({
      where: whereClause,
      include: {
        batch: { select: { name: true } },
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    let filteredTests = tests;
    if (batchId) {
      filteredTests = tests.filter(t => t.batchId === batchId);
    }

    const now = new Date();

    const result = filteredTests.map((t) => {
      const isCompleted = completedTestMap[t.id] !== undefined;
      const isExpired = t.expiryDate && new Date(t.expiryDate) <= now;
      const isUpcoming = !isCompleted && !isExpired;

      return {
        id: t.id,
        title: t.title,
        duration: t.duration,
        batchId: t.batchId,
        batchName: t.batch?.name || null,
        questionCount: t._count.questions,
        status: isCompleted ? 'completed' : 'upcoming',
        result: completedTestMap[t.id] || null,
        expiryDate: t.expiryDate,
        isExpired,
        isUpcoming,
        createdAt: t.createdAt,
      };
    });

    return res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getGeneralTests(req, res, next) {
  try {
    const { id: userId, instituteId } = req.user;

    const batchStudents = await prisma.batchStudent.findMany({
      where: { userId },
      select: { batchId: true },
    });
    const enrolledBatchIds = batchStudents.map((bs) => bs.batchId);

    const completedTests = await prisma.result.findMany({
      where: { userId },
      select: { testId: true },
    });
    const completedTestIds = completedTests.map((r) => r.testId);

    const tests = await prisma.test.findMany({
      where: {
        batchId: null,
        instituteId,
        isActive: true,
        id: { notIn: completedTestIds },
      },
      include: {
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const validTests = tests.filter(t => !t.expiryDate || new Date(t.expiryDate) > now);

    return res.json(
      validTests.map((t) => ({
        id: t.id,
        title: t.title,
        duration: t.duration,
        batchId: null,
        batchName: 'General',
        questionCount: t._count.questions,
        status: 'pending',
        expiryDate: t.expiryDate,
        isExpired: t.expiryDate ? new Date() > new Date(t.expiryDate) : false,
        createdAt: t.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
}

export async function getStudentTestHistory(req, res, next) {
  try {
    const { id: userId } = req.user;

    const results = await prisma.result.findMany({
      where: { userId },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            batchId: true,
            batch: { select: { name: true } },
            duration: true,
            questions: { select: { id: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const history = results.map((r) => {
      const totalQuestions = r.test.questions.length;
      const correctCount = r.score;
      const wrongCount = totalQuestions - correctCount;
      const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

      return {
        submissionId: r.id,
        testId: r.test.id,
        testTitle: r.test.title,
        batchId: r.test.batchId,
        batchName: r.test.batch?.name || 'General',
        score: r.score,
        totalQuestions,
        correctCount,
        wrongCount,
        percentage: r.percentage,
        accuracy,
        timeTaken: r.test.duration,
        submittedAt: r.submittedAt,
        type: 'normal'
      };
    });

    const codingResults = await prisma.codingResult.findMany({
      where: { userId },
      include: {
        question: {
          select: {
            id: true,
            title: true,
            topic: true,
            difficulty: true,
            batchId: true,
            batch: { select: { name: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const codingHistory = codingResults.map((r) => {
      const percentage = r.total > 0 ? Math.round((r.passed / r.total) * 100) : 0;
      const testTitle = r.question?.title || 'Coding Test';
      const batchName = r.question?.batch?.name || 'General';

      return {
        submissionId: r.id,
        testId: r.testId || null,
        testTitle: testTitle,
        batchId: r.question?.batchId || null,
        batchName: batchName,
        score: r.passed,
        totalQuestions: r.total,
        correctCount: r.passed,
        wrongCount: r.total - r.passed,
        percentage: percentage,
        accuracy: percentage,
        timeTaken: 0,
        submittedAt: r.submittedAt,
        type: 'coding',
        questionId: r.question?.id,
        questionTitle: r.question?.title,
        questionTopic: r.question?.topic,
        questionDifficulty: r.question?.difficulty,
        language: r.language,
        status: r.status,
        runtime: r.runtime,
        memory: r.memory
      };
    });

    const allHistory = [...history, ...codingHistory].sort((a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    return res.json(allHistory);
  } catch (err) {
    next(err);
  }
}

export async function getTestSubmissionAnalytics(req, res, next) {
  try {
    const { id: submissionId } = req.params;
    const { id: userId } = req.user;

    const result = await prisma.result.findUnique({
      where: { id: submissionId },
      include: {
        test: {
          include: {
            questions: {
              select: {
                id: true,
                questionText: true,
                optionA: true,
                optionB: true,
                optionC: true,
                optionD: true,
                correctOption: true,
              },
            },
            batch: { select: { name: true } },
          },
        },
        answers: true,
      },
    });

    if (!result) {
      return sendError(res, 'Submission not found', 404);
    }

    if (result.userId !== userId) {
      return sendError(res, 'You can only view your own submissions', 403);
    }

    const total = result.test.questions.length;
    const correct = result.score;
    const wrong = total - correct;
    const accuracy = Math.round((correct / total) * 100);

    const answerMap = Object.fromEntries(result.answers.map((a) => [a.questionId, a]));
    const questionBreakdown = result.test.questions.map((q) => {
      const answer = answerMap[q.id];
      return {
        questionId: q.id,
        question: q.questionText,
        options: {
          A: q.optionA,
          B: q.optionB,
          C: q.optionC,
          D: q.optionD,
        },
        selectedOption: answer?.selectedOption || null,
        correctOption: q.correctOption,
        isCorrect: answer?.isCorrect || false,
        status: answer?.isCorrect ? 'correct' : 'wrong',
      };
    });

    const weakTopics = [];
    const strongTopics = [];

    return res.json({
      submissionId: result.id,
      testId: result.test.id,
      testTitle: result.test.title,
      batchName: result.test.batch?.name || 'General',
      batchId: result.test.batchId,
      score: correct,
      total,
      correct,
      wrong,
      accuracy,
      timeTaken: result.test.duration,
      submittedAt: result.submittedAt,
      percentage: result.percentage,
      weakTopics,
      strongTopics,
      questionBreakdown,
    });
  } catch (err) {
    next(err);
  }
}

export async function submitTest(req, res, next) {
  try {
    const { testId, answers } = req.body;
    const userId = req.user.id;

    if (!testId || !answers || !Array.isArray(answers)) {
      return sendError(res, 'testId and answers array are required', 400);
    }

    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: { id: true, expiryDate: true },
    });

    if (!test) {
      return sendError(res, 'Test not found', 404);
    }

    if (test.expiryDate && new Date() > new Date(test.expiryDate)) {
      return sendError(res, 'Test has expired', 403);
    }

    const existing = await prisma.result.findUnique({
      where: { userId_testId: { userId, testId } },
    });
    if (existing) {
      return sendError(res, 'Test already submitted', 409);
    }

    const questions = await prisma.question.findMany({
      where: { testId },
    });

    if (questions.length === 0) {
      return sendError(res, 'Test not found or has no questions', 404);
    }

    const questionMap = Object.fromEntries(questions.map((q) => [q.id, q]));
    let score = 0;
    const correctAnswers = [];
    const wrongAnswers = [];

    const answerData = answers.map((ans) => {
      const question = questionMap[ans.questionId];
      if (!question) return null;
      const isCorrect =
        ans.selectedOption?.toUpperCase() === question.correctOption.toUpperCase();
      if (isCorrect) {
        score++;
        correctAnswers.push({
          questionId: ans.questionId,
          question: question.questionText || question.question,
          yourAnswer: ans.selectedOption,
          correctAnswer: question.correctOption,
        });
      } else {
        wrongAnswers.push({
          questionId: ans.questionId,
          question: question.questionText || question.question,
          yourAnswer: ans.selectedOption || "Not answered",
          correctAnswer: question.correctOption,
        });
      }
      return {
        questionId: ans.questionId,
        selectedOption: ans.selectedOption?.toUpperCase() || '',
        isCorrect,
        userId,
      };
    }).filter(Boolean);

    const totalMarks = questions.length;
    const percentage = Math.round((score / totalMarks) * 100);

    const result = await prisma.$transaction(async (tx) => {
      const newResult = await tx.result.create({
        data: {
          userId,
          testId,
          score,
          totalMarks,
          percentage,
          answers: {
            create: answerData,
          },
        },
        include: { answers: true },
      });
      return newResult;
    });

    return res.status(201).json({
      success: true,
      resultId: result.id,
      score,
      totalQuestions: totalMarks,
      percentage,
      passed: percentage >= 50,
      correctAnswers,
      wrongAnswers,
    });
  } catch (err) {
    next(err);
  }
}
