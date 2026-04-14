import { randomBytes } from 'crypto';
import { prisma } from '../utils/prisma.js';

function generateInviteCode() {
  return randomBytes(4).toString('hex').toUpperCase(); // e.g. "A3F7BC12"
}

// POST /api/batch/create
export async function createBatch(req, res) {
  try {
    const { name } = req.body;
    const { instituteId } = req.user;

    if (!name) return res.status(400).json({ error: 'Batch name is required' });
    if (!instituteId) return res.status(400).json({ error: 'Admin must belong to an institute' });

    const inviteCode = generateInviteCode();

    const batch = await prisma.batch.create({
      data: {
        name,
        inviteCode,
        instituteId,
      },
    });

    return res.status(201).json(batch);
  } catch (err) {
    console.error('Create batch error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/batch/join
export async function joinBatch(req, res) {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    if (!inviteCode) return res.status(400).json({ error: 'Invite code is required' });

    const batch = await prisma.batch.findUnique({ where: { inviteCode } });
    if (!batch) return res.status(404).json({ error: 'Invalid invite code' });

    const existing = await prisma.batchStudent.findUnique({
      where: { batchId_userId: { batchId: batch.id, userId } },
    });
    if (existing) return res.status(409).json({ error: 'Already joined this batch' });

    await prisma.batchStudent.create({
      data: { batchId: batch.id, userId },
    });

    // Always assign student's instituteId from batch for consistency
    await prisma.user.update({
      where: { id: userId },
      data: { instituteId: batch.instituteId },
    });

    return res.json({ message: 'Joined batch successfully', batch });
  } catch (err) {
    console.error('Join batch error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/batch/:id/students
export async function getBatchStudents(req, res) {
  try {
    const { id } = req.params;
    const { instituteId } = req.user;

    const batch = await prisma.batch.findUnique({
      where: { id },
      select: { instituteId: true },
    });

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    if (batch.instituteId !== instituteId && req.user.role === 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const students = await prisma.batchStudent.findMany({
      where: { batchId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        batch: {
          select: { name: true },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const studentsWithResults = await Promise.all(
      students.map(async (bs) => {
        const results = await prisma.result.findMany({
          where: {
            userId: bs.user.id,
            test: { batchId: id },
          },
          select: {
            percentage: true,
            score: true,
            totalMarks: true,
          },
        });

        const avgScore =
          results.length > 0
            ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
            : null;
        const totalScore = results.reduce((s, r) => s + r.score, 0);

        return {
          id: bs.user.id,
          name: bs.user.name,
          email: bs.user.email,
          joinedAt: bs.joinedAt,
          batchName: bs.batch.name,
          testsCompleted: results.length,
          avgScore,
          totalScore,
        };
      })
    );

    return res.json({
      batchId: id,
      batchName: students[0]?.batch.name || '',
      students: studentsWithResults,
    });
  } catch (err) {
    console.error('Get batch students error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/batch/get
export async function getBatches(req, res) {
  try {
    const { role, instituteId, id: userId } = req.user;

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      const batches = await prisma.batch.findMany({
        where: { instituteId },
        include: {
          _count: { select: { batchStudents: true } },
          tests: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json(
        batches.map((b) => ({
          id: b.id,
          name: b.name,
          inviteCode: b.inviteCode,
          studentCount: b._count.batchStudents,
          testCount: b.tests.length,
          createdAt: b.createdAt,
        }))
      );
    }

    // Student: get their batches
    const batchStudents = await prisma.batchStudent.findMany({
      where: { userId },
      include: {
        batch: {
          include: {
            _count: { select: { batchStudents: true } },
            tests: { select: { id: true } },
          },
        },
      },
    });

    return res.json(
      batchStudents.map((bs) => ({
        id: bs.batch.id,
        name: bs.batch.name,
        studentCount: bs.batch._count.batchStudents,
        testCount: bs.batch.tests.length,
        joinedAt: bs.joinedAt,
      }))
    );
  } catch (err) {
    console.error('Get batches error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAdminBatches(req, res) {
  try {
    const { role, instituteId } = req.user;
    
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Return all batches for now (filter by instituteId can be added later)
    const batches = await prisma.batch.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log("Admin batches:", batches.length);
    return res.json(batches);
  } catch (err) {
    console.error('Get admin batches error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getStudentBatches(req, res) {
  try {
    const userId = req.user.id;

    const batchStudents = await prisma.batchStudent.findMany({
      where: { userId },
      include: {
        batch: true,
      },
    });

    const batches = batchStudents.map(bs => ({
      id: bs.batch.id,
      name: bs.batch.name,
      joinedAt: bs.joinedAt,
    }));

    return res.json(batches);
  } catch (err) {
    console.error('Get student batches error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
