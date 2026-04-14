import { prisma } from '../utils/prisma.js';

// GET /api/leaderboard  — overall or batch-wise
export async function getLeaderboard(req, res) {
  try {
    const { batchId } = req.query;
    const { instituteId } = req.user;

    // Build base filter for institute scope
    const testFilter = { instituteId };
    if (batchId) testFilter.batchId = batchId;

    // Use raw SQL for RANK() OVER
    const rows = await prisma.$queryRaw`
      SELECT
        u.id AS "userId",
        u.name,
        u.email,
        COALESCE(SUM(r.score), 0)::integer AS "totalScore",
        COUNT(r.id)::integer AS "testsCompleted",
        ROUND(AVG(r.percentage)::numeric, 1) AS "avgPercentage",
        RANK() OVER (ORDER BY COALESCE(SUM(r.score), 0) DESC)::integer AS rank
      FROM users u
      LEFT JOIN results r ON r."userId" = u.id
      LEFT JOIN tests t ON t.id = r."testId" AND t."instituteId" = ${instituteId}
      WHERE u."instituteId" = ${instituteId}
        AND u.role = 'STUDENT'
      GROUP BY u.id, u.name, u.email
      ORDER BY rank
    `;

    return res.json(
      rows.map((row) => ({
        rank: Number(row.rank),
        userId: row.userId,
        name: row.name,
        email: row.email,
        totalScore: Number(row.totalScore),
        testsCompleted: Number(row.testsCompleted),
        avgPercentage: Number(row.avgPercentage) || 0,
        avatar: row.name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
      }))
    );
  } catch (err) {
    console.error('Leaderboard error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/leaderboard/batch/:batchId
export async function getBatchLeaderboard(req, res) {
  try {
    const { batchId } = req.params;
    const { instituteId } = req.user;

    const rows = await prisma.$queryRaw`
      SELECT
        u.id AS "userId",
        u.name,
        u.email,
        COALESCE(SUM(r.score), 0)::integer AS "totalScore",
        COUNT(r.id)::integer AS "testsCompleted",
        ROUND(AVG(r.percentage)::numeric, 1) AS "avgPercentage",
        RANK() OVER (ORDER BY COALESCE(SUM(r.score), 0) DESC)::integer AS rank
      FROM users u
      INNER JOIN batch_students bs ON bs."userId" = u.id AND bs."batchId" = ${batchId}
      LEFT JOIN results r ON r."userId" = u.id
      LEFT JOIN tests t ON t.id = r."testId" AND t."batchId" = ${batchId}
      WHERE u."instituteId" = ${instituteId}
      GROUP BY u.id, u.name, u.email
      ORDER BY rank
    `;

    return res.json(
      rows.map((row) => ({
        rank: Number(row.rank),
        userId: row.userId,
        name: row.name,
        totalScore: Number(row.totalScore),
        testsCompleted: Number(row.testsCompleted),
        avgPercentage: Number(row.avgPercentage) || 0,
        avatar: row.name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
      }))
    );
  } catch (err) {
    console.error('Batch leaderboard error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
