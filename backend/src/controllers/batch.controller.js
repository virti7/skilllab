import { randomBytes } from 'crypto';
import { prisma } from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import logger from '../utils/logger.js';

function generateInviteCode() {
  return randomBytes(4).toString('hex').toUpperCase();
}

export async function createBatch(req, res, next) {
  try {
    const { name } = req.body;
    const { instituteId } = req.user;

    logger.debug('createBatch request', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      instituteId,
      batchName: name,
    });

    if (!name) return sendError(res, 'Batch name is required', 400);
    if (!instituteId) return sendError(res, 'Admin must belong to an institute to create a batch', 400);

    const inviteCode = generateInviteCode();

    const batch = await prisma.batch.create({
      data: {
        name,
        inviteCode,
        instituteId,
      },
    });

    logger.info('Batch created', { batchId: batch.id, name, inviteCode, instituteId, createdBy: req.user.id });

    return sendSuccess(res, batch, 'Batch created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function joinBatch(req, res, next) {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    const userInstituteId = req.user.instituteId;

    logger.info('joinBatch request', {
      userId,
      email: req.user.email,
      role: userRole,
      instituteId: userInstituteId,
      inviteCode,
    });

    if (!inviteCode) {
      logger.warn('joinBatch failed: invite code missing', { userId });
      return sendError(res, 'Invite code is required', 400);
    }

    const batch = await prisma.batch.findUnique({ where: { inviteCode } });
    if (!batch) {
      logger.warn('joinBatch failed: invalid invite code', { userId, inviteCode });
      return sendError(res, 'Invalid invite code. Please check with your admin.', 404);
    }

    logger.info('joinBatch: batch found', {
      userId,
      batchId: batch.id,
      batchName: batch.name,
      batchInstituteId: batch.instituteId,
    });

    const existing = await prisma.batchStudent.findUnique({
      where: { batchId_userId: { batchId: batch.id, userId } },
    });
    if (existing) {
      logger.warn('joinBatch failed: already joined', { userId, batchId: batch.id });
      return sendError(res, 'You have already joined this batch', 409);
    }

    await prisma.batchStudent.create({
      data: { batchId: batch.id, userId },
    });

    if (userInstituteId !== batch.instituteId) {
      logger.info('joinBatch: updating user institute', {
        userId,
        oldInstituteId: userInstituteId,
        newInstituteId: batch.instituteId,
      });
      await prisma.user.update({
        where: { id: userId },
        data: { instituteId: batch.instituteId },
      });
    }

    logger.info('joinBatch: success', { userId, batchId: batch.id, batchName: batch.name });

    return sendSuccess(res, { message: 'Joined batch successfully', batch: { id: batch.id, name: batch.name, joinedAt: new Date().toISOString() } });
  } catch (err) {
    logger.error('joinBatch error', { userId: req.user?.id, inviteCode: req.body?.inviteCode, error: err.message });
    next(err);
  }
}

export async function getBatchStudents(req, res, next) {
  try {
    const { id } = req.params;
    const { instituteId, role } = req.user;

    logger.debug('getBatchStudents request', { batchId: id, userId: req.user.id, role });

    const batch = await prisma.batch.findUnique({
      where: { id },
      select: { instituteId: true, name: true },
    });

    if (!batch) {
      return sendError(res, 'Batch not found', 404);
    }

    if (role === 'ADMIN' && batch.instituteId !== instituteId) {
      logger.warn('getBatchStudents denied: institute mismatch', {
        userId: req.user.id,
        batchInstituteId: batch.instituteId,
        userInstituteId: instituteId,
      });
      return sendError(res, 'You do not have access to this batch', 403);
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

    return sendSuccess(res, {
      batchId: id,
      batchName: batch.name,
      students: studentsWithResults,
    });
  } catch (err) {
    next(err);
  }
}

export async function getBatches(req, res, next) {
  try {
    const { role, instituteId, id: userId } = req.user;

    logger.debug('getBatches request', { userId, role, instituteId });

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      const batches = await prisma.batch.findMany({
        where: { instituteId },
        include: {
          _count: { select: { batchStudents: true } },
          tests: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return sendSuccess(res,
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

    return sendSuccess(res,
      batchStudents.map((bs) => ({
        id: bs.batch.id,
        name: bs.batch.name,
        studentCount: bs.batch._count.batchStudents,
        testCount: bs.batch.tests.length,
        joinedAt: bs.joinedAt,
      }))
    );
  } catch (err) {
    next(err);
  }
}

export async function getAdminBatches(req, res, next) {
  try {
    const { role, instituteId } = req.user;

    logger.debug('getAdminBatches request', { userId: req.user.id, role, instituteId });

    const batches = await prisma.batch.findMany({
      where: role === 'SUPER_ADMIN' ? undefined : { instituteId },
      orderBy: { createdAt: 'desc' }
    });

    return sendSuccess(res, batches);
  } catch (err) {
    next(err);
  }
}

export async function getStudentBatches(req, res, next) {
  try {
    const userId = req.user.id;

    logger.debug('getStudentBatches request', { userId });

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

    return sendSuccess(res, batches);
  } catch (err) {
    next(err);
  }
}

export async function deleteBatch(req, res, next) {
  try {
    const { batchId } = req.params;
    const { instituteId, role } = req.user;

    logger.debug('deleteBatch request', { batchId, userId: req.user.id, role, instituteId });

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: { instituteId: true, name: true },
    });

    if (!batch) {
      return sendError(res, 'Batch not found', 404);
    }

    if (role === 'ADMIN' && batch.instituteId !== instituteId) {
      logger.warn('deleteBatch denied: institute mismatch', {
        userId: req.user.id,
        batchId,
        batchInstituteId: batch.instituteId,
        userInstituteId: instituteId,
      });
      return sendError(res, 'You can only delete batches from your own institute', 403);
    }

    await prisma.$transaction(async (tx) => {
      const tests = await tx.test.findMany({
        where: { batchId },
        select: { id: true },
      });

      for (const test of tests) {
        await tx.answer.deleteMany({ where: { result: { testId: test.id } } });
        await tx.result.deleteMany({ where: { testId: test.id } });
        await tx.question.deleteMany({ where: { testId: test.id } });
      }

      await tx.test.deleteMany({ where: { batchId } });

      await tx.codingTest.deleteMany({ where: { codingBatchId: batchId } });

      await tx.batchStudent.deleteMany({ where: { batchId } });

      await tx.batch.delete({ where: { id: batchId } });
    });

    logger.info('Batch deleted', { batchId, batchName: batch.name, deletedBy: req.user.id });

    return sendSuccess(res, { message: 'Batch deleted successfully' });
  } catch (err) {
    next(err);
  }
}
