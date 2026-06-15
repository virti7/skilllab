import { generateTestQuestions, analyzeStudentPerformance } from '../services/groq.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function testGroq(req, res, next) {
  try {
    const result = await generateTestQuestions('Excel', 'Functions', 'easy', 2);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function debugGroq(req, res, next) {
  try {
    const result = await generateTestQuestions('Excel', 'General', 'easy', 1);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function generateAITest(req, res, next) {
  try {
    const { subject, topic, difficulty, numberOfQuestions } = req.body;

    if (!subject || !topic) {
      return sendError(res, 'Subject and topic are required', 400);
    }

    if (!['easy', 'medium', 'hard', 'mixed'].includes(difficulty)) {
      return sendError(res, 'Difficulty must be easy, medium, hard, or mixed', 400);
    }

    const numQuestions = Math.min(Math.max(parseInt(numberOfQuestions) || 5, 1), 20);

    const questions = await generateTestQuestions(subject, topic, difficulty, numQuestions);

    return sendSuccess(res, {
      questions,
      metadata: {
        subject,
        topic,
        difficulty,
        count: questions.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function analyzePerformance(req, res, next) {
  try {
    const { studentName, answers, topics } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return sendError(res, 'Answers array is required', 400);
    }

    const analysis = await analyzeStudentPerformance(
      studentName || 'Student',
      answers,
      topics || []
    );

    return sendSuccess(res, { analysis });
  } catch (err) {
    next(err);
  }
}
