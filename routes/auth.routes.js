import express from 'express';
import { body } from 'express-validator';
import { login, register } from '../controllers/auth.controller.js';

const router = express.Router();

// Validation rules for registration
const registerValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('role').isIn(['student', 'advisor', 'admin']).withMessage('Invalid role'),
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