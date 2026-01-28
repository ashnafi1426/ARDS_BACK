import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import * as assignmentController from '../controllers/assignment.controller.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/zip',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  }
});

// Student routes
router.post('/submit', authenticate, authorize('student'), upload.single('file'), assignmentController.submitAssignment);
router.get('/submission/:assignmentId', authenticate, authorize('student'), assignmentController.getSubmission);
router.delete('/submission/:submissionId', authenticate, authorize('student'), assignmentController.deleteSubmission);
router.get('/my-submissions', authenticate, authorize('student'), assignmentController.getStudentSubmissions);

// Admin/Instructor routes
router.get('/submissions/:assignmentId', authenticate, authorize('admin', 'advisor'), assignmentController.getAssignmentSubmissions);

export default router;
