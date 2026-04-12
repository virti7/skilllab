import { Router } from 'express';
import { getStudentAnalytics, getTopicBreakdown, getCompletedTestsAnalytics } from '../controllers/student.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/analytics', getStudentAnalytics);
router.get('/topic-breakdown', getTopicBreakdown);
router.get('/completed-tests-analytics', getCompletedTestsAnalytics);

export default router;