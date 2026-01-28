import express from 'express';
import { body } from 'express-validator';
import { login, register } from '../controllers/auth.controller.js';

const router = express.Router();

// Validation rules for registration
const registerValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('role').isIn(['student', 'advisor', 'admin']).withMessage('Invalid role'),
  body('student_number').optional().isString().withMessage('Student number must be a string'),
  body('department').optional().isString().withMessage('Department must be a string'),
];

// Validation rules for login
const loginValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Route for user registration
router.post('/register', registerValidation, register);

// Route for user login
router.post('/login', loginValidation, login);

export default router;