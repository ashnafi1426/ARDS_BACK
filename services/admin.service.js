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

export const getUserActivityLogs = async (userId) => {
  // Get user activity logs from audit table or user activity table
  const { data, error } = await supabase
    .from('user_activity_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
    
  if (error) throw new Error(error.message);
  return data;
};

export const toggleUserStatus = async (userId, status) => {
  // Update user active status
  const { data, error } = await supabase
    .from('users')
    .update({ 
      is_active: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select('id, email, role, is_active')
    .single();
    
  if (error) throw new Error(error.message);
  
  // Log the status change
  await supabase
    .from('user_activity_logs')
    .insert([{
      user_id: userId,
      action: status ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      details: `User status changed to ${status ? 'active' : 'inactive'}`,
      created_at: new Date().toISOString()
    }]);
  
  return data;
};

export const bulkDeleteUsers = async (userIds) => {
  let deletedCount = 0;
  const errors = [];
  
  for (const userId of userIds) {
    try {
      // Delete from role-specific tables first
      await supabase.from('students').delete().eq('user_id', userId);
      await supabase.from('advisors').delete().eq('user_id', userId);
      
      // Delete from users table
      const { error } = await supabase.from('users').delete().eq('id', userId);
      
      if (error) {
        errors.push({ userId, error: error.message });
      } else {
        deletedCount++;
        
        // Log the deletion
        await supabase
          .from('user_activity_logs')
          .insert([{
            user_id: userId,
            action: 'USER_DELETED',
            details: 'User deleted by admin',
            created_at: new Date().toISOString()
          }]);
      }
    } catch (error) {
      errors.push({ userId, error: error.message });
    }
  }
  
  return { deleted: deletedCount, errors };
};

export const bulkUpdateRole = async (userIds, newRole) => {
  let updatedCount = 0;
  const errors = [];
  
  for (const userId of userIds) {
    try {
      // Get current user info
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
        
      if (fetchError) {
        errors.push({ userId, error: fetchError.message });
        continue;
      }
      
      const oldRole = currentUser.role;
      
      // Remove from old role table
      if (oldRole === 'student') {
        await supabase.from('students').delete().eq('user_id', userId);
      } else if (oldRole === 'advisor') {
        await supabase.from('advisors').delete().eq('user_id', userId);
      }
      
      // Update user role
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (updateError) {
        errors.push({ userId, error: updateError.message });
        continue;
      }
      
      // Add to new role table
      if (newRole === 'student') {
        const { error: studentError } = await supabase
          .from('students')
          .insert([{
            user_id: userId,
            full_name: 'Student User',
            department: null,
          }]);
        
        if (studentError) {
          errors.push({ userId, error: `Failed to create student record: ${studentError.message}` });
          continue;
        }
      } else if (newRole === 'advisor') {
        const { error: advisorError } = await supabase
          .from('advisors')
          .insert([{
            user_id: userId,
            full_name: 'Advisor User',
            department: null,
          }]);
        
        if (advisorError) {
          errors.push({ userId, error: `Failed to create advisor record: ${advisorError.message}` });
          continue;
        }
      }
      
      updatedCount++;
      
      // Log the role change
      await supabase
        .from('user_activity_logs')
        .insert([{
          user_id: userId,
          action: 'ROLE_CHANGED',
          details: `Role changed from ${oldRole} to ${newRole}`,
          created_at: new Date().toISOString()
        }]);
        
    } catch (error) {
      errors.push({ userId, error: error.message });
    }
  }
  
  return { updated: updatedCount, errors };
};

export const getSystemHealth = async () => {
  // Check database connection
  const dbHealth = await checkDatabaseHealth();
  
  // Check system metrics
  const systemMetrics = await getSystemMetrics();
  
  return {
    status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
    database: dbHealth,
    system: systemMetrics,
    timestamp: new Date().toISOString()
  };
};

export const getSystemLogs = async (filters = {}) => {
  const { level, startDate, endDate, limit = 100 } = filters;
  
  let query = supabase
    .from('system_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (level) {
    query = query.eq('level', level);
  }
  
  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  
  if (endDate) {
    query = query.lte('created_at', endDate);
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(error.message);
  return data;
};

// Helper functions
const checkDatabaseHealth = async () => {
  try {
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    return {
      status: error ? 'unhealthy' : 'healthy',
      message: error ? error.message : 'Database connection successful'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message
    };
  }
};

const getSystemMetrics = async () => {
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
  
  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });
  
  const { count: totalAdvisors } = await supabase
    .from('advisors')
    .select('*', { count: 'exact', head: true });
  
  return {
    totalUsers: totalUsers || 0,
    totalStudents: totalStudents || 0,
    totalAdvisors: totalAdvisors || 0,
    uptime: process.uptime()
  };
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

// ============ STUDENT MANAGEMENT ============

export const getAllStudents = async () => {
  const { data: students, error } = await supabase
    .from('students')
    .select(`
      student_id,
      full_name,
      department,
      year_of_study,
      gpa,
      risk_level,
      risk_score,
      created_at,
      updated_at,
      users!inner(id, email, role, is_active)
    `)
    .order('created_at', { ascending: false });
    
  if (error) throw new Error(`Failed to fetch students: ${error.message}`);
  
  // Transform data to include calculated fields
  const transformedStudents = students.map(student => ({
    id: student.student_id,
    studentId: student.student_id,
    name: student.full_name,
    email: student.users.email,
    department: student.department,
    yearOfStudy: student.year_of_study,
    gpa: student.gpa,
    riskLevel: student.risk_level,
    riskScore: student.risk_score,
    isActive: student.users.is_active,
    createdAt: student.created_at,
    updatedAt: student.updated_at
  }));
  
  return transformedStudents;
};

export const getStudentById = async (studentId) => {
  const { data: student, error } = await supabase
    .from('students')
    .select(`
      *,
      users!inner(id, email, role, is_active, created_at),
      advisors(advisor_id, full_name)
    `)
    .eq('student_id', studentId)
    .single();
    
  if (error) throw new Error(`Failed to fetch student: ${error.message}`);
  return student;
};

export const updateStudent = async (studentId, studentData) => {
  const { email, ...studentFields } = studentData;
  
  // Update user email if provided
  if (email) {
    const { data: student } = await supabase
      .from('students')
      .select('user_id')
      .eq('student_id', studentId)
      .single();
      
    if (student) {
      const { error: userError } = await supabase
        .from('users')
        .update({ email })
        .eq('id', student.user_id);
        
      if (userError) throw new Error(`Failed to update user email: ${userError.message}`);
    }
  }
  
  // Update student fields
  const { data: updatedStudent, error } = await supabase
    .from('students')
    .update({
      ...studentFields,
      updated_at: new Date().toISOString()
    })
    .eq('student_id', studentId)
    .select(`
      *,
      users!inner(id, email, role, is_active)
    `)
    .single();
    
  if (error) throw new Error(`Failed to update student: ${error.message}`);
  return updatedStudent;
};

export const deactivateStudent = async (studentId) => {
  // Get student's user_id
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('user_id')
    .eq('student_id', studentId)
    .single();
    
  if (studentError || !student) {
    throw new Error('Student not found');
  }
  
  // Deactivate user account
  const { error: userError } = await supabase
    .from('users')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', student.user_id);
    
  if (userError) throw new Error(`Failed to deactivate user: ${userError.message}`);
  
  // Log the deactivation
  await supabase
    .from('user_activity_logs')
    .insert([{
      user_id: student.user_id,
      action: 'STUDENT_DEACTIVATED',
      details: 'Student account deactivated by admin',
      created_at: new Date().toISOString()
    }]);
  
  return { success: true, message: 'Student deactivated successfully' };
};

export const getStudentRiskHistory = async (studentId) => {
  const { data: history, error } = await supabase
    .from('risk_history')
    .select('*')
    .eq('student_id', studentId)
    .order('calculated_at', { ascending: false });
    
  if (error) throw new Error(`Failed to fetch risk history: ${error.message}`);
  return history;
};

// ============ ADVISOR MANAGEMENT ============

export const getAllAdvisors = async () => {
  const { data: advisors, error } = await supabase
    .from('advisors')
    .select(`
      advisor_id,
      full_name,
      department,
      created_at,
      updated_at,
      users!inner(id, email, role, is_active)
    `)
    .order('created_at', { ascending: false });
    
  if (error) throw new Error(`Failed to fetch advisors: ${error.message}`);
  
  // Get student counts for each advisor
  const advisorsWithCounts = await Promise.all(
    advisors.map(async (advisor) => {
      const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('advisor_id', advisor.advisor_id);
        
      return {
        ...advisor,
        studentCount: count || 0
      };
    })
  );
  
  return advisorsWithCounts;
};

export const createAdvisor = async (advisorData) => {
  const { email, password, full_name, department } = advisorData;
  
  // Validate required fields
  if (!email || !password || !full_name) {
    throw new Error('Email, password, and full_name are required');
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
    .insert([{ email, password: hashedPassword, role: 'advisor' }])
    .select('id, email, role, created_at')
    .single();
  
  if (userError) throw new Error(`Failed to create user: ${userError.message}`);
  
  // Create advisor record
  const { data: advisor, error: advisorError } = await supabase
    .from('advisors')
    .insert([{
      user_id: user.id,
      full_name,
      department: department || null
    }])
    .select()
    .single();
  
  if (advisorError) {
    // Rollback user creation
    await supabase.from('users').delete().eq('id', user.id);
    throw new Error(`Failed to create advisor record: ${advisorError.message}`);
  }
  
  return { ...advisor, user };
};

export const updateAdvisor = async (advisorId, advisorData) => {
  const { email, full_name, department } = advisorData;
  
  // Update user email if provided
  if (email) {
    const { data: advisor } = await supabase
      .from('advisors')
      .select('user_id')
      .eq('advisor_id', advisorId)
      .single();
      
    if (advisor) {
      const { error: userError } = await supabase
        .from('users')
        .update({ email })
        .eq('id', advisor.user_id);
        
      if (userError) throw new Error(`Failed to update user email: ${userError.message}`);
    }
  }
  
  // Update advisor fields
  const updateFields = {};
  if (full_name !== undefined) updateFields.full_name = full_name;
  if (department !== undefined) updateFields.department = department;
  
  const { data: updatedAdvisor, error } = await supabase
    .from('advisors')
    .update(updateFields)
    .eq('advisor_id', advisorId)
    .select(`
      *,
      users!inner(id, email, role, is_active)
    `)
    .single();
    
  if (error) throw new Error(`Failed to update advisor: ${error.message}`);
  return updatedAdvisor;
};

export const deleteAdvisor = async (advisorId) => {
  // Check if advisor has assigned students
  const { data: assignedStudents } = await supabase
    .from('students')
    .select('student_id')
    .eq('advisor_id', advisorId);
  
  if (assignedStudents && assignedStudents.length > 0) {
    // Reassign students to null (unassigned) or handle reassignment logic
    await supabase
      .from('students')
      .update({ advisor_id: null })
      .eq('advisor_id', advisorId);
  }
  
  // Get advisor's user_id before deletion
  const { data: advisor } = await supabase
    .from('advisors')
    .select('user_id')
    .eq('advisor_id', advisorId)
    .single();
  
  // Delete advisor record
  const { error: advisorError } = await supabase
    .from('advisors')
    .delete()
    .eq('advisor_id', advisorId);
    
  if (advisorError) throw new Error(`Failed to delete advisor: ${advisorError.message}`);
  
  // Delete user record
  if (advisor) {
    await supabase
      .from('users')
      .delete()
      .eq('id', advisor.user_id);
  }
  
  return { 
    success: true, 
    message: 'Advisor deleted successfully',
    reassignedStudents: assignedStudents?.length || 0
  };
};

export const assignStudentsToAdvisor = async (advisorId, studentIds) => {
  // Validate advisor exists
  const { data: advisor, error: advisorError } = await supabase
    .from('advisors')
    .select('advisor_id')
    .eq('advisor_id', advisorId)
    .single();
    
  if (advisorError || !advisor) {
    throw new Error('Advisor not found');
  }
  
  // Validate all student IDs exist
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
  
  // Update students to assign them to the advisor
  const { error: updateError } = await supabase
    .from('students')
    .update({ 
      advisor_id: advisorId,
      updated_at: new Date().toISOString()
    })
    .in('student_id', studentIds);
    
  if (updateError) throw new Error(`Failed to assign students: ${updateError.message}`);
  
  return {
    assigned: studentIds.length,
    studentIds
  };
};

export const getAdvisorWorkload = async (advisorId) => {
  // Get assigned students
  const { data: students, error } = await supabase
    .from('students')
    .select('student_id, full_name, risk_level, gpa')
    .eq('advisor_id', advisorId)
    .order('risk_level', { ascending: false });
    
  if (error) throw new Error(`Failed to fetch advisor workload: ${error.message}`);
  
  // Calculate workload statistics
  const totalStudents = students.length;
  const atRiskStudents = students.filter(s => 
    s.risk_level === 'HIGH' || s.risk_level === 'CRITICAL'
  ).length;
  
  const riskDistribution = students.reduce((acc, student) => {
    acc[student.risk_level] = (acc[student.risk_level] || 0) + 1;
    return acc;
  }, {});
  
  return {
    advisorId,
    totalStudents,
    atRiskStudents,
    riskDistribution,
    students
  };
};

// ============ COURSE MANAGEMENT ============

export const getAllCourses = async () => {
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .order('course_code', { ascending: true });
    
  if (error) throw new Error(`Failed to fetch courses: ${error.message}`);
  return courses;
};

export const createCourse = async (courseData) => {
  const { course_code, course_name, department, credits } = courseData;
  
  // Validate required fields
  if (!course_code || !course_name) {
    throw new Error('Course code and name are required');
  }
  
  // Check if course code already exists
  const { data: existingCourse } = await supabase
    .from('courses')
    .select('course_id')
    .eq('course_code', course_code)
    .single();
  
  if (existingCourse) {
    throw new Error('Course with this code already exists');
  }
  
  const { data: course, error } = await supabase
    .from('courses')
    .insert([{
      course_code,
      course_name,
      department: department || null,
      credits: credits || 3
    }])
    .select()
    .single();
    
  if (error) throw new Error(`Failed to create course: ${error.message}`);
  return course;
};

export const updateCourse = async (courseId, courseData) => {
  const { data: course, error } = await supabase
    .from('courses')
    .update(courseData)
    .eq('course_id', courseId)
    .select()
    .single();
    
  if (error) throw new Error(`Failed to update course: ${error.message}`);
  return course;
};

export const deleteCourse = async (courseId) => {
  // Check if course has enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('enrollment_id')
    .eq('course_id', courseId);
  
  if (enrollments && enrollments.length > 0) {
    throw new Error('Cannot delete course with existing enrollments');
  }
  
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('course_id', courseId);
    
  if (error) throw new Error(`Failed to delete course: ${error.message}`);
  return { success: true };
};

// ============ SEMESTER MANAGEMENT ============

export const getAllSemesters = async () => {
  const { data: semesters, error } = await supabase
    .from('semesters')
    .select('*')
    .order('start_date', { ascending: false });
    
  if (error) throw new Error(`Failed to fetch semesters: ${error.message}`);
  return semesters;
};

export const createSemester = async (semesterData) => {
  const { semester_name, start_date, end_date } = semesterData;
  
  // Validate required fields
  if (!semester_name || !start_date || !end_date) {
    throw new Error('Semester name, start date, and end date are required');
  }
  
  // Validate dates
  if (new Date(start_date) >= new Date(end_date)) {
    throw new Error('Start date must be before end date');
  }
  
  const { data: semester, error } = await supabase
    .from('semesters')
    .insert([semesterData])
    .select()
    .single();
    
  if (error) throw new Error(`Failed to create semester: ${error.message}`);
  return semester;
};

export const updateSemester = async (semesterId, semesterData) => {
  const { data: semester, error } = await supabase
    .from('semesters')
    .update(semesterData)
    .eq('semester_id', semesterId)
    .select()
    .single();
    
  if (error) throw new Error(`Failed to update semester: ${error.message}`);
  return semester;
};

export const deleteSemester = async (semesterId) => {
  // Check if semester has enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('enrollment_id')
    .eq('semester', semesterId);
  
  if (enrollments && enrollments.length > 0) {
    throw new Error('Cannot delete semester with existing enrollments');
  }
  
  const { error } = await supabase
    .from('semesters')
    .delete()
    .eq('semester_id', semesterId);
    
  if (error) throw new Error(`Failed to delete semester: ${error.message}`);
  return { success: true };
};
