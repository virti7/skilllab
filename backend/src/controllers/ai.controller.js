import { generateTestQuestions, analyzeStudentPerformance } from '../services/groq.service.js';

export async function testGroq(req, res) {
  try {
    const result = await generateTestQuestions('Excel', 'Functions', 'easy', 2);
    return res.json({ success: true, result });
  } catch (err) {
    console.error('Groq test error:', err);
    return res.status(500).json({ error: err.message });
  }
}

export async function debugGroq(req, res) {
  try {
    const result = await generateTestQuestions('Excel', 'General', 'easy', 1);
    return res.json({ success: true, result });
  } catch (err) {
    console.error('Groq debug error:', err);
    return res.status(500).json({ error: err.message });
  }
}

export async function generateAITest(req, res) {
  try {
    const { subject, topic, difficulty, numberOfQuestions } = req.body;

    if (!subject || !topic) {
      return res.status(400).json({ error: 'Subject and topic are required' });
    }

    if (!['easy', 'medium', 'hard', 'mixed'].includes(difficulty)) {
      return res.status(400).json({ error: 'Difficulty must be easy, medium, hard, or mixed' });
    }

    const numQuestions = Math.min(Math.max(parseInt(numberOfQuestions) || 5, 1), 20);

    const questions = await generateTestQuestions(subject, topic, difficulty, numQuestions);

    return res.json({
      success: true,
      questions,
      metadata: {
        subject,
        topic,
        difficulty,
        count: questions.length,
      },
    });
  } catch (err) {
    console.error('AI test generation error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to generate test questions',
    });
  }
}

export async function analyzePerformance(req, res) {
  try {
    const { studentName, answers, topics } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Answers array is required' });
    }

    const analysis = await analyzeStudentPerformance(
      studentName || 'Student',
      answers,
      topics || []
    );

    return res.json({
      success: true,
      analysis,
    });
  } catch (err) {
    console.error('AI performance analysis error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to analyze performance',
    });
  }
}
