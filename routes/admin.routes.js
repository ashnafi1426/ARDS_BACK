import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import * as adminController from '../controllers/admin.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

// User Management Routes
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/reset-password', adminController.resetUserPassword);
router.get('/users/:id/activity-logs', adminController.getUserActivityLogs);
router.put('/users/:id/status', adminController.toggleUserStatus);
router.post('/users/bulk-delete', adminController.bulkDeleteUsers);
router.post('/users/bulk-update-role', adminController.bulkUpdateRole);

// Student Management Routes
router.get('/students', adminController.getAllStudents);
router.get('/students/:id', adminController.getStudentById);
router.put('/students/:id', adminController.updateStudent);
router.put('/students/:id/deactivate', adminController.deactivateStudent);
router.get('/students/:id/risk-history', adminController.getStudentRiskHistory);

// Advisor Management Routes
router.get('/advisors', adminController.getAllAdvisors);
router.post('/advisors', adminController.createAdvisor);
router.put('/advisors/:id', adminController.updateAdvisor);
router.delete('/advisors/:id', adminController.deleteAdvisor);
router.post('/advisors/:id/assign-students', adminController.assignStudentsToAdvisor);
router.get('/advisors/:id/workload', adminController.getAdvisorWorkload);

// Course Management Routes
router.get('/courses', adminController.getAllCourses);
router.post('/courses', adminController.createCourse);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

// Semester Management Routes
router.get('/semesters', adminController.getAllSemesters);
router.post('/semesters', adminController.createSemester);
router.put('/semesters/:id', adminController.updateSemester);
router.delete('/semesters/:id', adminController.deleteSemester);

// System Overview and Reports
router.get('/reports/overview', adminController.getSystemOverview);
router.get('/reports/risk-distribution', adminController.getRiskDistribution);
router.put('/config/risk-weights', adminController.updateRiskWeights);

// System Health and Logs
router.get('/system/health', adminController.getSystemHealth);
router.get('/system/logs', adminController.getSystemLogs);

// Assignment and attendance management
router.post('/assignments', adminController.createAssignment);
router.post('/attendance', adminController.createAttendanceRecords);

export default router;
