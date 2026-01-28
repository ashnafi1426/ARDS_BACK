import { supabase } from '../config/supabase.js';

export const getAdvisorProfile = async (userId) => {
  const { data, error } = await supabase
    .from('advisors')
    .select('advisor_id, user_id, full_name, department, created_at')
    .eq('user_id', userId)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const getAssignedStudents = async (advisorId) => {
  const { data, error } = await supabase
    .from('students')
    .select('student_id, user_id, full_name, department, year_of_study, gpa, risk_score, risk_level, advisor_id, created_at')
    .eq('advisor_id', advisorId);
  if (error) throw new Error(error.message);
  return data;
};

export const getAtRiskStudents = async (advisorId) => {
  const { data, error } = await supabase
    .from('students')
    .select('student_id, user_id, full_name, department, year_of_study, gpa, risk_score, risk_level, advisor_id, created_at')
    .eq('advisor_id', advisorId)
    .in('risk_level', ['MEDIUM', 'HIGH', 'CRITICAL']);
  if (error) throw new Error(error.message);
  return data;
};

export const getStudentDetails = async (advisorId, studentId) => {
  const { data, error } = await supabase
    .from('students')
    .select('*, risk_history(*), self_checks(*)')
    .eq('student_id', studentId)
    .eq('advisor_id', advisorId)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const createIntervention = async (advisorId, studentId, data) => {
  const { data: intervention, error } = await supabase
    .from('interventions')
    .insert([{ advisor_id: advisorId, student_id: studentId, ...data }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return intervention;
};

export const getAdvisorInterventions = async (advisorId) => {
  const { data, error } = await supabase
    .from('interventions')
    .select('*, students(*)')
    .eq('advisor_id', advisorId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};
