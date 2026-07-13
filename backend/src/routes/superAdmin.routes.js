import { Router } from 'express';
import {
  superAdminDashboard,
  getInstitutes,
  getUsers,
  getSubscriptions,
} from '../controllers/superAdmin.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('SUPER_ADMIN'));

router.get('/dashboard', superAdminDashboard);
router.get('/institutes', getInstitutes);
router.get('/users', getUsers);
router.get('/subscriptions', getSubscriptions);

export default router;
