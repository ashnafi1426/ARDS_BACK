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
  // Separate user fields from student fields
  const userFields = {};
  const studentFields = {};
  
  // Map fields to appropriate tables
  if (data.email !== undefined) userFields.email = data.email;
  if (data.full_name !== undefined) studentFields.full_name = data.full_name;
  if (data.department !== undefined) studentFields.department = data.department;
  if (data.year_of_study !== undefined) studentFields.year_of_study = data.year_of_study;
  
  // Update users table if there are user fields to update
  if (Object.keys(userFields).length > 0) {
    const { error: userError } = await supabase
      .from('users')
      .update(userFields)
      .eq('id', userId);
    
    if (userError) throw new Error(`Failed to update user data: ${userError.message}`);
  }
  
  // Update students table if there are student fields to update
  if (Object.keys(studentFields).length > 0) {
    const { error: studentError } = await supabase
      .from('students')
      .update(studentFields)
      .eq('user_id', userId);
    
    if (studentError) throw new Error(`Failed to update student data: ${studentError.message}`);
  }
  
  // Fetch and return updated profile
  const { data: student, error } = await supabase
    .from('students')
    .select('*, users!inner(id, email, role, created_at)')
    .eq('user_id', userId)
    .single();
  
  if (error) throw new Error(`Failed to fetch updated profile: ${error.message}`);
  return student;
};

/**
 * Submit self-check and update risk score
 * @param {string} studentId - Student ID
 * @param {Object} data - Self-check data
 * @returns {Object} Self-check record with updated risk data
 */
