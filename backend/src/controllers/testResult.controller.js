import { prisma } from '../utils/prisma.js';
import { generateTestFeedback } from '../services/groq.service.js';

export async function getTestResult(req, res) {
  try {
    const { testId } = req.params;
    const { id: userId } = req.user;

    const result = await prisma.result.findUnique({
      where: {
        userId_testId: {
          userId,
          testId,
        },
      },
    });

    if (!result) {
      return res.status(404).json({ error: 'Result not found. You may not have taken this test yet.' });
    }

    const questions = await prisma.question.findMany({
      where: { testId },
    });

    const answers = await prisma.answer.findMany({
      where: { resultId: result.id },
    });

    const detailed = questions.map((q) => {
      const userAnswer = answers.find((a) => a.questionId === q.id);
      const isCorrect = userAnswer?.isCorrect ?? false;

      return {
        questionId: q.id,
        question: q.questionText,
        selected: userAnswer?.selectedOption ?? null,
        correct: q.correctOption,
        isCorrect,
      };
    });

    const topicStats = {};
    detailed.forEach((q) => {
      const topic = 'General';
      if (!topicStats[topic]) {
        topicStats[topic] = { total: 0, correct: 0 };
      }
      topicStats[topic].total++;
      if (q.isCorrect) {
        topicStats[topic].correct++;
      }
    });

    const topicStatsWithPercentage = {};
    Object.entries(topicStats).forEach(([topic, stats]) => {
      topicStatsWithPercentage[topic] = {
        total: stats.total,
        correct: stats.correct,
        percentage: Math.round((stats.correct / stats.total) * 100),
      };
    });

    const weakTopics = Object.entries(topicStats)
      .filter(([, val]) => val.correct / val.total < 0.6)
      .map(([topic]) => topic);

    const score = result.score;
    const total = questions.length;

    let aiFeedback = {
      strengths: '',
      weaknesses: '',
      suggestions: '',
    };

    if (process.env.GROQ_API_KEY) {
      try {
        const feedback = await generateTestFeedback(score, total, topicStatsWithPercentage, weakTopics, detailed);
        aiFeedback = feedback;
      } catch (aiErr) {
        console.error('AI feedback generation failed:', aiErr.message);
        aiFeedback = {
          strengths: 'Keep practicing consistently.',
          weaknesses: weakTopics.length > 0 ? `Focus on: ${weakTopics.join(', ')}` : 'Keep building your knowledge base.',
          suggestions: 'Review the topics you missed and practice more questions in those areas.',
        };
      }
    } else {
      aiFeedback = {
        strengths: weakTopics.length === 0 ? 'Excellent performance across all topics!' : `You did well in ${Object.keys(topicStats).filter(t => !weakTopics.includes(t)).join(', ') || 'some'} topics.`,
        weaknesses: weakTopics.length > 0 ? `Work on: ${weakTopics.join(', ')}` : 'Keep building your knowledge base.',
        suggestions: 'Practice weak topics to improve performance.',
      };
    }

    return res.json({
      testId,
      score,
      total,
      percentage: result.percentage,
      submittedAt: result.submittedAt,
      details: detailed,
      topicStats: topicStatsWithPercentage,
      weakTopics,
      aiFeedback,
    });
  } catch (err) {
    console.error('Get test result error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}