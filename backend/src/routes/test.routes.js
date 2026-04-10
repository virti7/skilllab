import { Router } from 'express';
import {
  createTest,
  getTests,
  getTestById,
  submitTest,
} from '../controllers/test.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/create', requireRole('ADMIN', 'SUPER_ADMIN'), createTest);
router.get('/get', getTests);
router.get('/:testId', getTestById);
router.post('/submit', requireRole('STUDENT'), submitTest);

export default router;
