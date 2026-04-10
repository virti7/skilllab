import { Router } from 'express';
import { adminDashboard, studentDashboard } from '../controllers/dashboard.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/admin', requireRole('ADMIN', 'SUPER_ADMIN'), adminDashboard);
router.get('/student', requireRole('STUDENT'), studentDashboard);

export default router;
