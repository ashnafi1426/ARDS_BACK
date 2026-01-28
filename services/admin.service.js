import { supabase } from '../config/supabase.js';
import bcrypt from 'bcrypt';

export const getAllUsers = async () => {
  // Get users with their role-specific information
  const { data: users, error } = await supabase
    .from('users')
    .select(`
      id, 
      email, 
      role, 
      created_at,
      students(full_name, department),
      advisors(full_name, department)
    `);
    
  if (error) throw new Error(error.message);
  
  // Transform the data to include full_name from the appropriate table
  const transformedUsers = users.map(user => ({
    id: user.id,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    full_name: user.students?.[0]?.full_name || user.advisors?.[0]?.full_name || 'N/A',
    department: user.students?.[0]?.department || user.advisors?.[0]?.department || null
  }));
  
  return transformedUsers;
};

export const createUser = async (userData) => {
  const { email, password, role, full_name, department } = userData;
  // Validate required fields
  if (!email || !password || !role) {
    throw new Error('Email, password, and role are required');
  }
  
  if (!['student', 'advisor', 'admin'].includes(role)) {
    throw new Error('Invalid role. Must be student, advisor, or admin');
  }
  
  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();
  
  if (existingUser) {
    throw new Error('User with this email already exists');
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create user
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert([{ email, password: hashedPassword, role }])
    .select('id, email, role, created_at')
    .single();
  
  if (userError) throw new Error(userError.message);
  
  // Create role-specific record
  if (role === 'student') {
    const { error: studentError } = await supabase
      .from('students')
      .insert([{
        user_id: user.id,
        full_name: full_name || 'Student User',
        department: department || null,
      }]);
    
    if (studentError) {
      // Rollback user creation
      await supabase.from('users').delete().eq('id', user.id);
      throw new Error(`Failed to create student record: ${studentError.message}`);
    }
  } else if (role === 'advisor') {
    const { error: advisorError } = await supabase
      .from('advisors')
      .insert([{
        user_id: user.id,
        full_name: full_name || 'Advisor User',
        department: department || null,
      }]);
    
    if (advisorError) {
      // Rollback user creation
      await supabase.from('users').delete().eq('id', user.id);
      throw new Error(`Failed to create advisor record: ${advisorError.message}`);
    }
  }
  
  return user;
};

export const updateUser = async (userId, userData) => {
  const { full_name, department, role, ...userFields } = userData;
  
  // If password is being updated, hash it
  if (userFields.password) {
    userFields.password = await bcrypt.hash(userFields.password, 10);
  }
  
  // Update user table
  const { data: user, error: userError } = await supabase
    .from('users')
    .update(userFields)
    .eq('id', userId)
    .select('id, email, role, created_at')
    .single();
    
  if (userError) throw new Error(userError.message);
  
  // Update role-specific table if full_name or department is provided
  if (full_name || department) {
    if (user.role === 'student') {
      const { error: studentError } = await supabase
        .from('students')
        .update({ 
          ...(full_name && { full_name }),
          ...(department && { department })
        })
        .eq('user_id', userId);
        
      if (studentError) {
        console.warn('Failed to update student record:', studentError.message);
      }
    } else if (user.role === 'advisor') {
      const { error: advisorError } = await supabase
        .from('advisors')
        .update({ 
          ...(full_name && { full_name }),
          ...(department && { department })
        })
        .eq('user_id', userId);
        
      if (advisorError) {
        console.warn('Failed to update advisor record:', advisorError.message);
      }
    }
  }
  
  return user;
};

export const deleteUser = async (userId) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);
  if (error) throw new Error(error.message);
  return { success: true };
};

export const resetUserPassword = async (userId) => {
  // Generate a new temporary password
  const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);
  
  // Update user password
  const { data, error } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('id', userId)
    .select('id, email')
    .single();
    
  if (error) throw new Error(error.message);
  
  // In a real application, you would send this password via email
  // For now, we'll return it in the response (not recommended for production)
  return { 
    success: true, 
    tempPassword: tempPassword,
    message: `Temporary password generated for user ${data.email}` 
  };
};

export const getSystemOverview = async () => {
  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });
  
  const { count: atRiskStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .in('risk_level', ['HIGH', 'CRITICAL']);
  
  return { totalStudents, atRiskStudents };
};

export const getRiskDistribution = async () => {
  const { data, error } = await supabase
    .from('students')
    .select('risk_level');
  
  if (error) throw new Error(error.message);
  
  const distribution = data.reduce((acc, student) => {
    acc[student.risk_level] = (acc[student.risk_level] || 0) + 1;
    return acc;
  }, {});
  
  return distribution;
};

export const updateRiskWeights = async (weights) => {
  // Store in a configuration table or return success
  return { success: true, weights };
};


/**
 * Create a new assignment for a course
 * @param {Object} assignmentData - Assignment data
 * @returns {Object} Created assignment
 */
export const createAssignment = async (assignmentData) => {
  const { course_id, title, due_date } = assignmentData;
  
  // Validate required fields
  if (!course_id || !title || !due_date) {
    throw new Error('course_id, title, and due_date are required');
  }
  
  // Verify course exists
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('course_id')
    .eq('course_id', course_id)
    .single();
  
  if (courseError || !course) {
    throw new Error('Course not found');
  }
  
  // Create assignment
  const { data: assignment, error } = await supabase
    .from('assignments')
    .insert([{ course_id, title, due_date }])
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create assignment: ${error.message}`);
  
  return assignment;
};

/**
 * Bulk create attendance records
 * @param {Object} attendanceData - Attendance data
 * @returns {Object} Created attendance records
 */
export const createAttendanceRecords = async (attendanceData) => {
  const { course_id, attendance_date, records } = attendanceData;
  
  // Validate required fields
  if (!course_id || !attendance_date || !records || !Array.isArray(records)) {
    throw new Error('course_id, attendance_date, and records array are required');
  }
  
  if (records.length === 0) {
    throw new Error('Records array cannot be empty');
  }
  
  // Verify course exists
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('course_id')
    .eq('course_id', course_id)
    .single();
  
  if (courseError || !course) {
    throw new Error('Course not found');
  }
  
  // Prepare attendance records
  const attendanceRecords = records.map(record => ({
    student_id: record.student_id,
    course_id: course_id,
    attendance_date: attendance_date,
    is_present: record.is_present !== undefined ? record.is_present : false,
    remarks: record.remarks || ''
  }));
  
  // Validate all student IDs exist
  const studentIds = records.map(r => r.student_id);
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('student_id')
    .in('student_id', studentIds);
  
  if (studentError) {
    throw new Error('Error validating students');
  }
  
  if (students.length !== studentIds.length) {
    throw new Error('One or more student IDs are invalid');
  }
  
  // Insert attendance records
  const { data: createdRecords, error } = await supabase
    .from('attendance')
    .insert(attendanceRecords)
    .select();
  
  if (error) throw new Error(`Failed to create attendance records: ${error.message}`);
  
  return {
    created: createdRecords.length,
    records: createdRecords
  };
};
