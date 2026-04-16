import { Router } from 'express';
import { adminDashboard, studentDashboard, getAdminStudents, getStudentAnalytics, getBatchPerformance } from '../controllers/dashboard.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/admin', requireRole('ADMIN', 'SUPER_ADMIN'), adminDashboard);
router.get('/student', requireRole('STUDENT'), studentDashboard);
router.get('/students', requireRole('ADMIN', 'SUPER_ADMIN'), getAdminStudents);
router.get('/student/:id', requireRole('ADMIN', 'SUPER_ADMIN'), getStudentAnalytics);
router.get('/batch-performance', requireRole('ADMIN', 'SUPER_ADMIN'), getBatchPerformance);

export default router;
