import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import * as adminController from '../controllers/admin.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/reset-password', adminController.resetUserPassword);
router.get('/reports/overview', adminController.getSystemOverview);
router.get('/reports/risk-distribution', adminController.getRiskDistribution);
router.put('/config/risk-weights', adminController.updateRiskWeights);

// Assignment and attendance management
router.post('/assignments', adminController.createAssignment);
router.post('/attendance', adminController.createAttendanceRecords);

export default router;
