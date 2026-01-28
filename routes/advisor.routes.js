import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import * as advisorController from '../controllers/advisor.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('advisor'));

router.get('/profile', advisorController.getProfile);
router.get('/students', advisorController.getAssignedStudents);
router.get('/students/at-risk', advisorController.getAtRiskStudents);
router.get('/students/:id', advisorController.getStudentDetails);
router.post('/interventions', advisorController.createIntervention);
router.get('/interventions', advisorController.getInterventions);

export default router;
