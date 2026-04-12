import prisma from '../utils/prisma.js';

export async function getStudentAnalytics(req, res) {
  try {
    const { id: userId, role } = req.user;

    console.log("Fetching analytics for user:", userId);

    if (role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can access this endpoint' });
    }

    const results = await prisma.result.findMany({
      where: { userId },
    });

    const testsTaken = results.length;

    const avgScore =
      results.length > 0
        ? Math.round(
            results.reduce((sum, r) => sum + r.percentage, 0) / results.length
          )
        : 0;

    const passedCount = results.filter((r) => r.percentage >= 50).length;

    const batchStudents = await prisma.batchStudent.findFirst({
      where: { userId },
    });

    let rank = null;
    let completion = 0;

    if (batchStudents) {
      const batchId = batchStudents.batchId;

      const allBatchStudents = await prisma.batchStudent.findMany({
        where: { batchId },
        include: {
          user: {
            include: {
              results: {
                where: { test: { batchId } },
              },
            },
          },
        },
      });

      const leaderboard = allBatchStudents
        .map((bs) => {
          const scores = bs.user.results.map((r) => r.percentage);
          const userAvg =
            scores.length > 0
              ? scores.reduce((a, b) => a + b, 0) / scores.length
              : 0;
          return {
            userId: bs.userId,
            avgScore: userAvg,
          };
        })
        .sort((a, b) => b.avgScore - a.avgScore);

      const userRankEntry = leaderboard.findIndex((l) => l.userId === userId);
      rank = userRankEntry >= 0 ? userRankEntry + 1 : null;

      const totalTestsInBatch = await prisma.test.count({
        where: { batchId },
      });

      completion =
        totalTestsInBatch > 0
          ? Math.round((testsTaken / totalTestsInBatch) * 100)
          : 0;
    }

    const recentTests = results.slice(-5).map((r) => ({
      testId: r.testId,
      score: r.score,
      percentage: r.percentage,
      submittedAt: r.submittedAt,
    }));

    console.log("Student Analytics:", { testsTaken, avgScore, rank, completion, passedCount });

    res.json({
      testsTaken,
      avgScore,
      rank,
      completion,
      passedCount,
      recentTests,
    });
  } catch (err) {
    console.error('Get student analytics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getTopicBreakdown(req, res) {
  try {
    const { id: userId } = req.user;

    console.log("Fetching topic breakdown for user:", userId);

    const results = await prisma.result.findMany({
      where: { userId },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
        test: {
          include: {
            questions: true,
          },
        },
      },
    });

    const topicStats = {};

    results.forEach((result) => {
      if (!result.test?.questions) return;
      
      result.test.questions.forEach((question) => {
        const answer = result.answers.find((a) => a.questionId === question.id);
        const topic = question.topic || "General";

        if (!topicStats[topic]) {
          topicStats[topic] = { total: 0, correct: 0 };
        }

        topicStats[topic].total++;

        if (answer && answer.isCorrect) {
          topicStats[topic].correct++;
        }
      });
    });

    const formatted = Object.entries(topicStats).map(([topic, val]) => ({
      topic,
      total: val.total,
      correct: val.correct,
      percentage: val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0,
    }));

    formatted.sort((a, b) => b.percentage - a.percentage);

    console.log("Topic Breakdown:", formatted);

    res.json({
      topics: formatted,
    });
  } catch (err) {
    console.error('Get topic breakdown error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCompletedTestsAnalytics(req, res) {
  try {
    const { id: userId } = req.user;

    console.log("Fetching completed tests analytics for user:", userId);

    const results = await prisma.result.findMany({
      where: { userId },
      include: {
        test: {
          include: {
            questions: true,
            batch: true,
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const formatted = results.map((result) => {
      const questions = result.test.questions;
      const answers = result.answers;

      let correct = 0;

      const topicStats = {};

      questions.forEach((q) => {
        const answer = answers.find((a) => a.questionId === q.id);
        const isCorrect = answer?.isCorrect ?? false;

        if (isCorrect) correct++;

        const topic = q.topic || "General";

        if (!topicStats[topic]) {
          topicStats[topic] = { total: 0, correct: 0 };
        }

        topicStats[topic].total++;

        if (isCorrect) topicStats[topic].correct++;
      });

      const topics = Object.entries(topicStats).map(([topic, val]) => ({
        topic,
        total: val.total,
        correct: val.correct,
        percentage: val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0,
      }));

      const weakTopics = topics
        .filter((t) => t.percentage < 60)
        .map((t) => t.topic);

      return {
        testId: result.testId,
        title: result.test.title,
        batchName: result.test.batch?.name,
        score: result.score,
        total: questions.length,
        correct,
        wrong: questions.length - correct,
        percentage: result.percentage,
        submittedAt: result.submittedAt,
        topics,
        weakTopics,
      };
    });

    console.log("Completed Tests Analytics:", formatted.length, "tests");

    res.json({ tests: formatted });
  } catch (err) {
    console.error('Get completed tests analytics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}