export const submitSelfCheck = async (studentId, data) => {
  // Extract attendance and assignment data - we'll now store them in self_checks table
  const { attendance_rate, assignment_completion, ...selfCheckData } = data;
  
  // Insert self-check WITH attendance_rate and assignment_completion
  const { data: selfCheck, error } = await supabase
    .from('self_checks')
    .insert([{ 
      student_id: studentId, 
      ...selfCheckData,
      attendance_rate: attendance_rate || null,
      assignment_completion: assignment_completion || null
    }])
    .select()
    .single();
  
  if (error) throw new Error(`Failed to submit self-check: ${error.message}`);
  
  // Process self-reported attendance and create attendance records
  let attendanceRecordsCreated = 0;
  if (attendance_rate) {
    console.log('Creating attendance records for rate:', attendance_rate);
    attendanceRecordsCreated = await createAttendanceFromSelfCheck(studentId, attendance_rate);
    console.log('Attendance records created:', attendanceRecordsCreated);
  } else {
    console.log('No attendance_rate provided in data');
  }
  
  // Process self-reported assignment completion
  let assignmentRecordsUpdated = 0;
  if (assignment_completion) {
    console.log('Updating assignment submissions for completion:', assignment_completion);
    assignmentRecordsUpdated = await updateAssignmentSubmissionsFromSelfCheck(studentId, assignment_completion);
    console.log('Assignment submissions updated:', assignmentRecordsUpdated);
  } else {
    console.log('No assignment_completion provided in data');
  }
  
  // Get current student data for risk calculation
  const { data: student } = await supabase
    .from('students')
    .select('gpa, risk_level')
    .eq('student_id', studentId)
    .single();
  
  const previousRiskLevel = student?.risk_level || 'LOW';
  
  // Calculate attendance rate for risk calculation
  const attendanceData = await calculateAttendanceRate(studentId);
  
  // Map assignment completion to percentage
  const assignmentCompletionRate = mapAssignmentCompletionToRate(assignment_completion);
  
  // Calculate and update risk score
  const riskData = calculateRiskScore({
    gpa: student?.gpa || 0,
    attendanceRate: attendanceData.attendanceRate,
    assignmentCompletionRate: assignmentCompletionRate,
    latestSelfCheck: selfCheckData
  });
  
  // Update student risk score and level
  await supabase
    .from('students')
    .update({ 
      risk_score: riskData.score, 
      risk_level: riskData.level,
      updated_at: new Date().toISOString()
    })
    .eq('student_id', studentId);
  
  // Insert into risk history
  await supabase
    .from('risk_history')
    .insert([{
      student_id: studentId,
      risk_score: riskData.score,
      risk_level: riskData.level
    }]);
  
  // Create notification for student
  const notificationMessage = `Your weekly self-check has been submitted successfully. Your current risk level is ${riskData.level}. Attendance rate: ${attendanceData.attendanceRate}%. Assignment completion: ${assignmentCompletionRate}%`;
  await supabase
    .from('notifications')
    .insert([{
      student_id: studentId,
      message: notificationMessage,
      priority: riskData.level === 'HIGH' || riskData.level === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
      is_read: false
    }]);
  
  // If risk level changed to HIGH or CRITICAL, notify advisor
  if ((riskData.level === 'HIGH' || riskData.level === 'CRITICAL') && 
      previousRiskLevel !== riskData.level) {
    // Get student's advisor
    const { data: studentWithAdvisor } = await supabase
      .from('students')
      .select('advisor_id, full_name')
      .eq('student_id', studentId)
      .single();
    
    if (studentWithAdvisor?.advisor_id) {
      const advisorMessage = `Student ${studentWithAdvisor.full_name} risk level changed from ${previousRiskLevel} to ${riskData.level}. Attendance: ${attendanceData.attendanceRate}%. Immediate attention may be required.`;
      await supabase
        .from('notifications')
        .insert([{
          advisor_id: studentWithAdvisor.advisor_id,
          student_id: studentId,
          message: advisorMessage,
          priority: 'HIGH',
          is_read: false
        }]);
    }
  }
  
  return {
    selfCheck,
    riskData,
    attendanceData,
    attendanceRecordsCreated,
    assignmentRecordsUpdated,
    assignmentCompletionRate,
    previousRiskLevel,
    notificationCreated: true
  };
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

/**
 * Calculate student attendance rate
 * @param {string} studentId - Student ID
 * @returns {Object} Attendance statistics
 */
export const calculateAttendanceRate = async (studentId) => {
  // Get all attendance records for the student
  const { data: attendanceRecords, error } = await supabase
    .from('attendance')
    .select('is_present, attendance_date')
    .eq('student_id', studentId)
    .order('attendance_date', { ascending: false });
  
  if (error) throw new Error(`Failed to fetch attendance: ${error.message}`);
  
  if (!attendanceRecords || attendanceRecords.length === 0) {
    return {
      totalClasses: 0,
      attendedClasses: 0,
      attendanceRate: 100, // Default to 100% if no records
      recentAttendance: []
    };
  }
  
  const totalClasses = attendanceRecords.length;
  const attendedClasses = attendanceRecords.filter(record => record.is_present).length;
  const attendanceRate = Math.round((attendedClasses / totalClasses) * 100);
  
  // Get last 10 attendance records for trend
  const recentAttendance = attendanceRecords.slice(0, 10).map(record => ({
    date: record.attendance_date,
    present: record.is_present
  }));
  
  return {
    totalClasses,
    attendedClasses,
    attendanceRate,
    recentAttendance
  };
};

/**
 * Create attendance records based on self-reported attendance rate
 * @param {string} studentId - Student ID
 * @param {string} attendanceRate - Self-reported attendance rate (YES_100, MOSTLY_75_99, etc.)
 * @returns {number} Number of attendance records created
 */
const createAttendanceFromSelfCheck = async (studentId, attendanceRate) => {
  console.log('=== createAttendanceFromSelfCheck called ===');
  console.log('Student ID:', studentId);
  console.log('Attendance Rate:', attendanceRate);
  
  // Get student's enrolled courses
  const { data: enrollments, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('student_id', studentId);
  
  console.log('Enrollments found:', enrollments?.length || 0);
  
  if (enrollmentError || !enrollments || enrollments.length === 0) {
    console.log('No enrollments found for student or error:', enrollmentError);
    return 0;
  }
  
  // Map attendance rate to percentage and determine how many days to mark present
  let attendancePercentage = 100;
  switch (attendanceRate) {
    case 'YES_100':
      attendancePercentage = 100;
      break;
    case 'MOSTLY_75_99':
      attendancePercentage = 87; // Average of 75-99
      break;
    case 'SOME_50_74':
      attendancePercentage = 62; // Average of 50-74
      break;
    case 'RARELY_BELOW_50':
      attendancePercentage = 25; // Below 50%
      break;
    default:
      attendancePercentage = 100;
  }
  
  console.log('Attendance percentage:', attendancePercentage);
  
  // Create attendance records for the past week (5 weekdays)
  const attendanceRecords = [];
  const today = new Date();
  const daysToCreate = 5; // One week of classes (Mon-Fri)
  
  // Calculate how many days should be marked present based on percentage
  const daysPresent = Math.round((daysToCreate * attendancePercentage) / 100);
  
  console.log('Days to mark present:', daysPresent, 'out of', daysToCreate);
  
  for (let i = 0; i < daysToCreate; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    const dateString = date.toISOString().split('T')[0];
    const isPresent = i < daysPresent; // Mark first N days as present
    
    // Create attendance record for each enrolled course
    for (const enrollment of enrollments) {
      attendanceRecords.push({
        student_id: studentId,
        course_id: enrollment.course_id,
        attendance_date: dateString,
        is_present: isPresent,
        remarks: `Self-reported via weekly self-check (${attendanceRate})`
      });
    }
  }
  
  console.log('Total attendance records to insert:', attendanceRecords.length);
  
  // Insert all attendance records
  if (attendanceRecords.length > 0) {
    const { error: insertError } = await supabase
      .from('attendance')
      .insert(attendanceRecords);
    
    if (insertError) {
      console.error('Failed to insert attendance records:', insertError);
      return 0;
    }
    console.log('Successfully inserted attendance records');
  }
  
  return attendanceRecords.length;
};

/**
 * Map assignment completion selection to percentage
 * @param {string} assignmentCompletion - Assignment completion level
 * @returns {number} Completion percentage
 */
const mapAssignmentCompletionToRate = (assignmentCompletion) => {
  switch (assignmentCompletion) {
    case 'ALL_COMPLETED':
      return 100;
    case 'MOST_COMPLETED':
      return 87; // Average of 75-99%
    case 'SOME_COMPLETED':
      return 62; // Average of 50-74%
    case 'NONE_COMPLETED':
      return 25; // Below 50%
    default:
      return 75; // Default fallback
  }
};

/**
 * Update assignment submissions based on self-reported completion rate
 * @param {string} studentId - Student ID
 * @param {string} assignmentCompletion - Self-reported assignment completion (ALL_COMPLETED, MOST_COMPLETED, etc.)
 * @returns {number} Number of assignment submissions updated
 */
const updateAssignmentSubmissionsFromSelfCheck = async (studentId, assignmentCompletion) => {
  console.log('=== updateAssignmentSubmissionsFromSelfCheck called ===');
  console.log('Student ID:', studentId);
  console.log('Assignment Completion:', assignmentCompletion);
  
  // Get student's assignments through enrollments
  const { data: enrollments, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('student_id', studentId);
  
  if (enrollmentError || !enrollments || enrollments.length === 0) {
    console.log('No enrollments found for student');
    return 0;
  }
  
  console.log('Enrollments found:', enrollments.length);
  
  // Get assignments for enrolled courses
  const courseIds = enrollments.map(e => e.course_id);
  const { data: assignments, error: assignmentError } = await supabase
    .from('assignments')
    .select('assignment_id, course_id, title, due_date')
    .in('course_id', courseIds)
    .order('due_date', { ascending: false })
    .limit(10); // Get recent assignments
  
  if (assignmentError || !assignments || assignments.length === 0) {
    console.log('No assignments found for enrolled courses');
    return 0;
  }
  
  console.log('Assignments found:', assignments.length);
  
  // Map completion rate to percentage
  const completionPercentage = mapAssignmentCompletionToRate(assignmentCompletion);
  console.log('Completion percentage:', completionPercentage);
  
  // Calculate how many assignments should be marked as completed
  const totalAssignments = assignments.length;
  const completedCount = Math.round((totalAssignments * completionPercentage) / 100);
  
  console.log('Total assignments:', totalAssignments);
  console.log('Assignments to mark as completed:', completedCount);
  
  let updatedCount = 0;
  
  // Update or create assignment submissions
  for (let i = 0; i < assignments.length; i++) {
    const assignment = assignments[i];
    const isCompleted = i < completedCount;
    const status = isCompleted ? 'SUBMITTED' : 'MISSING';
    
    // Check if submission already exists
    const { data: existingSubmission } = await supabase
      .from('assignment_submissions')
      .select('submission_id')
      .eq('assignment_id', assignment.assignment_id)
      .eq('student_id', studentId)
      .single();
    
    if (existingSubmission) {
      // Update existing submission
      const { error: updateError } = await supabase
        .from('assignment_submissions')
        .update({
          status: status,
          submitted_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('submission_id', existingSubmission.submission_id);
      
      if (!updateError) {
        updatedCount++;
      }
    } else {
      // Create new submission
      const { error: insertError } = await supabase
        .from('assignment_submissions')
        .insert([{
          assignment_id: assignment.assignment_id,
          student_id: studentId,
          status: status,
          submitted_at: isCompleted ? new Date().toISOString() : null
        }]);
      
      if (!insertError) {
        updatedCount++;
      }
    }
  }
  
  console.log('Assignment submissions updated/created:', updatedCount);
  return updatedCount;
};

/**
 * Get student dashboard summary
 * @param {string} studentId - Student ID
 * @returns {Object} Complete dashboard data
 */
export const getStudentDashboardSummary = async (studentId) => {
  // Get student profile
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*, users!inner(id, email, role, created_at)')
    .eq('student_id', studentId)
    .single();
  
  if (studentError) throw new Error(`Failed to fetch student: ${studentError.message}`);
  
  // Calculate attendance
  const attendanceData = await calculateAttendanceRate(studentId);
  
  // Get assignment stats
  const { data: assignments } = await supabase
    .from('assignment_submissions')
    .select('status')
    .eq('student_id', studentId);
  
  const totalAssignments = assignments?.length || 0;
  const completedAssignments = assignments?.filter(a => a.status === 'SUBMITTED').length || 0;
  const assignmentCompletionRate = totalAssignments > 0 
    ? Math.round((completedAssignments / totalAssignments) * 100) 
    : 100;
  
  // Get course count
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('student_id', studentId);
  
  const courseCount = enrollments?.length || 0;
  
  // Get latest risk history
  const { data: latestRisk } = await supabase
    .from('risk_history')
    .select('*')
    .eq('student_id', studentId)
    .order('calculated_at', { ascending: false })
    .limit(1)
    .single();
  
  // Get per-course breakdown
  const courseBreakdown = await getPerCourseBreakdown(studentId);
  
  return {
    student,
    attendance: attendanceData,
    assignments: {
      total: totalAssignments,
      completed: completedAssignments,
      completionRate: assignmentCompletionRate
    },
    courses: {
      count: courseCount
    },
    courseBreakdown, // NEW: Per-course metrics
    latestRisk: latestRisk || null
  };
};

/**
 * Get per-course breakdown of attendance and assignments
 * @param {string} studentId - Student ID
 * @returns {Array} Array of course metrics
 */
export const getPerCourseBreakdown = async (studentId) => {
  // Get all enrolled courses with details
  const { data: enrollments, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('enrollment_id, course_id, semester, courses(course_id, course_code, course_name, department)')
    .eq('student_id', studentId);
  
  if (enrollmentError || !enrollments || enrollments.length === 0) {
    return [];
  }
  
  const courseMetrics = [];
  
  for (const enrollment of enrollments) {
    const courseId = enrollment.course_id;
    const course = enrollment.courses;
    
    // Calculate attendance for this course
    const { data: attendanceRecords } = await supabase
      .from('attendance')
      .select('is_present')
      .eq('student_id', studentId)
      .eq('course_id', courseId);
    
    const totalClasses = attendanceRecords?.length || 0;
    const attendedClasses = attendanceRecords?.filter(r => r.is_present).length || 0;
    const attendanceRate = totalClasses > 0 
      ? Math.round((attendedClasses / totalClasses) * 100) 
      : 100;
    
    // Get assignments for this course
    const { data: courseAssignments } = await supabase
      .from('assignments')
      .select('assignment_id, title, due_date')
      .eq('course_id', courseId)
      .order('due_date', { ascending: true });
    
    const totalAssignments = courseAssignments?.length || 0;
    
    // Get submissions for this course's assignments
    let completedAssignments = 0;
    let upcomingAssignments = [];
    
    if (courseAssignments && courseAssignments.length > 0) {
      const assignmentIds = courseAssignments.map(a => a.assignment_id);
      
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('assignment_id, status, submitted_at')
        .eq('student_id', studentId)
        .in('assignment_id', assignmentIds);
      
      completedAssignments = submissions?.filter(s => s.status === 'SUBMITTED').length || 0;
      
      // Find upcoming assignments (not submitted and due in future)
      const today = new Date();
      upcomingAssignments = courseAssignments
        .filter(assignment => {
          const dueDate = new Date(assignment.due_date);
          const isUpcoming = dueDate >= today;
          const submission = submissions?.find(s => s.assignment_id === assignment.assignment_id);
          const isNotSubmitted = !submission || submission.status !== 'SUBMITTED';
          return isUpcoming && isNotSubmitted;
        })
        .slice(0, 3) // Limit to 3 upcoming assignments per course
        .map(a => ({
          title: a.title,
          dueDate: a.due_date
        }));
    }
    
    const assignmentCompletionRate = totalAssignments > 0 
      ? Math.round((completedAssignments / totalAssignments) * 100) 
      : 100;
    
    // Determine risk flag for this course
    const isAtRisk = attendanceRate < 75 || assignmentCompletionRate < 75;
    
    courseMetrics.push({
      courseId: course.course_id,
      courseCode: course.course_code,
      courseName: course.course_name,
      department: course.department,
      semester: enrollment.semester,
      attendance: {
        totalClasses,
        attendedClasses,
        attendanceRate
      },
      assignments: {
        total: totalAssignments,
        completed: completedAssignments,
        completionRate: assignmentCompletionRate,
        upcoming: upcomingAssignments
      },
      isAtRisk
    });
  }
  
  // Sort by risk status (at-risk courses first) then by course name
  courseMetrics.sort((a, b) => {
    if (a.isAtRisk && !b.isAtRisk) return -1;
    if (!a.isAtRisk && b.isAtRisk) return 1;
    return a.courseName.localeCompare(b.courseName);
  });
  
  return courseMetrics;
};



/**
 * Get attendance for a specific course
 * @param {string} studentId - Student ID
 * @param {string} courseId - Course ID
 * @returns {Object} Attendance data for the course
 */
export const getCourseAttendance = async (studentId, courseId) => {
  // Verify enrollment
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('enrollment_id')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .single();
  
  if (enrollmentError || !enrollment) {
    throw new Error('Student is not enrolled in this course');
  }
  
  // Get attendance records
  const { data: attendanceRecords, error } = await supabase
    .from('attendance')
    .select('attendance_id, attendance_date, is_present, remarks, created_at')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .order('attendance_date', { ascending: false });
  
  if (error) throw new Error(`Failed to fetch attendance: ${error.message}`);
  
  const totalClasses = attendanceRecords?.length || 0;
  const attendedClasses = attendanceRecords?.filter(r => r.is_present).length || 0;
  const attendanceRate = totalClasses > 0 
    ? Math.round((attendedClasses / totalClasses) * 100) 
    : 100;
  
  return {
    totalClasses,
    attendedClasses,
    attendanceRate,
    records: attendanceRecords || []
  };
};

/**
 * Get all assignments for a student (across all courses)
 * @param {string} studentId - Student ID
 * @returns {Array} All assignments with submission status
 */
export const getAllStudentAssignments = async (studentId) => {
  try {
    console.log('=== getAllStudentAssignments called ===');
    console.log('Student ID:', studentId);
    
    // Get all courses the student is enrolled in
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', studentId);
    
    console.log('Enrollments query result:', { enrollmentError, enrollmentsCount: enrollments?.length });
    
    if (enrollmentError) {
      console.error('Enrollment error:', enrollmentError);
      throw new Error(`Failed to fetch enrollments: ${enrollmentError.message}`);
    }
    
    if (!enrollments || enrollments.length === 0) {
      console.log('No enrollments found for student');
      return [];
    }
    
    console.log('Found', enrollments.length, 'enrollments');
    const courseIds = enrollments.map(e => e.course_id);
    console.log('Course IDs:', courseIds);
    
    // Get all assignments for these courses
    const { data: assignments, error: assignmentError } = await supabase
      .from('assignments')
      .select('assignment_id, title, due_date, created_at, course_id')
      .in('course_id', courseIds)
      .order('due_date', { ascending: true });
    
    console.log('Assignments query result:', { assignmentError, assignmentsCount: assignments?.length });
    
    if (assignmentError) {
      console.error('Assignment error:', assignmentError);
      throw new Error(`Failed to fetch assignments: ${assignmentError.message}`);
    }
    
    if (!assignments || assignments.length === 0) {
      console.log('No assignments found for enrolled courses');
      return [];
    }
    
    console.log('Found', assignments.length, 'assignments');
    
    // Get submissions for these assignments
    const assignmentIds = assignments.map(a => a.assignment_id);
    const { data: submissions, error: submissionError } = await supabase
      .from('assignment_submissions')
      .select('assignment_id, status, submitted_at')
      .eq('student_id', studentId)
      .in('assignment_id', assignmentIds);
    
    console.log('Submissions query result:', { submissionError, submissionsCount: submissions?.length });
    
    // Merge assignments with submission status
    const today = new Date();
    const assignmentsWithStatus = assignments.map(assignment => {
      const submission = submissions?.find(s => s.assignment_id === assignment.assignment_id);
      const dueDate = new Date(assignment.due_date);
      const isOverdue = dueDate < today;
      
      let status = 'MISSING';
      let submitted_at = null;
      
      if (submission) {
        status = submission.status;
        submitted_at = submission.submitted_at;
      } else if (isOverdue) {
        status = 'LATE';
      }
      
      return {
        assignment_id: assignment.assignment_id,
        title: assignment.title,
        due_date: assignment.due_date,
        status,
        submitted_at,
        is_overdue: isOverdue && status !== 'SUBMITTED'
      };
    });
    
    console.log('Returning', assignmentsWithStatus.length, 'assignments with status');
    return assignmentsWithStatus;
  } catch (error) {
    console.error('Error fetching all assignments:', error);
    throw error;
  }
};

/**
 * Get assignments for a specific course
 * @param {string} studentId - Student ID
 * @param {string} courseId - Course ID
 * @returns {Array} Assignments with submission status
 */
export const getCourseAssignments = async (studentId, courseId) => {
  // Verify enrollment
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('enrollment_id')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .single();
  
  if (enrollmentError || !enrollment) {
    throw new Error('Student is not enrolled in this course');
  }
  
  // Get assignments for the course
  const { data: assignments, error: assignmentError } = await supabase
    .from('assignments')
    .select('assignment_id, title, due_date, created_at')
    .eq('course_id', courseId)
    .order('due_date', { ascending: true });
  
  if (assignmentError) {
    throw new Error(`Failed to fetch assignments: ${assignmentError.message}`);
  }
  
  if (!assignments || assignments.length === 0) {
    return [];
  }
  
  // Get submissions for these assignments
  const assignmentIds = assignments.map(a => a.assignment_id);
  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select('assignment_id, status, submitted_at')
    .eq('student_id', studentId)
    .in('assignment_id', assignmentIds);
  
  // Merge assignments with submission status
  const today = new Date();
  const assignmentsWithStatus = assignments.map(assignment => {
    const submission = submissions?.find(s => s.assignment_id === assignment.assignment_id);
    const dueDate = new Date(assignment.due_date);
    const isOverdue = dueDate < today;
    
    let status = 'MISSING';
    let submitted_at = null;
    
    if (submission) {
      status = submission.status;
      submitted_at = submission.submitted_at;
    } else if (isOverdue) {
      status = 'LATE';
    }
    
    return {
      assignment_id: assignment.assignment_id,
      title: assignment.title,
      due_date: assignment.due_date,
      status,
      submitted_at,
      is_overdue: isOverdue && status !== 'SUBMITTED'
    };
  });
  
  return assignmentsWithStatus;
};
