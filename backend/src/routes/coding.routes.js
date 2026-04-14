import { Router } from 'express';
import {
  getBatches,
  getQuestions,
  getQuestionById,
  getTests,
  getStudentTests,
  getTestById,
  runCodeHandler,
  submitCodeHandler,
  getAnalytics,
  getAdminAnalytics,
  generateCodingQuestionHandler,
  createCodingQuestionHandler,
  updateCodingQuestionHandler,
  deleteCodingQuestionHandler,
  getAdminQuestionsHandler,
  getSubmissionsHandler,
  getHintHandler,
  getCodingTestAnalytics,
  createCodingTestHandler,
  getAdminCodingTestsHandler,
  deleteCodingTestHandler,
  getStudentCodingAnalytics,
  getCodingHistory,
  getCodingResultById,
  getCodingInsights,
} from '../controllers/coding.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/batches', getBatches);
router.get('/questions', getQuestions);
router.get('/question/:id', getQuestionById);
router.get('/tests', getTests);
router.get('/student/tests', getStudentTests);
router.get('/test/:id', getTestById);
router.get('/test/:testId/analytics', requireRole('ADMIN', 'SUPER_ADMIN'), getCodingTestAnalytics);
router.post('/run', runCodeHandler);
router.post('/submit', submitCodeHandler);
router.get('/submissions/:questionId', getSubmissionsHandler);
router.post('/hint', getHintHandler);
router.get('/analytics', getAnalytics);
router.get('/admin/analytics', requireRole('ADMIN', 'SUPER_ADMIN'), getAdminAnalytics);
router.get('/student/analytics', getStudentCodingAnalytics);
router.get('/student/result/:id', getCodingResultById);
router.get('/student/history', getCodingHistory);
router.get('/student/insights/:batchId', getCodingInsights);

router.post('/admin/coding/generate', requireRole('ADMIN', 'SUPER_ADMIN'), generateCodingQuestionHandler);
router.get('/admin/coding/questions', requireRole('ADMIN', 'SUPER_ADMIN'), getAdminQuestionsHandler);
router.post('/admin/coding/question', requireRole('ADMIN', 'SUPER_ADMIN'), createCodingQuestionHandler);
router.put('/admin/coding/question/:id', requireRole('ADMIN', 'SUPER_ADMIN'), updateCodingQuestionHandler);
router.delete('/admin/coding/question/:id', requireRole('ADMIN', 'SUPER_ADMIN'), deleteCodingQuestionHandler);

router.post('/admin/coding/test', requireRole('ADMIN', 'SUPER_ADMIN'), createCodingTestHandler);
router.get('/admin/coding/tests', requireRole('ADMIN', 'SUPER_ADMIN'), getAdminCodingTestsHandler);
router.delete('/admin/coding/test/:id', requireRole('ADMIN', 'SUPER_ADMIN'), deleteCodingTestHandler);

export default router;