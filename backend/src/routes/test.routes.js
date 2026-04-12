import { Router } from 'express';
import {
  createTest,
  getTests,
  getTestById,
  submitTest,
  deleteTest,
  getTestsByBatch,
  getUpcomingTests,
} from '../controllers/test.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/create', requireRole('ADMIN', 'SUPER_ADMIN'), createTest);
router.get('/get', getTests);
router.get('/batch/:batchId', requireRole('ADMIN', 'SUPER_ADMIN'), getTestsByBatch);
router.get('/upcoming', requireRole('STUDENT'), getUpcomingTests);
router.get('/:testId', getTestById);
router.post('/submit', requireRole('STUDENT'), submitTest);
router.delete('/:testId', requireRole('ADMIN', 'SUPER_ADMIN'), deleteTest);

export default router;
