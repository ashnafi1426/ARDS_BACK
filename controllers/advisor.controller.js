import * as advisorService from '../services/advisor.service.js';
import { supabase } from '../config/supabase.js';

export const getProfile = async (req, res) => {
  try {
    const advisor = await advisorService.getAdvisorProfile(req.user.id);
    res.status(200).json({ advisor });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAssignedStudents = async (req, res) => {
  try {
    const { data: advisor } = await supabase
      .from('advisors')
      .select('advisor_id')
      .eq('user_id', req.user.id)
      .single();
    
    const students = await advisorService.getAssignedStudents(advisor.advisor_id);
    res.status(200).json({ students });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAtRiskStudents = async (req, res) => {
  try {
    const { data: advisor } = await supabase
      .from('advisors')
      .select('advisor_id')
      .eq('user_id', req.user.id)
      .single();
    
    const students = await advisorService.getAtRiskStudents(advisor.advisor_id);
    res.status(200).json({ students });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getStudentDetails = async (req, res) => {
  try {
    const { data: advisor } = await supabase
      .from('advisors')
      .select('advisor_id')
      .eq('user_id', req.user.id)
      .single();
    
    const student = await advisorService.getStudentDetails(advisor.advisor_id, req.params.id);
    res.status(200).json({ student });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const createIntervention = async (req, res) => {
  try {
    const { data: advisor } = await supabase
      .from('advisors')
      .select('advisor_id')
      .eq('user_id', req.user.id)
      .single();
    
    const intervention = await advisorService.createIntervention(
      advisor.advisor_id,
      req.body.student_id,
      req.body
    );
    res.status(201).json({ intervention });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getInterventions = async (req, res) => {
  try {
    const { data: advisor } = await supabase
      .from('advisors')
      .select('advisor_id')
      .eq('user_id', req.user.id)
      .single();
    
    const interventions = await advisorService.getAdvisorInterventions(advisor.advisor_id);
    res.status(200).json({ interventions });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
