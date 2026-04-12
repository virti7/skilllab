import { Router } from 'express';
import { createBatch, joinBatch, getBatches, getBatchStudents } from '../controllers/batch.controller.js';
import { getBatchAnalytics } from '../controllers/batchAnalytics.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/create', requireRole('ADMIN', 'SUPER_ADMIN'), createBatch);
router.post('/join', requireRole('STUDENT'), joinBatch);
router.get('/get', getBatches);
router.get('/:id/students', requireRole('ADMIN', 'SUPER_ADMIN'), getBatchStudents);
router.get('/:id/analytics', requireRole('ADMIN', 'SUPER_ADMIN'), getBatchAnalytics);

export default router;
