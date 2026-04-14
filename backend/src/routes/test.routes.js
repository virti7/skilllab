import { Router } from 'express';
import {
  createTest,
  getTests,
  getTestById,
  submitTest,
  deleteTest,
  getTestsByBatch,
  getUpcomingTests,
  getTestsForStudent,
  getGeneralTests,
  getStudentTestHistory,
  getTestSubmissionAnalytics,
} from '../controllers/test.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/create', requireRole('ADMIN', 'SUPER_ADMIN'), createTest);
router.get('/get', getTests);
router.get('/batch/:batchId', requireRole('ADMIN', 'SUPER_ADMIN'), getTestsByBatch);
router.get('/upcoming', requireRole('STUDENT'), getUpcomingTests);
router.get('/student', requireRole('STUDENT'), getTestsForStudent);
router.get('/general', requireRole('STUDENT'), getGeneralTests);
router.get('/history', requireRole('STUDENT'), getStudentTestHistory);
router.get('/submission/:id', requireRole('STUDENT'), getTestSubmissionAnalytics);
router.get('/:testId', getTestById);
router.post('/submit', requireRole('STUDENT'), submitTest);
router.delete('/:testId', requireRole('ADMIN', 'SUPER_ADMIN'), deleteTest);

export default router;
