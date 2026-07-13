import { Router } from 'express';
import {
  getDashboard,
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getFollowUps,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
  getCounsellors,
} from '../controllers/crm.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('ADMIN', 'SUPER_ADMIN'));

router.get('/dashboard', getDashboard);
router.get('/leads', getLeads);
router.get('/leads/:id', getLeadById);
router.post('/leads', createLead);
router.put('/leads/:id', updateLead);
router.delete('/leads/:id', deleteLead);

router.get('/follow-ups', getFollowUps);
router.post('/follow-ups', createFollowUp);
router.put('/follow-ups/:id', updateFollowUp);
router.delete('/follow-ups/:id', deleteFollowUp);

router.get('/counsellors', getCounsellors);

export default router;
