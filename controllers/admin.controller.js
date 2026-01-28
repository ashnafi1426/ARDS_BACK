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
    const { email, password, role, full_name, department } = req.body;
    
    // Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({ 
        message: 'Email, password, and role are required' 
      });
    }
    
    const user = await adminService.createUser(req.body);
    res.status(201).json({ user });
  } catch (error) {
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
