import { supabase } from '../config/supabase.js';
import * as assignmentService from '../services/assignment.service.js';

/**
 * Submit assignment with file upload
 */
export const submitAssignment = async (req, res) => {
  try {
    console.log('=== SUBMIT ASSIGNMENT CONTROLLER ===');
    
    const { assignmentId, submissionNotes } = req.body;
    const file = req.file;
    
    if (!assignmentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Assignment ID is required'
      });
    }
    
    if (!file) {
      return res.status(400).json({
        status: 'error',
        message: 'File is required'
      });
    }
    
    // Get student ID from user
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('student_id')
      .eq('user_id', req.user.id)
      .single();
    
    if (studentError || !student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student record not found'
      });
    }
    
    // Convert file to buffer for Supabase
    const fileBuffer = file.buffer;
    const fileObj = new File([fileBuffer], file.originalname, { type: file.mimetype });
    
    const result = await assignmentService.submitAssignmentWithFile(
      student.student_id,
      assignmentId,
      fileObj,
      submissionNotes
    );
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get assignment submission
 */
export const getSubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    // Get student ID from user
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('student_id')
      .eq('user_id', req.user.id)
      .single();
    
    if (studentError || !student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student record not found'
      });
    }
    
    const submission = await assignmentService.getAssignmentSubmission(
      student.student_id,
      assignmentId
    );
    
    res.status(200).json({
      status: 'success',
      data: submission
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Delete assignment submission
 */
export const deleteSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // Verify ownership
    const { data: submission, error: fetchError } = await supabase
      .from('assignment_submissions')
      .select('student_id')
      .eq('submission_id', submissionId)
      .single();
    
    if (fetchError || !submission) {
      return res.status(404).json({
        status: 'error',
        message: 'Submission not found'
      });
    }
    
    // Get student ID from user
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('student_id')
      .eq('user_id', req.user.id)
      .single();
    
    if (studentError || !student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student record not found'
      });
    }
    
    // Verify ownership
    if (submission.student_id !== student.student_id) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized: Cannot delete other student\'s submission'
      });
    }
    
    const result = await assignmentService.deleteAssignmentSubmission(submissionId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get student submissions
 */
export const getStudentSubmissions = async (req, res) => {
  try {
    // Get student ID from user
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('student_id')
      .eq('user_id', req.user.id)
      .single();
    
    if (studentError || !student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student record not found'
      });
    }
    
    const submissions = await assignmentService.getStudentSubmissions(student.student_id);
    
    res.status(200).json({
      status: 'success',
      data: submissions
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get assignment submissions (admin/instructor)
 */
export const getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const submissions = await assignmentService.getAssignmentSubmissions(assignmentId);
    
    res.status(200).json({
      status: 'success',
      data: submissions
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};
