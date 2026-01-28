import { supabase } from '../config/supabase.js';
import bcrypt from 'bcrypt';

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, created_at');
  if (error) throw new Error(error.message);
  return data;
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
  // If password is being updated, hash it
  if (userData.password) {
    userData.password = await bcrypt.hash(userData.password, 10);
  }
  
  const { data, error } = await supabase
    .from('users')
    .update(userData)
    .eq('id', userId)
    .select('id, email, role, created_at')
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const deleteUser = async (userId) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);
  if (error) throw new Error(error.message);
  return { success: true };
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
