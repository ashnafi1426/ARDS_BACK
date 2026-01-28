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
