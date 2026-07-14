import { prisma } from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import logger from '../utils/logger.js';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const leadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required').max(20),
  courseInterested: z.string().min(1, 'Course interested is required').max(100),
  status: z.enum(['NEW', 'CONTACTED', 'FOLLOW_UP', 'INTERESTED', 'ENROLLED', 'REJECTED']).optional(),
  source: z.string().max(100).optional(),
  assignedTo: z.string().uuid().optional().nullable(),
  notes: z.string().max(2000).optional(),
});

const followUpSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID'),
  followUpDate: z.string().min(1, 'Follow-up date is required'),
  remarks: z.string().max(1000).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
});

const convertLeadSchema = z.object({
  batchId: z.string().uuid().optional(),
  password: z.string().min(8).optional(),
});

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export async function getDashboard(req, res, next) {
  try {
    const whereClause = req.user.role === 'ADMIN'
      ? { assignedUser: { instituteId: req.user.instituteId } }
      : {};

    const followUpLeadWhere = whereClause.assignedUser
      ? { assignedUser: { instituteId: req.user.instituteId } }
      : undefined;

    const [
      totalLeads, newLeads, enrolledLeads, followUpsToday,
      recentLeads, statusCounts,
      totalStudents, totalInstitutes, totalUsers,
      monthlyLeadsRaw, followUpStatusCounts,
    ] = await Promise.all([
      prisma.lead.count({ where: whereClause }),
      prisma.lead.count({ where: { ...whereClause, status: 'NEW' } }),
      prisma.lead.count({ where: { ...whereClause, status: 'ENROLLED' } }),
      prisma.followUp.count({
        where: {
          status: 'PENDING',
          followUpDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          lead: followUpLeadWhere,
        },
      }),
      prisma.lead.findMany({
        where: whereClause,
        include: { assignedUser: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.lead.groupBy({
        by: ['status'],
        where: whereClause,
        _count: true,
      }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.institute.count(),
      prisma.user.count(),
      prisma.$queryRaw`
        SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COUNT(*)::int as count
        FROM leads
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
        ORDER BY month ASC
      `,
      prisma.followUp.groupBy({
        by: ['status'],
        where: followUpLeadWhere ? { lead: followUpLeadWhere } : {},
        _count: true,
      }),
    ]);

    const conversionRate = totalLeads > 0 ? Math.round((enrolledLeads / totalLeads) * 100) : 0;

    const statusChart = ['NEW', 'CONTACTED', 'FOLLOW_UP', 'INTERESTED', 'ENROLLED', 'REJECTED'].map((status) => {
      const found = statusCounts.find((s) => s.status === status);
      return { status, count: found ? found._count : 0 };
    });

    const monthlyLeads = monthlyLeadsRaw.map((row) => ({
      month: MONTH_NAMES[parseInt(row.month.split('-')[1], 10) - 1] || row.month,
      count: row.count,
    }));

    const followUpStatusChart = ['PENDING', 'COMPLETED', 'CANCELLED'].map((status) => {
      const found = followUpStatusCounts.find((s) => s.status === status);
      return { status, count: found ? found._count : 0 };
    });

    return sendSuccess(res, {
      totalLeads,
      newLeads,
      enrolledLeads,
      followUpsToday,
      conversionRate,
      totalStudents,
      totalInstitutes,
      totalUsers,
      recentLeads,
      statusChart,
      monthlyLeads,
      followUpStatusChart,
    });
  } catch (err) {
    next(err);
  }
}

export async function getLeads(req, res, next) {
  try {
    const { search, status, page = '1', limit = '50' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (req.user.role === 'ADMIN') {
      where.assignedUser = { instituteId: req.user.instituteId };
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { courseInterested: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: { assignedUser: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.lead.count({ where }),
    ]);

    return sendSuccess(res, {
      leads,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getLeadById(req, res, next) {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedUser: { select: { id: true, name: true, email: true } },
        followUps: { orderBy: { followUpDate: 'desc' } },
      },
    });

    if (!lead) {
      return sendError(res, 'Lead not found', 404);
    }

    return sendSuccess(res, lead);
  } catch (err) {
    next(err);
  }
}

export async function createLead(req, res, next) {
  try {
    const parsed = leadSchema.parse(req.body);
    const lead = await prisma.lead.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        courseInterested: parsed.courseInterested,
        status: parsed.status || 'NEW',
        source: parsed.source || null,
        assignedTo: parsed.assignedTo || null,
        notes: parsed.notes || null,
      },
      include: { assignedUser: { select: { id: true, name: true } } },
    });

    logger.info('Lead created', { leadId: lead.id, name: lead.name, createdBy: req.user.id });
    return sendSuccess(res, lead, 'Lead created successfully', 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return sendError(res, 'Validation failed', 400, err.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }
    next(err);
  }
}

export async function updateLead(req, res, next) {
  try {
    const { id } = req.params;
    const parsed = leadSchema.partial().parse(req.body);

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Lead not found', 404);
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: parsed,
      include: { assignedUser: { select: { id: true, name: true } } },
    });

    logger.info('Lead updated', { leadId: lead.id, updatedBy: req.user.id });
    return sendSuccess(res, lead, 'Lead updated successfully');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return sendError(res, 'Validation failed', 400, err.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }
    next(err);
  }
}

export async function deleteLead(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Lead not found', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.followUp.deleteMany({ where: { leadId: id } });
      await tx.lead.delete({ where: { id } });
    });

    logger.info('Lead deleted', { leadId: id, deletedBy: req.user.id });
    return sendSuccess(res, { message: 'Lead deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function convertLead(req, res, next) {
  try {
    const { id } = req.params;
    const parsed = convertLeadSchema.parse(req.body);

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return sendError(res, 'Lead not found', 404);
    }

    if (lead.status === 'ENROLLED') {
      return sendError(res, 'Lead is already enrolled', 400);
    }

    if (lead.status === 'REJECTED') {
      return sendError(res, 'Cannot convert a rejected lead', 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email: lead.email } });
    if (existingUser) {
      return sendError(res, 'A user with this email already exists', 409);
    }

    const rawPassword = parsed.password || crypto.randomBytes(12).toString('hex');
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    const result = await prisma.$transaction(async (tx) => {
      let instituteId = req.user.instituteId;

      if (!instituteId) {
        const institute = await tx.institute.create({
          data: { name: `${lead.name} Institute` },
        });
        instituteId = institute.id;
      }

      const user = await tx.user.create({
        data: {
          name: lead.name,
          email: lead.email,
          password: hashedPassword,
          role: 'STUDENT',
          instituteId,
        },
      });

      await tx.lead.update({
        where: { id },
        data: { status: 'ENROLLED' },
      });

      if (parsed.batchId) {
        const batch = await tx.batch.findUnique({ where: { id: parsed.batchId } });
        if (batch) {
          await tx.batchStudent.create({
            data: { batchId: batch.id, userId: user.id },
          });

          if (instituteId !== batch.instituteId) {
            await tx.user.update({
              where: { id: user.id },
              data: { instituteId: batch.instituteId },
            });
          }
        }
      }

      return { user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    });

    logger.info('Lead converted to student', {
      leadId: id,
      userId: result.user.id,
      batchId: parsed.batchId || null,
      convertedBy: req.user.id,
    });

    return sendSuccess(res, {
      user: result.user,
      lead: { id: lead.id, status: 'ENROLLED' },
      batchId: parsed.batchId || null,
      generatedPassword: rawPassword,
    }, 'Lead converted to student successfully');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return sendError(res, 'Validation failed', 400, err.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }
    next(err);
  }
}

export async function getFollowUps(req, res, next) {
  try {
    const { leadId, status, upcoming } = req.query;

    const where = {};
    if (leadId) where.leadId = leadId;
    if (status && status !== 'ALL') where.status = status;

    if (upcoming === 'true') {
      where.followUpDate = { gte: new Date() };
    }

    const followUps = await prisma.followUp.findMany({
      where,
      include: {
        lead: {
          select: { id: true, name: true, email: true, phone: true, status: true },
        },
      },
      orderBy: { followUpDate: 'asc' },
    });

    return sendSuccess(res, followUps);
  } catch (err) {
    next(err);
  }
}

export async function createFollowUp(req, res, next) {
  try {
    const parsed = followUpSchema.parse(req.body);

    const lead = await prisma.lead.findUnique({ where: { id: parsed.leadId } });
    if (!lead) {
      return sendError(res, 'Lead not found', 404);
    }

    const followUp = await prisma.followUp.create({
      data: {
        leadId: parsed.leadId,
        followUpDate: new Date(parsed.followUpDate),
        remarks: parsed.remarks || null,
        status: parsed.status || 'PENDING',
      },
      include: {
        lead: { select: { id: true, name: true } },
      },
    });

    if (lead.status === 'NEW' || lead.status === 'CONTACTED') {
      await prisma.lead.update({
        where: { id: parsed.leadId },
        data: { status: 'FOLLOW_UP' },
      });
    }

    logger.info('Follow-up created', { followUpId: followUp.id, leadId: parsed.leadId, createdBy: req.user.id });
    return sendSuccess(res, followUp, 'Follow-up scheduled successfully', 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return sendError(res, 'Validation failed', 400, err.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }
    next(err);
  }
}

export async function updateFollowUp(req, res, next) {
  try {
    const { id } = req.params;
    const parsed = followUpSchema.partial().omit({ leadId: true }).parse(req.body);

    const existing = await prisma.followUp.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Follow-up not found', 404);
    }

    const data = {};
    if (parsed.followUpDate) data.followUpDate = new Date(parsed.followUpDate);
    if (parsed.remarks !== undefined) data.remarks = parsed.remarks;
    if (parsed.status) data.status = parsed.status;

    const followUp = await prisma.followUp.update({
      where: { id },
      data,
      include: {
        lead: { select: { id: true, name: true } },
      },
    });

    logger.info('Follow-up updated', { followUpId: id, updatedBy: req.user.id });
    return sendSuccess(res, followUp, 'Follow-up updated successfully');
  } catch (err) {
    if (err instanceof z.ZodError) {
      return sendError(res, 'Validation failed', 400, err.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }
    next(err);
  }
}

export async function deleteFollowUp(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.followUp.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Follow-up not found', 404);
    }

    await prisma.followUp.delete({ where: { id } });

    logger.info('Follow-up deleted', { followUpId: id, deletedBy: req.user.id });
    return sendSuccess(res, { message: 'Follow-up deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getCounsellors(req, res, next) {
  try {
    const where = { role: 'ADMIN' };
    if (req.user.instituteId) {
      where.instituteId = req.user.instituteId;
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });

    return sendSuccess(res, users);
  } catch (err) {
    next(err);
  }
}
