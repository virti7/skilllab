import { Router } from 'express';
import { getTestAnalytics, getTestAnalyticsSimple } from '../controllers/testAnalytics.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/:testId/analytics', requireRole('ADMIN', 'SUPER_ADMIN'), getTestAnalytics);
router.get('/:testId/analytics/simple', getTestAnalyticsSimple);

export default router;
