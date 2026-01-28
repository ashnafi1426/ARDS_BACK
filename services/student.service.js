import { supabase } from '../config/supabase.js';
import { calculateRiskScore } from '../utils/riskCalculator.js';

/**
 * Get student profile by user ID
 * @param {string} userId - User ID
 * @returns {Object} Student profile data
 */
export const getStudentProfile = async (userId) => {
  const { data: student, error } = await supabase
    .from('students')
    .select('*, users!inner(id, email, role, created_at)')
    .eq('user_id', userId)
    .single();
  
  if (error) throw new Error(`Failed to fetch student profile: ${error.message}`);
  return student;
};

/**
 * Update student profile
 * @param {string} userId - User ID
 * @param {Object} data - Profile data to update
 * @returns {Object} Updated student data
 */
export const updateStudentProfile = async (userId, data) => {
  const { data: student, error } = await supabase
    .from('students')
    .update(data)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) throw new Error(`Failed to update profile: ${error.message}`);
  return student;
};

/**
 * Submit self-check and update risk score
 * @param {string} studentId - Student ID
 * @param {Object} data - Self-check data
 * @returns {Object} Self-check record
 */
export const submitSelfCheck = async (studentId, data) => {
  // Insert self-check
  const { data: selfCheck, error } = await supabase
    .from('self_checks')
    .insert([{ student_id: studentId, ...data }])
    .select()
    .single();
  
  if (error) throw new Error(`Failed to submit self-check: ${error.message}`);
  
  // Calculate and update risk score
  const { data: student } = await supabase
    .from('students')
    .select('gpa')
    .eq('student_id', studentId)
    .single();
  
  const riskData = calculateRiskScore({
    gpa: student?.gpa || 0,
    attendanceRate: 80, // TODO: Calculate from attendance table
    assignmentCompletionRate: 75, // TODO: Calculate from assignments
    latestSelfCheck: data
  });
  
  await supabase
    .from('students')
    .update({ risk_score: riskData.score, risk_level: riskData.level })
    .eq('student_id', studentId);
  
  // Insert into risk history
  await supabase
    .from('risk_history')
    .insert([{
      student_id: studentId,
      risk_score: riskData.score,
      risk_level: riskData.level
    }]);
  
  return selfCheck;
};

/**
 * Get student notifications
 * @param {string} studentId - Student ID
 * @returns {Array} Notifications
 */
export const getStudentNotifications = async (studentId) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  
  if (error) throw new Error(`Failed to fetch notifications: ${error.message}`);
  return data;
};

/**
 * Get student risk history
 * @param {string} studentId - Student ID
 * @returns {Array} Risk history records
 */
export const getStudentRiskHistory = async (studentId) => {
  const { data, error } = await supabase
    .from('risk_history')
    .select('*')
    .eq('student_id', studentId)
    .order('calculated_at', { ascending: false });
  
  if (error) throw new Error(`Failed to fetch risk history: ${error.message}`);
  return data;
};

/**
 * Get student courses
 * @param {string} studentId - Student ID
 * @returns {Array} Enrolled courses
 */
export const getStudentCourses = async (studentId) => {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, courses(*)')
    .eq('student_id', studentId);
  
  if (error) throw new Error(`Failed to fetch courses: ${error.message}`);
  return data;
};

/**
 * Get student assignments
 * @param {string} studentId - Student ID
 * @returns {Array} Assignments with submission status
 */
export const getStudentAssignments = async (studentId) => {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select('*, assignments(*, courses(*))')
    .eq('student_id', studentId);
  
  if (error) throw new Error(`Failed to fetch assignments: ${error.message}`);
  return data;
};
