import { Router } from 'express';
import {
  getLeaderboard,
  getBatchLeaderboard,
} from '../controllers/leaderboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getLeaderboard);
router.get('/batch/:batchId', getBatchLeaderboard);

export default router;
