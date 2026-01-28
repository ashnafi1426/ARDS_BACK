import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import * as notificationController from '../controllers/notification.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.get('/:id', notificationController.getNotificationById);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);
router.post('/', authorize('advisor', 'admin'), notificationController.createNotification);

export default router;
