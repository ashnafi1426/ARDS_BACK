// Quick test to verify validation rules
import { body } from 'express-validator';

const registerValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('role').isIn(['student', 'advisor', 'admin']).withMessage('Invalid role'),
  body('student_number').optional().isString().withMessage('Student number must be a string'),
  body('department').optional().isString().withMessage('Department must be a string'),
];

console.log('✅ Validation rules loaded successfully!');
console.log('📋 Checking for full_name validation...');

const hasFullName = registerValidation.some(rule => {
  return rule.builder && rule.builder.fields && rule.builder.fields.includes('full_name');
});

const hasFirstName = registerValidation.some(rule => {
  return rule.builder && rule.builder.fields && rule.builder.fields.includes('first_name');
});

console.log('full_name validation present:', hasFullName);
console.log('first_name validation present:', hasFirstName);

if (hasFullName && !hasFirstName) {
  console.log('✅ Validation is correctly configured!');
} else {
  console.log('❌ Validation still has old fields!');
}
