import { supabase } from '../config/supabase.js';

/**
 * Submit assignment with file upload
 * @param {string} studentId - Student ID
 * @param {string} assignmentId - Assignment ID
 * @param {File} file - File to upload
 * @param {string} submissionNotes - Optional submission notes
 * @returns {Object} Submission record
 */
export const submitAssignmentWithFile = async (studentId, assignmentId, file, submissionNotes = '') => {
  try {
    console.log('📤 Submitting assignment with file:', file.name);
    
    // Validate file
    if (!file) {
      throw new Error('File is required');
    }
    
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      throw new Error('File size exceeds 10MB limit');
    }
    
    // Validate file type
    const allowedTypes = ['pdf', 'doc', 'docx', 'txt', 'zip', 'jpg', 'png', 'xlsx', 'pptx'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      throw new Error(`File type .${fileExtension} is not allowed`);
    }
    
    // Upload file to Supabase Storage
    const fileName = `${studentId}/${assignmentId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assignment-submissions')
      .upload(fileName, file);
    
    if (uploadError) {
      throw new Error(`File upload failed: ${uploadError.message}`);
    }
    
    console.log('✅ File uploaded:', uploadData.path);
    
    // Get public URL for the file
    const { data: urlData } = supabase.storage
      .from('assignment-submissions')
      .getPublicUrl(fileName);
    
    const fileUrl = urlData.publicUrl;
    
    // Check if submission already exists
    const { data: existingSubmission } = await supabase
      .from('assignment_submissions')
      .select('submission_id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .single();
    
    let submission;
    
    if (existingSubmission) {
      // Update existing submission
      const { data: updatedSubmission, error: updateError } = await supabase
        .from('assignment_submissions')
        .update({
          file_url: fileUrl,
          file_name: file.name,
          file_size: file.size,
          file_type: fileExtension,
          submission_notes: submissionNotes,
          status: 'SUBMITTED',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('submission_id', existingSubmission.submission_id)
        .select()
        .single();
      
      if (updateError) {
        throw new Error(`Failed to update submission: ${updateError.message}`);
      }
      
      submission = updatedSubmission;
      console.log('✅ Submission updated');
    } else {
      // Create new submission
      const { data: newSubmission, error: insertError } = await supabase
        .from('assignment_submissions')
        .insert([{
          assignment_id: assignmentId,
          student_id: studentId,
          file_url: fileUrl,
          file_name: file.name,
          file_size: file.size,
          file_type: fileExtension,
          submission_notes: submissionNotes,
          status: 'SUBMITTED',
          submitted_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (insertError) {
        throw new Error(`Failed to create submission: ${insertError.message}`);
      }
      
      submission = newSubmission;
      console.log('✅ Submission created');
    }
    
    return {
      status: 'success',
      data: submission,
      message: 'Assignment submitted successfully'
    };
  } catch (error) {
    console.error('❌ Submit assignment error:', error);
    throw error;
  }
};

/**
 * Get assignment submission details
 * @param {string} studentId - Student ID
 * @param {string} assignmentId - Assignment ID
 * @returns {Object} Submission details
 */
export const getAssignmentSubmission = async (studentId, assignmentId) => {
  try {
    console.log('📥 Fetching assignment submission');
    
    const { data: submission, error } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch submission: ${error.message}`);
    }
    
    return submission || null;
  } catch (error) {
    console.error('❌ Get submission error:', error);
    throw error;
  }
};

/**
 * Delete assignment submission
 * @param {string} submissionId - Submission ID
 * @returns {Object} Result
 */
export const deleteAssignmentSubmission = async (submissionId) => {
  try {
    console.log('🗑️ Deleting assignment submission');
    
    // Get submission to get file path
    const { data: submission, error: fetchError } = await supabase
      .from('assignment_submissions')
      .select('file_url, file_name')
      .eq('submission_id', submissionId)
      .single();
    
    if (fetchError) {
      throw new Error(`Failed to fetch submission: ${fetchError.message}`);
    }
    
    // Delete file from storage if it exists
    if (submission && submission.file_url) {
      const filePath = submission.file_url.split('/').slice(-3).join('/');
      await supabase.storage
        .from('assignment-submissions')
        .remove([filePath]);
    }
    
    // Delete submission record
    const { error: deleteError } = await supabase
      .from('assignment_submissions')
      .delete()
      .eq('submission_id', submissionId);
    
    if (deleteError) {
      throw new Error(`Failed to delete submission: ${deleteError.message}`);
    }
    
    console.log('✅ Submission deleted');
    return { status: 'success', message: 'Submission deleted successfully' };
  } catch (error) {
    console.error('❌ Delete submission error:', error);
    throw error;
  }
};

/**
 * Get all submissions for a student
 * @param {string} studentId - Student ID
 * @returns {Array} List of submissions
 */
export const getStudentSubmissions = async (studentId) => {
  try {
    console.log('📋 Fetching student submissions');
    
    const { data: submissions, error } = await supabase
      .from('assignment_submissions')
      .select('*, assignments(title, due_date, courses(course_name))')
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch submissions: ${error.message}`);
    }
    
    return submissions || [];
  } catch (error) {
    console.error('❌ Get submissions error:', error);
    throw error;
  }
};

/**
 * Get submissions for an assignment
 * @param {string} assignmentId - Assignment ID
 * @returns {Array} List of submissions
 */
export const getAssignmentSubmissions = async (assignmentId) => {
  try {
    console.log('📋 Fetching assignment submissions');
    
    const { data: submissions, error } = await supabase
      .from('assignment_submissions')
      .select('*, students(full_name, student_id)')
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch submissions: ${error.message}`);
    }
    
    return submissions || [];
  } catch (error) {
    console.error('❌ Get submissions error:', error);
    throw error;
  }
};
