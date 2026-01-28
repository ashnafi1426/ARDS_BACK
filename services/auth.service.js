import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase.js';
import { generateToken } from '../utils/jwt.js';

// Service for user registration
export const registerUser = async (userData) => {
  const { email, password, role, full_name, department } = userData;

  try {
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (!role || !['student', 'advisor', 'admin'].includes(role)) {
      throw new Error('Valid role is required (student, advisor, or admin)');
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
          role: role,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to register user: ${error.message}`);
    }

    // Create corresponding student or advisor record
    if (role === 'student') {
      const { error: studentError } = await supabase
        .from('students')
        .insert([
          {
            user_id: user.id,
            full_name: full_name || 'Student User',
            department: department || null,
          },
        ]);

      if (studentError) {
        // Rollback user creation if student creation fails
        await supabase.from('users').delete().eq('id', user.id);
        throw new Error(`Failed to create student record: ${studentError.message}`);
      }
    } else if (role === 'advisor') {
      const { error: advisorError } = await supabase
        .from('advisors')
        .insert([
          {
            user_id: user.id,
            full_name: full_name || 'Advisor User',
            department: department || null,
          },
        ]);

      if (advisorError) {
        // Rollback user creation if advisor creation fails
        await supabase.from('users').delete().eq('id', user.id);
        throw new Error(`Failed to create advisor record: ${advisorError.message}`);
      }
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return clean user object with only essential fields
    const cleanUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    };

    return { user: cleanUser, token };
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

    // Fetch additional user details based on role
    let userDetails = {
      id: user.id,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    };
    
    if (user.role === 'student') {
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!studentError && studentData) {
        userDetails.full_name = studentData.full_name;
        userDetails.department = studentData.department;
        userDetails.year_of_study = studentData.year_of_study;
        userDetails.gpa = studentData.gpa;
        userDetails.risk_score = studentData.risk_score;
        userDetails.risk_level = studentData.risk_level;
      }
    } else if (user.role === 'advisor') {
      const { data: advisorData, error: advisorError } = await supabase
        .from('advisors')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!advisorError && advisorData) {
        userDetails.full_name = advisorData.full_name;
        userDetails.department = advisorData.department;
      }
    } else if (user.role === 'admin') {
      // Admin might have a full_name if stored elsewhere
      userDetails.full_name = user.email.split('@')[0]; // Default to email username
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return clean user object (password already excluded from userDetails)
    return { user: userDetails, token };
  } catch (err) {
    console.error('❌ Login error:', err.message);
    throw new Error(err.message);
  }
};