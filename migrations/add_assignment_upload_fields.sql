-- Add file upload support to assignment_submissions table
-- This migration adds fields to support file uploads for assignments

-- Add new columns to assignment_submissions table
ALTER TABLE public.assignment_submissions
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS submission_notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON public.assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status ON public.assignment_submissions(status);

-- Add constraint to ensure file_size is positive
ALTER TABLE public.assignment_submissions
ADD CONSTRAINT check_file_size CHECK (file_size IS NULL OR file_size > 0);

-- Add constraint to ensure file_type is valid
ALTER TABLE public.assignment_submissions
ADD CONSTRAINT check_file_type CHECK (file_type IS NULL OR file_type IN ('pdf', 'doc', 'docx', 'txt', 'zip', 'jpg', 'png', 'xlsx', 'pptx'));
