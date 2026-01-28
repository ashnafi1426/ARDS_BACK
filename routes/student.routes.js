import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import * as studentController from '../controllers/student.controller.js';

const router = express.Router();

// All routes require authentication and student role
router.use(authenticate);
router.use(authorize('student'));

// Student routes
router.get('/profile', studentController.getProfile);
router.put('/profile', [
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('full_name').optional().isString(),
  body('department').optional().isString(),
  body('year_of_study').optional().isInt()
], studentController.updateProfile);

router.post('/self-check', [
  body('stress_level').isInt({ min: 1, max: 5 }),
  body('study_hours').isInt({ min: 0 }),
  body('workload_difficulty').isInt({ min: 1, max: 5 }),
  body('sleep_quality').isInt({ min: 1, max: 5 }),
  body('financial_concern').isInt({ min: 1, max: 5 }),
  body('motivation_level').isInt({ min: 1, max: 5 }),
  body('comments').optional().isString()
], studentController.submitSelfCheck);

router.get('/notifications', studentController.getNotifications);
router.get('/risk-history', studentController.getRiskHistory);
router.get('/courses', studentController.getCourses);
router.get('/assignments', studentController.getAllStudentAssignments);
router.get('/dashboard-summary', studentController.getDashboardSummary);

// Per-course endpoints
router.get('/attendance/:courseId', studentController.getCourseAttendance);
router.get('/courses/:courseId/assignments', studentController.getCourseAssignments);

export default router;
