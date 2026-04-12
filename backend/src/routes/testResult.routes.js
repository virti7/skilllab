import { Router } from 'express';
import { getTestResult } from '../controllers/testResult.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/:testId/result', getTestResult);

export default router;