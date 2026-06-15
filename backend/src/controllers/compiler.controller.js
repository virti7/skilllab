import { runCode, submitCode, validateLanguage } from '../services/compiler.service.js';
import { prisma } from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function runCodeHandler(req, res, next) {
  try {
    const { code, language, input } = req.body;

    if (!code || !language) {
      return sendError(res, 'Code and language are required', 400);
    }

    const result = await runCode({ code, language, input: input || '' });

    return res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function submitCodeHandler(req, res, next) {
  try {
    const { code, language, questionId } = req.body;
    const userId = req.user?.id;

    if (!code || !language || !questionId) {
      return sendError(res, 'Code, language, and questionId are required', 400);
    }

    const question = await prisma.codingQuestion.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        testCases: true,
        expectedOutput: true,
        starterCode: true,
        title: true,
      },
    });

    if (!question) {
      return sendError(res, 'Question not found', 404);
    }

    const testCases = question.testCases || [];

    let submissionResult;
    if (testCases.length > 0) {
      submissionResult = await submitCode(code, language, testCases);
    } else if (question.expectedOutput) {
      const result = await runCode({ code, language, input: '' });
      submissionResult = {
        results: [{
          expectedOutput: question.expectedOutput,
          actualOutput: result.stdout.trim(),
          passed: result.stdout.trim() === question.expectedOutput.trim(),
          runtime: result.time,
        }],
        passed: result.stdout.trim() === question.expectedOutput.trim() ? 1 : 0,
        total: 1,
        status: result.stdout.trim() === question.expectedOutput.trim() ? 'Accepted' : 'Wrong Answer',
      };
    } else {
      submissionResult = {
        results: [],
        passed: 0,
        total: 0,
        status: 'Error',
      };
    }

    if (userId) {
      await prisma.codingResult.create({
        data: {
          userId,
          questionId,
          code,
          language,
          passed: submissionResult.passed,
          total: submissionResult.total,
          status: submissionResult.passed === submissionResult.total ? 'success' : 'failed',
        },
      });
    }

    return res.json(submissionResult);
  } catch (error) {
    next(error);
  }
}
