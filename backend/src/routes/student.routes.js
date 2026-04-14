import { Router } from 'express';
import { getStudentAnalytics, getTopicBreakdown, getCompletedTestsAnalytics, getCombinedAnalytics } from '../controllers/student.controller.js';
import { getStudentCodingQuestions } from '../controllers/coding.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/analytics', getStudentAnalytics);
router.get('/topic-breakdown', getTopicBreakdown);
router.get('/completed-tests-analytics', getCompletedTestsAnalytics);
router.get('/combined-analytics', getCombinedAnalytics);
router.get('/coding/questions', getStudentCodingQuestions);

export default router;