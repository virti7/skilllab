import { prisma } from '../utils/prisma.js';
import { runCode, submitCode, runSingleTest, validateLanguage } from '../services/compiler.service.js';
import { analyzeCode } from '../services/aiCoding.service.js';
import { generateCodingQuestion, generateHint, analyzeCodeWithAI } from '../services/groq.service.js';
import { randomUUID } from 'crypto';

export async function getBatches(req, res) {
  try {
    const userId = req.user.id;

    const batches = await prisma.batch.findMany({
      where: {
        batchStudents: {
          some: { userId },
        },
      },
      include: {
        _count: {
          select: {
            codingQuestions: true,
            codingTests: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mappedBatches = batches.map(b => ({
      id: b.id,
      name: b.name,
      batchId: b.id,
      _count: {
        questions: b._count.codingQuestions,
        tests: b._count.codingTests,
      },
    }));

    return res.json(mappedBatches);
  } catch (error) {
    console.error('Get coding batches error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getStudentCodingQuestions(req, res) {
  try {
    const userId = req.user.id;
    console.log("Getting coding questions for user:", userId);

    const batchStudents = await prisma.batchStudent.findMany({
      where: { userId },
      select: { batchId: true },
    });

    const batchIds = batchStudents.map(b => b.batchId);
    console.log("Student batchIds:", batchIds);

    if (batchIds.length === 0) {
      return res.json([]);
    }

    const questions = await prisma.codingQuestion.findMany({
      where: {
        batchId: { in: batchIds },
      },
      select: {
        id: true,
        type: true,
        topic: true,
        difficulty: true,
        title: true,
        description: true,
        starterCode: true,
        testCases: true,
        constraints: true,
        hints: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log("Questions found:", questions.length);
    return res.json(questions);
  } catch (error) {
    console.error('Get student coding questions error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getQuestions(req, res) {
  try {
    const { type, batchId } = req.query;
    const userId = req.user.id;

    let batchIdFilter;

    if (batchId) {
      batchIdFilter = batchId;
    } else {
      const userBatches = await prisma.batch.findMany({
        where: {
          batchStudents: {
            some: { userId },
          },
        },
        select: { id: true },
      });
      batchIdFilter = { in: userBatches.map(b => b.id) };
    }

    if (!batchIdFilter) {
      return res.json([]);
    }

    const where = {
      batchId: batchIdFilter,
    };

    if (type) {
      where.type = type;
    }

    const questions = await prisma.codingQuestion.findMany({
      where,
      select: {
        id: true,
        type: true,
        topic: true,
        difficulty: true,
        title: true,
        description: true,
        starterCode: true,
        testCases: true,
        hints: true,
      },
      orderBy: [{ topic: 'asc' }, { difficulty: 'asc' }],
    });

    return res.json(questions);
  } catch (error) {
    console.error('Get questions error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getQuestionById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const question = await prisma.codingQuestion.findUnique({
      where: { id },
      include: {
        batch: true,
      },
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const isMember = await prisma.batchStudent.findFirst({
      where: {
        userId,
        batchId: question.batchId,
      },
    });

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const lastResult = await prisma.codingResult.findFirst({
      where: {
        userId,
        questionId: id,
      },
      orderBy: { submittedAt: 'desc' },
    });

    return res.json({
      ...question,
      lastResult,
    });
  } catch (error) {
    console.error('Get question error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getTests(req, res) {
  try {
    const { batchId } = req.query;
    const userId = req.user.id;

    let batchIdFilter;

    if (batchId) {
      batchIdFilter = batchId;
    } else {
      const userBatches = await prisma.batch.findMany({
        where: {
          batchStudents: {
            some: { userId },
          },
        },
        select: { id: true },
      });
      if (userBatches.length === 0) return res.json([]);
      batchIdFilter = { in: userBatches.map(b => b.id) };
    }

    const tests = await prisma.codingTest.findMany({
      where: { codingBatchId: batchIdFilter },
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(tests);
  } catch (error) {
    console.error('Get tests error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getStudentTests(req, res) {
  try {
    const userId = req.user.id;
    console.log("getStudentTests - User ID:", userId);

    const batchStudents = await prisma.batchStudent.findMany({
      where: { userId },
      select: { batchId: true },
    });

    const batchIds = batchStudents.map(b => b.batchId);
    console.log("getStudentTests - Student Batches:", batchIds);

    if (batchIds.length === 0) {
      return res.json([]);
    }

    const completedTestIds = await prisma.testAttempt.findMany({
      where: {
        userId,
        status: "completed",
      },
      select: { testId: true },
    });
    const completedIds = new Set(completedTestIds.map(t => t.testId));

    const tests = await prisma.codingTest.findMany({
      where: { 
        codingBatchId: { in: batchIds },
        id: { notIn: Array.from(completedIds) },
      },
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log("getStudentTests - Fetched Tests:", tests.length);
    return res.json(tests);
  } catch (error) {
    console.error('Get student tests error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getTestById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const test = await prisma.codingTest.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            codingQuestion: {
              select: {
                id: true,
                type: true,
                topic: true,
                difficulty: true,
                title: true,
                description: true,
                starterCode: true,
                testCases: true,
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const batchId = test.codingBatchId;

    const isMember = await prisma.batchStudent.findFirst({
      where: {
        userId,
        batchId: batchId,
      },
    });

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.json(test);
  } catch (error) {
    console.error('Get test error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function runCodeHandler(req, res) {
  try {
    const { code, language, questionId } = req.body;
    const userId = req.user.id;

    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }

    if (!validateLanguage(language)) {
      return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    let sampleTestCases = [];

    if (questionId) {
      const question = await prisma.codingQuestion.findUnique({
        where: { id: questionId },
        select: { testCases: true },
      });
      if (question && question.testCases && question.testCases.length > 0) {
        sampleTestCases = [question.testCases[0]];
      }
    }

    const result = await runCode({ code, language, sampleTestCases });

    return res.json({
      ...result,
      runType: 'sample',
    });
  } catch (error) {
    console.error('Run code error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function submitCodeHandler(req, res) {
  try {
    const { questionId, testId, code, language } = req.body;
    const userId = req.user.id;

    if (!code || !language || !questionId) {
      return res.status(400).json({ error: 'Code, language, and questionId are required' });
    }

    if (!validateLanguage(language)) {
      return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    const question = await prisma.codingQuestion.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        title: true,
        description: true,
        testCases: true,
        expectedOutput: true,
        starterCode: true,
      },
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const testCases = (question.testCases || []).map(tc => ({
      input: tc.input || '',
      expectedOutput: tc.expectedOutput || '',
    }));

    let submissionResult;
    if (testCases.length > 0) {
      submissionResult = await submitCode({ code, language, testCases });
    } else if (question.expectedOutput) {
      const result = await runCode({ code, language, sampleTestCases: [{ input: '', expectedOutput: question.expectedOutput }] });
      submissionResult = {
        results: result.results,
        passed: result.results[0]?.passed ? 1 : 0,
        total: 1,
        accuracy: result.results[0]?.passed ? 100 : 0,
        status: result.results[0]?.passed ? 'Accepted' : 'Wrong Answer',
        executionTime: result.executionTime,
        memory: result.memory,
      };
    } else {
      submissionResult = {
        results: [],
        passed: 0,
        total: 0,
        accuracy: 0,
        status: 'No Test Cases',
        executionTime: null,
        memory: null,
      };
    }

    const savedResult = await prisma.codingResult.create({
      data: {
        userId,
        questionId,
        testId: testId || null,
        code,
        language,
        passed: submissionResult.passed,
        total: submissionResult.total,
        runtime: submissionResult.executionTime,
        memory: submissionResult.memory,
        output: submissionResult.results.map(r => r.actualOutput).join('\n'),
        status: submissionResult.passed === submissionResult.total ? 'success' : 'failed',
      },
    });

    if (testId) {
      await prisma.testAttempt.upsert({
        where: {
          userId_testId: {
            userId,
            testId,
          },
        },
        update: {
          status: "completed",
          completedAt: new Date(),
        },
        create: {
          userId,
          testId,
          status: "completed",
          completedAt: new Date(),
        },
      });
    }

    let analytics = null;
    try {
      const analysisPrompt = `Analyze this code solution:

Problem: ${question.title}
Description: ${question.description?.substring(0, 500) || 'N/A'}
Language: ${language}

User Code:
${code}

Submission result: ${submissionResult.passed}/${submissionResult.total} test cases passed

Provide a JSON response with this exact format:
{
  "timeComplexity": "O(n) or appropriate complexity",
  "spaceComplexity": "O(1) or appropriate complexity", 
  "optimization": "Good / Needs Improvement / Can Improve",
  "codeQualityScore": 1-10,
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}

Return ONLY JSON:`;

      const aiAnalysis = await analyzeCodeWithAI(analysisPrompt);

      let parsedAnalytics = {
        timeComplexity: 'Unknown',
        spaceComplexity: 'Unknown',
        optimization: 'Unknown',
        codeQualityScore: 5,
        suggestions: [],
      };

      try {
        const cleaned = aiAnalysis.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedAnalytics = JSON.parse(cleaned);
      } catch (parseErr) {
        console.warn('Failed to parse AI analytics:', parseErr);
      }

      analytics = parsedAnalytics;
    } catch (aiError) {
      console.error('AI analytics error:', aiError);
      analytics = {
        timeComplexity: 'Analysis unavailable',
        spaceComplexity: 'Analysis unavailable',
        optimization: 'Analysis unavailable',
        codeQualityScore: null,
        suggestions: ['AI analysis temporarily unavailable'],
      };
    }

    const response = {
      status: submissionResult.status,
      passed: submissionResult.passed,
      total: submissionResult.total,
      accuracy: submissionResult.accuracy,
      executionTime: submissionResult.executionTime,
      memory: submissionResult.memory,
      results: submissionResult.results,
      analytics,
    };

    return res.json(response);
  } catch (error) {
    console.error('Submit code error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getAnalytics(req, res) {
  try {
    const userId = req.user.id;

    const results = await prisma.codingResult.findMany({
      where: { userId },
      include: {
        question: {
          select: {
            topic: true,
            difficulty: true,
            type: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    if (results.length === 0) {
      return res.json({
        problemsSolved: 0,
        accuracy: 0,
        avgRuntime: 0,
        weakTopics: [],
        strongTopics: [],
        totalSubmissions: 0,
      });
    }

    const topicStats = {};
    results.forEach(r => {
      const topic = r.question.topic || 'General';
      if (!topicStats[topic]) {
        topicStats[topic] = { total: 0, passed: 0 };
      }
      topicStats[topic].total += r.total;
      topicStats[topic].passed += r.passed;
    });

    const topicAccuracy = Object.entries(topicStats).map(([topic, stats]) => ({
      topic,
      total: stats.total,
      passed: stats.passed,
      percentage: stats.total > 0 ? (stats.passed / stats.total) * 100 : 0,
    }));

    const weakTopics = topicAccuracy.filter(t => t.percentage < 60).map(t => t.topic);
    const strongTopics = topicAccuracy.filter(t => t.percentage >= 80).map(t => t.topic);

    const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
    const totalTotal = results.reduce((sum, r) => sum + r.total, 0);
    const uniqueProblems = new Set(results.map(r => r.questionId)).size;

    const runtimes = results.filter(r => r.runtime !== null).map(r => r.runtime);
    const avgRuntime = runtimes.length > 0
      ? runtimes.reduce((sum, r) => sum + r, 0) / runtimes.length
      : 0;

    return res.json({
      problemsSolved: uniqueProblems,
      accuracy: totalTotal > 0 ? (totalPassed / totalTotal) * 100 : 0,
      avgRuntime: Math.round(avgRuntime * 100) / 100,
      weakTopics,
      strongTopics,
      totalSubmissions: results.length,
      topicStats: topicAccuracy,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getAdminAnalytics(req, res) {
  try {
    const { batchId } = req.query;

    if (!batchId) {
      return res.status(400).json({ error: 'batchId is required' });
    }

    const batchStudents = await prisma.batchStudent.findMany({
      where: { batchId },
      select: { userId: true },
    });
    const userIds = batchStudents.map(bs => bs.userId);

    if (userIds.length === 0) {
      return res.json({
        totalSubmissions: 0,
        totalStudents: 0,
        avgAccuracy: 0,
        topStudents: [],
        weakStudents: [],
        topicBreakdown: [],
      });
    }

    const results = await prisma.codingResult.findMany({
      where: {
        userId: { in: userIds },
        question: {
          is: {
            batchId: batchId
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        question: {
          select: {
            topic: true,
            difficulty: true,
          },
        },
      },
    });

    const studentStats = {};
    results.forEach(r => {
      const uid = r.userId;
      if (!studentStats[uid]) {
        studentStats[uid] = {
          userId: uid,
          name: r.user.name,
          email: r.user.email,
          total: 0,
          passed: 0,
          submissions: 0,
        };
      }
      studentStats[uid].total += r.total;
      studentStats[uid].passed += r.passed;
      studentStats[uid].submissions += 1;
    });

    const students = Object.values(studentStats).map(s => ({
      ...s,
      accuracy: s.total > 0 ? (s.passed / s.total) * 100 : 0,
    })).sort((a, b) => b.accuracy - a.accuracy);

    const topStudents = students.slice(0, 5);
    const weakStudents = students.filter(s => s.accuracy < 60).slice(0, 5);

    const topicStats = {};
    results.forEach(r => {
      const topic = r.question.topic || 'General';
      if (!topicStats[topic]) {
        topicStats[topic] = { total: 0, passed: 0 };
      }
      topicStats[topic].total += r.total;
      topicStats[topic].passed += r.passed;
    });

    const topicBreakdown = Object.entries(topicStats).map(([topic, stats]) => ({
      topic,
      total: stats.total,
      passed: stats.passed,
      percentage: stats.total > 0 ? (stats.passed / stats.total) * 100 : 0,
    })).sort((a, b) => b.percentage - a.percentage);

    return res.json({
      totalSubmissions: results.length,
      totalStudents: students.length,
      avgAccuracy: students.length > 0
        ? students.reduce((sum, s) => sum + s.accuracy, 0) / students.length
        : 0,
      topStudents,
      weakStudents,
      topicBreakdown,
    });
  } catch (error) {
    console.error('Get admin analytics error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function generateCodingQuestionHandler(req, res) {
  try {
    const { topic, difficulty, language } = req.body;

    if (!topic || !difficulty || !language) {
      return res.status(400).json({ error: 'Topic, difficulty, and language are required' });
    }

    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid difficulty. Use easy, medium, or hard' });
    }

    const validLanguages = ['c', 'cpp', 'java', 'python'];
    if (!validLanguages.includes(language.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid language. Use c, cpp, java, or python' });
    }

    const generated = await generateCodingQuestion(topic, difficulty, language);

    return res.json(generated);
  } catch (error) {
    console.error('Generate coding question error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function createCodingQuestionHandler(req, res) {
  try {
    console.log("Creating coding question for batch:", req.body.batchId);
    console.log("Incoming request:", req.body);

    const { batchId, type, topic, difficulty, title, description, starterCode, testCases, language } = req.body;

    if (!batchId) {
      return res.status(400).json({ error: 'Batch ID is required' });
    }

    if (!type || !topic || !difficulty || !title || !description) {
      return res.status(400).json({ error: 'Type, topic, difficulty, title, and description are required' });
    }

    const finalLanguage = language || "java";

    let parsedTestCases = [];

    if (req.body.testCases) {
      if (typeof req.body.testCases === "string") {
        try {
          parsedTestCases = JSON.parse(req.body.testCases);
        } catch {
          parsedTestCases = [];
        }
      } else if (Array.isArray(req.body.testCases)) {
        parsedTestCases = req.body.testCases;
      }
    }

    if (!parsedTestCases.length) {
      parsedTestCases = [
        { input: "", expectedOutput: "" }
      ];
    }

    console.log("Parsed test cases:", parsedTestCases);

    const question = await prisma.codingQuestion.create({
      data: {
        batchId: batchId,
        type: req.body.type,
        topic: req.body.topic,
        difficulty: req.body.difficulty,
        title: req.body.title,
        description: req.body.description,
        language: finalLanguage,
        starterCode: req.body.starterCode || "",
        testCases: parsedTestCases
      }
    });

    if (question.type === "test") {
      const test = await prisma.codingTest.create({
        data: {
          title: question.title,
          codingBatchId: question.batchId,
          duration: 30
        }
      });

      await prisma.codingTestQuestion.create({
        data: {
          codingTestId: test.id,
          codingQuestionId: question.id
        }
      });
    }

    if (question.type === "debug") {
      const test = await prisma.codingTest.create({
        data: {
          title: `[Debug] ${question.title}`,
          codingBatchId: question.batchId,
          duration: 30
        }
      });

      await prisma.codingTestQuestion.create({
        data: {
          codingTestId: test.id,
          codingQuestionId: question.id
        }
      });
    }

    return res.status(201).json(question);
  } catch (error) {
    console.error('Create coding question error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function updateCodingQuestionHandler(req, res) {
  try {
    const { id } = req.params;
    const { type, topic, difficulty, title, description, starterCode, testCases } = req.body;

    const existing = await prisma.codingQuestion.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (topic !== undefined) updateData.topic = topic;
    if (difficulty !== undefined) updateData.difficulty = difficulty.toLowerCase();
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (starterCode !== undefined) updateData.starterCode = starterCode;
    if (testCases !== undefined) {
      // Parse if string
      let parsedTestCases = testCases;
      if (typeof testCases === "string") {
        try {
          parsedTestCases = JSON.parse(testCases);
        } catch {
          parsedTestCases = [];
        }
      }
      if (!Array.isArray(parsedTestCases) || parsedTestCases.length === 0) {
        return res.status(400).json({ error: 'At least one test case is required' });
      }
      updateData.testCases = parsedTestCases;
    }

    const question = await prisma.codingQuestion.update({
      where: { id },
      data: updateData,
    });

    return res.json(question);
  } catch (error) {
    console.error('Update coding question error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteCodingQuestionHandler(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.codingQuestion.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await prisma.codingQuestion.delete({
      where: { id },
    });

    return res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete coding question error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getAdminQuestionsHandler(req, res) {
  try {
    const { batchId } = req.query;

    const where = batchId ? { batchId: batchId } : {};

    const questions = await prisma.codingQuestion.findMany({
      where,
      include: {
        batch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(questions.map(q => ({
      ...q,
      batchId: q.batch?.id,
      batchName: q.batch?.name,
    })));
  } catch (error) {
    console.error('Get admin questions error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getSubmissionsHandler(req, res) {
  try {
    const { questionId } = req.params;
    const userId = req.user.id;

    const submissions = await prisma.codingResult.findMany({
      where: {
        userId,
        questionId,
      },
      select: {
        id: true,
        code: true,
        language: true,
        passed: true,
        total: true,
        status: true,
        submittedAt: true,
      },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    });

    return res.json(submissions);
  } catch (error) {
    console.error('Get submissions error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getHintHandler(req, res) {
  try {
    const { questionId, description, title, code } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured' });
    }

    const problemContext = `${title}\n${description}`;
    const hint = await generateHint(problemContext, code || "");

    res.json({
      success: true,
      hint
    });
  } catch (error) {
    console.error('Get hint error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function createCodingTestHandler(req, res) {
  try {
    const { batchId, title, duration, questionIds } = req.body;

    if (!batchId || !title) {
      return res.status(400).json({ error: 'Batch and title are required' });
    }

    const test = await prisma.codingTest.create({
      data: {
        codingBatchId: batchId,
        title,
        duration: duration || 60,
      },
    });

    if (questionIds && questionIds.length > 0) {
      await prisma.codingTestQuestion.createMany({
        data: questionIds.map((qId, index) => ({
          codingTestId: test.id,
          codingQuestionId: qId,
          orderIndex: index,
        })),
      });
    }

    return res.status(201).json(test);
  } catch (error) {
    console.error('Create coding test error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getAdminCodingTestsHandler(req, res) {
  try {
    const { batchId } = req.query;

    const where = batchId ? { codingBatchId: batchId } : {};

    const tests = await prisma.codingTest.findMany({
      where,
      include: {
        batch: {
          select: { id: true, name: true },
        },
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(tests.map(t => ({
      ...t,
      batchId: t.codingBatchId,
      batchName: t.batch?.name,
    })));
  } catch (error) {
    console.error('Get admin coding tests error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteCodingTestHandler(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.codingTest.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Test not found' });
    }

    await prisma.codingTest.delete({
      where: { id },
    });

    return res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Delete coding test error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getCodingHistory(req, res) {
  try {
    const userId = req.user.id;
    const { batchId } = req.query;

    if (!batchId) {
      return res.status(400).json({ error: 'batchId is required' });
    }

    const isMember = await prisma.batchStudent.findFirst({
      where: { userId, batchId },
    });

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied to this batch' });
    }

    const submissions = await prisma.codingResult.findMany({
      where: {
        userId,
        question: {
          is: {
            batchId: batchId
          }
        }
      },
      include: {
        question: {
          select: {
            id: true,
            title: true,
            topic: true,
            difficulty: true,
            type: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const history = submissions.map(s => ({
      id: s.id,
      questionId: s.questionId,
      testId: s.testId,
      questionTitle: s.question?.title || 'Unknown',
      topic: s.question?.topic || 'General',
      difficulty: s.question?.difficulty || 'medium',
      questionType: s.question?.type || 'practice',
      language: s.language,
      code: s.code,
      passed: s.passed,
      total: s.total,
      runtime: s.runtime,
      memory: s.memory,
      status: s.status,
      createdAt: s.submittedAt,
    }));

    return res.json(history);
  } catch (error) {
    console.error('Get coding history error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getCodingResultById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await prisma.codingResult.findUnique({
      where: { id },
      include: {
        question: {
          select: {
            id: true,
            title: true,
            description: true,
            topic: true,
            difficulty: true,
            testCases: true,
            batchId: true,
          },
        },
      },
    });

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    if (result.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.json({
      id: result.id,
      questionId: result.questionId,
      testId: result.testId,
      code: result.code,
      language: result.language,
      passed: result.passed,
      total: result.total,
      status: result.status,
      runtime: result.runtime,
      memory: result.memory,
      submittedAt: result.submittedAt,
      question: result.question,
    });
  } catch (error) {
    console.error('Get coding result error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getStudentCodingAnalytics(req, res) {
  try {
    const userId = req.user.id;
    const { batchId } = req.query;

    if (!batchId) {
      return res.status(400).json({ error: 'batchId is required' });
    }

    const isMember = await prisma.batchStudent.findFirst({
      where: { userId, batchId },
    });

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied to this batch' });
    }

    const results = await prisma.codingResult.findMany({
      where: {
        userId,
        question: {
          is: {
            batchId: batchId
          }
        }
      },
      include: {
        question: {
          select: {
            topic: true,
            difficulty: true,
            type: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    if (results.length === 0) {
      return res.json({
        totalSubmissions: 0,
        totalCodingTests: 0,
        avgAccuracy: 0,
        avgRuntime: 0,
        avgMemory: 0,
        languageStats: [],
        topicPerformance: [],
        weakTopics: [],
        strongTopics: [],
        recentSubmissions: [],
      });
    }

    const topicStats = {};
    const languageStats = {};
    let totalPassed = 0;
    let totalTotal = 0;
    let totalRuntime = 0;
    let runtimeCount = 0;
    let totalMemory = 0;
    let memoryCount = 0;
    const codingTestIds = new Set();

    results.forEach(r => {
      if (r.testId) codingTestIds.add(r.testId);

      const topic = r.question?.topic || 'General';
      if (!topicStats[topic]) {
        topicStats[topic] = { total: 0, passed: 0 };
      }
      topicStats[topic].total += r.total;
      topicStats[topic].passed += r.passed;

      const lang = r.language || 'unknown';
      if (!languageStats[lang]) {
        languageStats[lang] = { submissions: 0, passed: 0, total: 0 };
      }
      languageStats[lang].submissions += 1;
      languageStats[lang].passed += r.passed;
      languageStats[lang].total += r.total;

      totalPassed += r.passed;
      totalTotal += r.total;

      if (r.runtime !== null) {
        totalRuntime += r.runtime;
        runtimeCount += 1;
      }
      if (r.memory !== null) {
        totalMemory += r.memory;
        memoryCount += 1;
      }
    });

    const topicPerformance = Object.entries(topicStats).map(([topic, stats]) => ({
      topic,
      total: stats.total,
      passed: stats.passed,
      accuracy: stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0,
    }));

    const languageStatsArray = Object.entries(languageStats).map(([language, stats]) => ({
      language,
      submissions: stats.submissions,
      accuracy: stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0,
    }));

    const weakTopics = topicPerformance
      .filter(t => t.accuracy < 50)
      .map(t => t.topic);

    const strongTopics = topicPerformance
      .filter(t => t.accuracy >= 75)
      .map(t => t.topic);

    const recentSubmissions = results.slice(0, 20).map(r => ({
      id: r.id,
      questionId: r.questionId,
      questionTitle: r.question?.title || 'Unknown',
      language: r.language,
      passed: r.passed,
      total: r.total,
      runtime: r.runtime,
      status: r.status,
      createdAt: r.submittedAt,
    }));

    return res.json({
      totalSubmissions: results.length,
      totalCodingTests: codingTestIds.size,
      avgAccuracy: totalTotal > 0 ? Math.round((totalPassed / totalTotal) * 100) : 0,
      avgRuntime: runtimeCount > 0 ? Math.round(totalRuntime / runtimeCount) : 0,
      avgMemory: memoryCount > 0 ? Math.round(totalMemory / memoryCount) : 0,
      languageStats: languageStatsArray,
      topicPerformance,
      weakTopics,
      strongTopics,
      recentSubmissions,
    });
  } catch (error) {
    console.error('Get student coding analytics error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getCodingTestAnalytics(req, res) {
  try {
    const { testId } = req.params;

    const test = await prisma.codingTest.findUnique({
      where: { id: testId },
      include: {
        batch: {
          select: { id: true, name: true },
        },
        questions: {
          include: {
            codingQuestion: {
              select: {
                id: true,
                title: true,
                topic: true,
                difficulty: true,
                type: true,
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const batchId = test.codingBatchId;
    const batchStudents = await prisma.batchStudent.findMany({
      where: { batchId },
      select: { userId: true },
    });
    const batchUserIds = new Set(batchStudents.map(bs => bs.userId));

    const allResults = await prisma.codingResult.findMany({
      where: {
        testId,
        userId: { in: Array.from(batchUserIds) },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const totalQuestions = test.questions.length;
    const uniqueUsers = [...new Set(allResults.map(r => r.userId))];
    const totalStudents = batchUserIds.size;
    const attemptedStudents = uniqueUsers.length;

    const studentMap = {};
    uniqueUsers.forEach(userId => {
      const userResults = allResults.filter(r => r.userId === userId);
      const user = userResults[0]?.user;

      let totalPassed = 0;
      let totalAttempted = 0;
      const topicStats = {};
      const questionResults = {};

      userResults.forEach(r => {
        const qId = r.questionId;
        if (!questionResults[qId] || r.passed > questionResults[qId].passed) {
          questionResults[qId] = { passed: r.passed, total: r.total };
        }
        totalPassed += r.passed;
        totalAttempted += r.total;

        const question = test.questions.find(q => q.codingQuestion.id === qId);
        const topic = question?.codingQuestion.topic || 'General';
        if (!topicStats[topic]) {
          topicStats[topic] = { correct: 0, wrong: 0 };
        }
        topicStats[topic].correct += r.passed;
        topicStats[topic].wrong += (r.total - r.passed);
      });

      const weakTopics = Object.entries(topicStats)
        .filter(([, stats]) => stats.wrong > stats.correct)
        .map(([topic]) => topic);
      const strongTopics = Object.entries(topicStats)
        .filter(([, stats]) => stats.correct >= stats.wrong && stats.correct > 0)
        .map(([topic]) => topic);

      studentMap[userId] = {
        userId,
        name: user?.name || 'Unknown',
        email: user?.email || '',
        score: totalPassed,
        correct: totalPassed,
        wrong: totalAttempted - totalPassed,
        total: totalAttempted,
        accuracy: totalAttempted > 0 ? Math.round((totalPassed / totalAttempted) * 100) : 0,
        weakTopics,
        strongTopics,
        status: totalPassed >= Math.ceil(totalQuestions * 0.5) ? 'Passed' : 'Failed',
        submissions: userResults.length,
      };
    });

    const students = Object.values(studentMap).sort((a, b) => b.accuracy - a.accuracy);

    const avgScore = totalStudents > 0
      ? Math.round(students.reduce((sum, s) => sum + s.accuracy, 0) / totalStudents)
      : 0;
    const highestScore = totalStudents > 0
      ? Math.max(...students.map(s => s.accuracy))
      : 0;
    const lowestScore = totalStudents > 0
      ? Math.min(...students.map(s => s.accuracy))
      : 0;
    const passCount = students.filter(s => s.status === 'Passed').length;

    const questionAnalytics = test.questions.map(q => {
      const qId = q.codingQuestion.id;
      const questionResults = allResults.filter(r => r.questionId === qId);
      const correctAttempts = questionResults.reduce((sum, r) => sum + r.passed, 0);
      const totalAttempts = questionResults.reduce((sum, r) => sum + r.total, 0);
      const wrongAttempts = totalAttempts - correctAttempts;
      const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

      return {
        questionId: qId,
        title: q.codingQuestion.title,
        topic: q.codingQuestion.topic,
        difficulty: q.codingQuestion.difficulty,
        correctAttempts,
        wrongAttempts,
        totalAttempts,
        accuracy,
        difficulty: accuracy >= 70 ? 'easy' : accuracy >= 40 ? 'medium' : 'hard',
      };
    });

    const sortedQuestions = [...questionAnalytics].sort((a, b) => a.accuracy - b.accuracy);

    const scoreDistribution = {
      excellent: students.filter(s => s.accuracy >= 80).length,
      good: students.filter(s => s.accuracy >= 60 && s.accuracy < 80).length,
      average: students.filter(s => s.accuracy >= 40 && s.accuracy < 60).length,
      needsImprovement: students.filter(s => s.accuracy < 40).length,
    };

    return res.json({
      test: {
        id: test.id,
        title: test.title,
        batchName: test.batch?.name,
        duration: test.duration,
        totalQuestions,
      },
      overallStats: {
        totalStudents,
        attemptedStudents: uniqueUsers.filter(uid =>
          allResults.some(r => r.userId === uid && r.testId === testId)
        ).length,
        averageScore: avgScore,
        highestScore,
        lowestScore,
        passRate: totalStudents > 0 ? Math.round((passCount / totalStudents) * 100) : 0,
        totalSubmissions: allResults.length,
      },
      students,
      questionAnalytics: sortedQuestions,
      mostDifficultQuestions: sortedQuestions.slice(0, 5),
      easiestQuestions: [...sortedQuestions].reverse().slice(0, 5),
      scoreDistribution,
    });
  } catch (error) {
    console.error('Get coding test analytics error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getCodingInsights(req, res) {
  try {
    const userId = req.user.id;
    const { batchId } = req.params;

    const isMember = await prisma.batchStudent.findFirst({
      where: { userId, batchId },
    });

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied to this batch' });
    }

    const results = await prisma.codingResult.findMany({
      where: {
        userId,
        question: {
          is: {
            batchId: batchId
          }
        }
      },
      include: {
        question: {
          select: {
            id: true,
            topic: true,
            difficulty: true,
            type: true,
            title: true,
          }
        }
      }
    });

    const weakTopics = {};
    const failedQuestions = [];
    
    results.forEach(r => {
      if (r.passed < r.total) {
        const topic = r.question?.topic || 'General';
        weakTopics[topic] = (weakTopics[topic] || 0) + 1;
        failedQuestions.push({
          questionId: r.question?.id,
          title: r.question?.title,
          topic: topic,
          difficulty: r.question?.difficulty,
          passed: r.passed,
          total: r.total,
        });
      }
    });

    const suggestions = [];
    for (const topic in weakTopics) {
      const count = weakTopics[topic];
      suggestions.push({
        topic,
        count,
        suggestion: `Focus on improving ${topic} problems. You have ${count} incomplete submissions in this topic.`,
      });
    }

    const resultsByTopic = {};
    results.forEach(r => {
      const topic = r.question?.topic || 'General';
      if (!resultsByTopic[topic]) {
        resultsByTopic[topic] = { passed: 0, total: 0 };
      }
      resultsByTopic[topic].passed += r.passed;
      resultsByTopic[topic].total += r.total;
    });

    const topicStats = Object.entries(resultsByTopic).map(([topic, stats]) => ({
      topic,
      passed: stats.passed,
      total: stats.total,
      accuracy: stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0,
    }));

    return res.json({
      results: results.map(r => ({
        id: r.id,
        questionId: r.questionId,
        passed: r.passed,
        total: r.total,
        runtime: r.runtime,
        memory: r.memory,
        status: r.status,
        submittedAt: r.submittedAt,
        topic: r.question?.topic,
        difficulty: r.question?.difficulty,
        type: r.question?.type,
      })),
      weakTopics,
      suggestions,
      topicStats,
      totalAttempts: results.length,
    });
  } catch (error) {
    console.error('Get coding insights error:', error);
    return res.status(500).json({ error: error.message });
  }
}