import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabaseClient.js';

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Service for user registration
export const registerUser = async (userData) => {
  const { email, password, first_name, last_name, role } = userData;

  try {
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Check if the user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (checkError) {
      throw new Error(`Failed to check existing user: ${checkError.message}`);
    }

    if (existingUsers && existingUsers.length > 0) {
      throw new Error('User already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into public.users
    const { data: user, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password: hashedPassword,
          first_name: first_name || '',
          last_name: last_name || '',
          role: role || 'student',
        },
      ])
    .select()
      .single();
    if (error) {
      throw new Error(`Failed to register user: ${error.message}`);
    }

    // Generate JWT token
    const token = generateToken(user);

    return { user, token };
  } catch (err) {
    console.error('❌ Registration error:', err.message);
    throw new Error(err.message);
  }
};

// Service for user login
export const loginUser = async (email, password) => {
  try {
    // Find the user in the database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new Error('Invalid email or password');
    }

    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken(user);

    return { user, token };
  } catch (err) {
    console.error('❌ Login error:', err.message);
    throw new Error(err.message);
  }
};