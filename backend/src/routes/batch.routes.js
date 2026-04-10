import { Router } from 'express';
import { createBatch, joinBatch, getBatches } from '../controllers/batch.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/create', requireRole('ADMIN', 'SUPER_ADMIN'), createBatch);
router.post('/join', requireRole('STUDENT'), joinBatch);
router.get('/get', getBatches);

export default router;
