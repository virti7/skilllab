import { Router } from 'express';
import { getStudentAnalytics, getTopicBreakdown, getCompletedTestsAnalytics, getCombinedAnalytics } from '../controllers/student.controller.js';
import { getStudentCodingQuestions } from '../controllers/coding.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/analytics', requireRole('STUDENT'), getStudentAnalytics);
router.get('/topic-breakdown', requireRole('STUDENT'), getTopicBreakdown);
router.get('/completed-tests-analytics', requireRole('STUDENT'), getCompletedTestsAnalytics);
router.get('/combined-analytics', requireRole('STUDENT'), getCombinedAnalytics);
router.get('/coding/questions', requireRole('STUDENT'), getStudentCodingQuestions);

export default router;