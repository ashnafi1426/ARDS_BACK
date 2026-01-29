import * as adminService from '../services/admin.service.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await adminService.getAllUsers();
    res.status(200).json({ users });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    console.log('🔍 Backend - Creating user with data:', req.body);
    
    const { email, password, role, full_name, department } = req.body;
    
    // Validate required fields
    if (!email || !password || !role) {
      console.log('❌ Backend - Missing required fields');
      return res.status(400).json({ 
        message: 'Email, password, and role are required' 
      });
    }
    
    console.log('🚀 Backend - Calling adminService.createUser...');
    const user = await adminService.createUser(req.body);
    console.log('✅ Backend - User created successfully:', user);
    res.status(201).json({ user });
  } catch (error) {
    console.error('❌ Backend - Error creating user:', error);
    res.status(400).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await adminService.updateUser(req.params.id, req.body);
    res.status(200).json({ user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await adminService.deleteUser(req.params.id);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const result = await adminService.resetUserPassword(req.params.id);
    res.status(200).json({ 
      message: 'Password reset successfully',
      ...result 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getUserActivityLogs = async (req, res) => {
  try {
    const logs = await adminService.getUserActivityLogs(req.params.id);
    res.status(200).json({ logs });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await adminService.toggleUserStatus(req.params.id, status);
    res.status(200).json({ 
      message: `User ${status ? 'activated' : 'deactivated'} successfully`,
      user 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const bulkDeleteUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ 
        message: 'User IDs array is required' 
      });
    }
    
    const result = await adminService.bulkDeleteUsers(userIds);
    res.status(200).json({ 
      message: `${result.deleted} users deleted successfully`,
      ...result 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const bulkUpdateRole = async (req, res) => {
  try {
    const { userIds, role } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ 
        message: 'User IDs array is required' 
      });
    }
    
    if (!['student', 'advisor', 'admin'].includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role. Must be student, advisor, or admin' 
      });
    }
    
    const result = await adminService.bulkUpdateRole(userIds, role);
    res.status(200).json({ 
      message: `${result.updated} users updated to ${role} role successfully`,
      ...result 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getSystemOverview = async (req, res) => {
  try {
    const overview = await adminService.getSystemOverview();
    res.status(200).json(overview);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getRiskDistribution = async (req, res) => {
  try {
    const distribution = await adminService.getRiskDistribution();
    res.status(200).json({ distribution });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateRiskWeights = async (req, res) => {
  try {
    const result = await adminService.updateRiskWeights(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getSystemHealth = async (req, res) => {
  try {
    const health = await adminService.getSystemHealth();
    res.status(200).json(health);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getSystemLogs = async (req, res) => {
  try {
    const { level, startDate, endDate, limit = 100 } = req.query;
    const logs = await adminService.getSystemLogs({ level, startDate, endDate, limit });
    res.status(200).json({ logs });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Create a new assignment
 */
export const createAssignment = async (req, res) => {
  try {
    const { course_id, title, due_date } = req.body;
    
    if (!course_id || !title || !due_date) {
      return res.status(400).json({ 
        status: 'error',
        message: 'course_id, title, and due_date are required' 
      });
    }
    
    const assignment = await adminService.createAssignment(req.body);
    res.status(201).json({ 
      status: 'success',
      message: 'Assignment created successfully',
      data: assignment 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

/**
 * Bulk create attendance records
 */
export const createAttendanceRecords = async (req, res) => {
  try {
    const { course_id, attendance_date, records } = req.body;
    
    if (!course_id || !attendance_date || !records || !Array.isArray(records)) {
      return res.status(400).json({ 
        status: 'error',
        message: 'course_id, attendance_date, and records array are required' 
      });
    }
    
    const result = await adminService.createAttendanceRecords(req.body);
    res.status(201).json({ 
      status: 'success',
      message: `${result.created} attendance records created successfully`,
      data: result 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

// ============ STUDENT MANAGEMENT ============

export const getAllStudents = async (req, res) => {
  try {
    const students = await adminService.getAllStudents();
    res.status(200).json({ 
      status: 'success',
      data: students 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const student = await adminService.getStudentById(req.params.id);
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

export const updateStudent = async (req, res) => {
  try {
    const student = await adminService.updateStudent(req.params.id, req.body);
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

export const deactivateStudent = async (req, res) => {
  try {
    const result = await adminService.deactivateStudent(req.params.id);
    res.status(200).json({ 
      status: 'success',
      message: 'Student deactivated successfully',
      data: result 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

export const getStudentRiskHistory = async (req, res) => {
  try {
    const history = await adminService.getStudentRiskHistory(req.params.id);
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

// ============ ADVISOR MANAGEMENT ============

export const getAllAdvisors = async (req, res) => {
  try {
    const advisors = await adminService.getAllAdvisors();
    res.status(200).json({ 
      status: 'success',
      data: advisors 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

export const createAdvisor = async (req, res) => {
  try {
    const advisor = await adminService.createAdvisor(req.body);
    res.status(201).json({ 
      status: 'success',
      data: advisor 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

export const updateAdvisor = async (req, res) => {
  try {
    const advisor = await adminService.updateAdvisor(req.params.id, req.body);
    res.status(200).json({ 
      status: 'success',
      data: advisor 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

export const deleteAdvisor = async (req, res) => {
  try {
    const result = await adminService.deleteAdvisor(req.params.id);
    res.status(200).json({ 
      status: 'success',
      message: 'Advisor deleted successfully',
      data: result 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

export const assignStudentsToAdvisor = async (req, res) => {
  try {
    const { studentIds } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ 
        status: 'error',
        message: 'studentIds array is required' 
      });
    }
    
    const result = await adminService.assignStudentsToAdvisor(req.params.id, studentIds);
    res.status(200).json({ 
      status: 'success',
      message: `${result.assigned} students assigned successfully`,
      data: result 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

export const getAdvisorWorkload = async (req, res) => {
  try {
    const workload = await adminService.getAdvisorWorkload(req.params.id);
    res.status(200).json({ 
      status: 'success',
      data: workload 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

// ============ COURSE MANAGEMENT ============

export const getAllCourses = async (req, res) => {
  try {
    const courses = await adminService.getAllCourses();
    res.status(200).json({ 
      status: 'success',
      data: courses 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

export const createCourse = async (req, res) => {
  try {
    const course = await adminService.createCourse(req.body);
    res.status(201).json({ 
      status: 'success',
      data: course 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const course = await adminService.updateCourse(req.params.id, req.body);
    res.status(200).json({ 
      status: 'success',
      data: course 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const result = await adminService.deleteCourse(req.params.id);
    res.status(200).json({ 
      status: 'success',
      message: 'Course deleted successfully',
      data: result 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

// ============ SEMESTER MANAGEMENT ============

export const getAllSemesters = async (req, res) => {
  try {
    const semesters = await adminService.getAllSemesters();
    res.status(200).json({ 
      status: 'success',
      data: semesters 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

export const createSemester = async (req, res) => {
  try {
    const semester = await adminService.createSemester(req.body);
    res.status(201).json({ 
      status: 'success',
      data: semester 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

export const updateSemester = async (req, res) => {
  try {
    const semester = await adminService.updateSemester(req.params.id, req.body);
    res.status(200).json({ 
      status: 'success',
      data: semester 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

export const deleteSemester = async (req, res) => {
  try {
    const result = await adminService.deleteSemester(req.params.id);
    res.status(200).json({ 
      status: 'success',
      message: 'Semester deleted successfully',
      data: result 
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};
