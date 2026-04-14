import { Router } from 'express';
import { runCodeHandler, submitCodeHandler } from '../controllers/compiler.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/run', runCodeHandler);
router.post('/submit', submitCodeHandler);

export default router;