import { validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import * as studentService from '../services/student.service.js';

/**
 * Get student profile
 */
export const getProfile = async (req, res) => {
  try {
    const student = await studentService.getStudentProfile(req.user.id);
    res.status(200).json({ 
      status: 'success',
      data: student 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

/**
 * Update student profile
 */
export const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'fail', errors: errors.array() });
  }
  
  try {
    const student = await studentService.updateStudentProfile(req.user.id, req.body);
    res.status(200).json({ 
      status: 'success',
      data: student 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

/**
 * Submit self-check
 */
export const submitSelfCheck = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'fail', errors: errors.array() });
  }
  
  try {
    console.log('=== SUBMIT SELF-CHECK CONTROLLER ===');
    console.log('Request body received:', JSON.stringify(req.body, null, 2));
    console.log('Has attendance_rate?', 'attendance_rate' in req.body);
    console.log('Has assignment_completion?', 'assignment_completion' in req.body);
    
    // Get student ID from user
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('student_id')
      .eq('user_id', req.user.id)
      .single();
    
    if (studentError || !student) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Student record not found' 
      });
    }
    
    console.log('Student ID:', student.student_id);
    
    const selfCheck = await studentService.submitSelfCheck(student.student_id, req.body);
    res.status(201).json({ 
      status: 'success',
      message: 'Self-check submitted successfully',
      data: selfCheck 
    });
  } catch (error) {
    console.error('Submit self-check error:', error);
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

/**
 * Get notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('student_id')
      .eq('user_id', req.user.id)
      .single();
    
    if (studentError || !student) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Student record not found' 
      });
    }
    
    const notifications = await studentService.getStudentNotifications(student.student_id);
    res.status(200).json({ 
      status: 'success',
      data: { notifications } 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

/**
 * Get risk history
 */
export const getRiskHistory = async (req, res) => {
  try {
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('student_id')
      .eq('user_id', req.user.id)
      .single();
    
    if (studentError || !student) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Student record not found' 
      });
    }
    
    const history = await studentService.getStudentRiskHistory(student.student_id);
    res.status(200).json({ 
      status: 'success',
      data: history 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

/**
 * Get courses
 */
export const getCourses = async (req, res) => {
  try {
    const { data: student } = await supabase
      .from('students')
      .select('student_id')
      .eq('user_id', req.user.id)
      .single();
    
    const courses = await studentService.getStudentCourses(student.student_id);
    res.status(200).json({ courses });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Get assignments
 */
export const getAssignments = async (req, res) => {
  try {
    const { data: student } = await supabase
      .from('students')
      .select('student_id')
      .eq('user_id', req.user.id)
      .single();
    
    const assignments = await studentService.getStudentAssignments(student.student_id);
    res.status(200).json({ assignments });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Get dashboard summary with all stats
 */
export const getDashboardSummary = async (req, res) => {
  try {
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('student_id')
      .eq('user_id', req.user.id)
      .single();
    
    if (studentError || !student) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Student record not found' 
      });
    }
    
    const summary = await studentService.getStudentDashboardSummary(student.student_id);
    res.status(200).json({ 
      status: 'success',
      data: summary 
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

/**
 * Get attendance for a specific course
 */
export const getCourseAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('student_id')
      .eq('user_id', req.user.id)
      .single();
    
    if (studentError || !student) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Student record not found' 
      });
    }
    
    const attendance = await studentService.getCourseAttendance(student.student_id, courseId);
    res.status(200).json({ 
      status: 'success',
      data: attendance 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

/**
 * Get all student assignments (across all courses)
 */
export const getAllStudentAssignments = async (req, res) => {
  try {
    console.log('=== getAllStudentAssignments controller called ===');
    console.log('User ID:', req.user.id);
    
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('student_id')
      .eq('user_id', req.user.id)
      .single();
    
    console.log('Student lookup result:', { studentError, studentId: student?.student_id });
    
    if (studentError || !student) {
      console.error('Student not found:', studentError);
      return res.status(404).json({ 
        status: 'error',
        message: 'Student record not found' 
      });
    }
    
    console.log('Calling getAllStudentAssignments service for student:', student.student_id);
    const assignments = await studentService.getAllStudentAssignments(student.student_id);
    
    console.log('Service returned', assignments.length, 'assignments');
    res.status(200).json({ 
      status: 'success',
      assignments: assignments 
    });
  } catch (error) {
    console.error('getAllStudentAssignments error:', error);
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

/**
 * Get assignments for a specific course
 */
export const getCourseAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('student_id')
      .eq('user_id', req.user.id)
      .single();
    
    if (studentError || !student) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Student record not found' 
      });
    }
    
    const assignments = await studentService.getCourseAssignments(student.student_id, courseId);
    res.status(200).json({ 
      status: 'success',
      data: assignments 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};
