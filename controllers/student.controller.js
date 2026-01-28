import { validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import * as studentService from '../services/student.service.js';

/**
 * Get student profile
 */
export const getProfile = async (req, res) => {
  try {
    const student = await studentService.getStudentProfile(req.user.id);
    res.status(200).json({ student });
  } catch (error) {
    res.status(400).json({ message: error.message });
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
    res.status(200).json({ student });
  } catch (error) {
    res.status(400).json({ message: error.message });
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
    // Get student ID from user
    const { data: student } = await supabase
      .from('students')
      .select('student_id')
      .eq('user_id', req.user.id)
      .single();
    
    const selfCheck = await studentService.submitSelfCheck(student.student_id, req.body);
    res.status(201).json({ selfCheck });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Get notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const { data: student } = await supabase
      .from('students')
      .select('student_id')
      .eq('user_id', req.user.id)
      .single();
    
    const notifications = await studentService.getStudentNotifications(student.student_id);
    res.status(200).json({ notifications });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Get risk history
 */
export const getRiskHistory = async (req, res) => {
  try {
    const { data: student } = await supabase
      .from('students')
      .select('student_id')
      .eq('user_id', req.user.id)
      .single();
    
    const history = await studentService.getStudentRiskHistory(student.student_id);
    res.status(200).json({ history });
  } catch (error) {
    res.status(400).json({ message: error.message });
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
