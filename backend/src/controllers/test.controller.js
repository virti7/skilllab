import prisma from '../utils/prisma.js';

// POST /api/test/create
export async function createTest(req, res) {
  try {
    const { title, duration, batchId, questions } = req.body;
    const { instituteId } = req.user;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'title and at least one question are required' });
    }

    if (!instituteId) {
      return res.status(400).json({ error: 'Admin must belong to an institute' });
    }

    // Validate questions
    for (const q of questions) {
      if (!q.questionText || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.correctOption) {
        return res.status(400).json({ error: 'Each question must have questionText, optionA-D, and correctOption' });
      }
      if (!['A', 'B', 'C', 'D'].includes(q.correctOption.toUpperCase())) {
        return res.status(400).json({ error: 'correctOption must be A, B, C, or D' });
      }
    }

    const test = await prisma.test.create({
      data: {
        title,
        duration: duration || 30,
        instituteId,
        batchId: batchId || null,
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

    return res.status(201).json(test);
  } catch (err) {
    console.error('Create test error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/test/get
export async function getTests(req, res) {
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
          createdAt: t.createdAt,
        }))
      );
    }

    // Student: fetch tests assigned to their batches
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

    return res.json(
      tests.map((t) => ({
        id: t.id,
        title: t.title,
        duration: t.duration,
        batchName: t.batch?.name || null,
        questionCount: t._count.questions,
        status: t.results.length > 0 ? 'completed' : 'pending',
        result: t.results[0] || null,
      }))
    );
  } catch (err) {
    console.error('Get tests error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/test/:testId
export async function getTestById(req, res) {
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
            // Don't expose correctOption to students during the test
          },
        },
        batch: { select: { name: true } },
      },
    });

    if (!test) return res.status(404).json({ error: 'Test not found' });

    // Check if student already completed this test
    if (role === 'STUDENT') {
      const existingResult = await prisma.result.findUnique({
        where: { userId_testId: { userId, testId } },
      });
      if (existingResult) {
        return res.status(409).json({ error: 'You have already submitted this test', result: existingResult });
      }
    }

    return res.json(test);
  } catch (err) {
    console.error('Get test by id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/test/submit
export async function submitTest(req, res) {
  try {
    const { testId, answers } = req.body; // answers: [{ questionId, selectedOption }]
    const userId = req.user.id;

    if (!testId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'testId and answers array are required' });
    }

    // Check duplicate submission
    const existing = await prisma.result.findUnique({
      where: { userId_testId: { userId, testId } },
    });
    if (existing) {
      return res.status(409).json({ error: 'Test already submitted', result: existing });
    }

    // Fetch questions with correct answers
    const questions = await prisma.question.findMany({
      where: { testId },
    });

    if (questions.length === 0) {
      return res.status(404).json({ error: 'Test not found or has no questions' });
    }

    // Grade the answers
    const questionMap = Object.fromEntries(questions.map((q) => [q.id, q]));
    let score = 0;

    const answerData = answers.map((ans) => {
      const question = questionMap[ans.questionId];
      if (!question) return null;
      const isCorrect =
        ans.selectedOption?.toUpperCase() === question.correctOption.toUpperCase();
      if (isCorrect) score++;
      return {
        questionId: ans.questionId,
        selectedOption: ans.selectedOption?.toUpperCase() || '',
        isCorrect,
        userId,
      };
    }).filter(Boolean);

    const totalMarks = questions.length;
    const percentage = Math.round((score / totalMarks) * 100);

    // Save result + answers in a transaction
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
      resultId: result.id,
      score,
      totalMarks,
      percentage,
      passed: percentage >= 50,
    });
  } catch (err) {
    console.error('Submit test error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
