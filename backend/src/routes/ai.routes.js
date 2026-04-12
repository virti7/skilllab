import { Router } from 'express';
import { generateAITest, analyzePerformance, testGroq, debugGroq } from '../controllers/ai.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/test-groq', testGroq);
router.get('/debug-groq', debugGroq);

router.use(authenticate);

router.post('/generate-test', requireRole('ADMIN', 'SUPER_ADMIN'), generateAITest);
router.post('/analyze-performance', analyzePerformance);

export default router;
