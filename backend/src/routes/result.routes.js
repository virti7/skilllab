import { Router } from 'express';
import { getResults, getResultById } from '../controllers/result.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/get', getResults);
router.get('/:resultId', getResultById);

export default router;
