-- ============================================================
-- ACADEMIC RISK DETECTION SYSTEM
-- MySQL Schema (Compatible with MySQL 8.0+)
-- ============================================================

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  email VARCHAR(255) UNIQUE NOT NULL COMMENT 'User email address',
  password VARCHAR(255) NOT NULL COMMENT 'Hashed password',
  first_name VARCHAR(100) COMMENT 'User first name',
  last_name VARCHAR(100) COMMENT 'User last name',
  role ENUM('student', 'advisor', 'admin') NOT NULL DEFAULT 'student' COMMENT 'User role',
  phone_number VARCHAR(20) COMMENT 'User phone number',
  profile_picture_url VARCHAR(500) COMMENT 'URL to profile picture',
  is_active BOOLEAN DEFAULT true COMMENT 'Account active status',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Account creation timestamp',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User accounts table';

-- ============================================================
-- 2. STUDENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  user_id VARCHAR(36) UNIQUE NOT NULL COMMENT 'Reference to users table',
  student_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'Student ID number',
  program VARCHAR(100) COMMENT 'Program/Major',
  year_of_study INT CHECK (year_of_study BETWEEN 1 AND 6) COMMENT 'Year of study (1-6)',
  gpa DECIMAL(3,2) CHECK (gpa BETWEEN 0 AND 4) COMMENT 'Current GPA (0-4.0)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_student_number (student_number),
  INDEX idx_program (program)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student information table';

-- ============================================================
-- 3. ADVISORS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS advisors (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  user_id VARCHAR(36) UNIQUE NOT NULL COMMENT 'Reference to users table',
  department VARCHAR(100) COMMENT 'Department name',
  specialization VARCHAR(100) COMMENT 'Advisor specialization',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Advisor information table';

-- ============================================================
-- 4. STUDENT-ADVISOR ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS student_advisor_assignments (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  student_id VARCHAR(36) NOT NULL COMMENT 'Reference to students table',
  advisor_id VARCHAR(36) NOT NULL COMMENT 'Reference to advisors table',
  assigned_date DATE DEFAULT CURDATE() COMMENT 'Assignment date',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (advisor_id) REFERENCES advisors(id) ON DELETE CASCADE,
  UNIQUE KEY unique_assignment (student_id, advisor_id),
  INDEX idx_student_id (student_id),
  INDEX idx_advisor_id (advisor_id),
  INDEX idx_assigned_date (assigned_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student-Advisor assignment table';

-- ============================================================
-- 5. SELF ASSESSMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS self_assessments (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  student_id VARCHAR(36) NOT NULL COMMENT 'Reference to students table',
  stress_level INT CHECK (stress_level BETWEEN 1 AND 10) COMMENT 'Stress level (1-10)',
  study_hours DECIMAL(4,1) COMMENT 'Hours spent studying',
  sleep_hours DECIMAL(4,1) COMMENT 'Hours of sleep',
  assessment_date DATE DEFAULT CURDATE() COMMENT 'Assessment date',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id),
  INDEX idx_assessment_date (assessment_date),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student self-assessment data table';

-- ============================================================
-- 6. RISK SCORES
-- ============================================================
CREATE TABLE IF NOT EXISTS risk_scores (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  student_id VARCHAR(36) NOT NULL COMMENT 'Reference to students table',
  overall_risk_score DECIMAL(3,2) COMMENT 'Overall risk score (0-1.0)',
  risk_level ENUM('low', 'medium', 'high', 'critical') NOT NULL COMMENT 'Risk level classification',
  assessment_date DATE DEFAULT CURDATE() COMMENT 'Assessment date',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id),
  INDEX idx_risk_level (risk_level),
  INDEX idx_assessment_date (assessment_date),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student risk scores table';

-- ============================================================
-- 7. INTERVENTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS interventions (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  student_id VARCHAR(36) NOT NULL COMMENT 'Reference to students table',
  advisor_id VARCHAR(36) COMMENT 'Reference to advisors table',
  description TEXT COMMENT 'Intervention description',
  status ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending' COMMENT 'Intervention status',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (advisor_id) REFERENCES advisors(id) ON DELETE SET NULL,
  INDEX idx_student_id (student_id),
  INDEX idx_advisor_id (advisor_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Intervention tracking table';

-- ============================================================
-- 8. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  recipient_id VARCHAR(36) NOT NULL COMMENT 'Reference to users table',
  title VARCHAR(255) NOT NULL COMMENT 'Notification title',
  message TEXT COMMENT 'Notification message',
  is_read BOOLEAN DEFAULT false COMMENT 'Read status',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_recipient_id (recipient_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User notifications table';

-- ============================================================
-- 9. AUDIT LOG (Optional but recommended)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  user_id VARCHAR(36) COMMENT 'User who performed action',
  action VARCHAR(100) NOT NULL COMMENT 'Action performed',
  entity_type VARCHAR(50) COMMENT 'Type of entity affected',
  entity_id VARCHAR(36) COMMENT 'ID of entity affected',
  old_values JSON COMMENT 'Previous values',
  new_values JSON COMMENT 'New values',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Action timestamp',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_entity_type (entity_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit log for system actions';

-- ============================================================
-- 10. SESSIONS (Optional for session management)
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  user_id VARCHAR(36) NOT NULL COMMENT 'Reference to users table',
  token VARCHAR(500) NOT NULL COMMENT 'JWT token',
  ip_address VARCHAR(45) COMMENT 'IP address of session',
  user_agent VARCHAR(500) COMMENT 'User agent string',
  expires_at TIMESTAMP COMMENT 'Token expiration time',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Session creation timestamp',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User session tracking table';

-- ============================================================
-- VIEWS (Optional but useful)
-- ============================================================

-- View: Student Risk Summary
CREATE OR REPLACE VIEW student_risk_summary AS
SELECT 
  s.id as student_id,
  u.email,
  u.first_name,
  u.last_name,
  s.student_number,
  s.program,
  s.gpa,
  rs.overall_risk_score,
  rs.risk_level,
  rs.assessment_date,
  COUNT(DISTINCT i.id) as active_interventions
FROM students s
JOIN users u ON s.user_id = u.id
LEFT JOIN risk_scores rs ON s.id = rs.student_id 
  AND rs.assessment_date = (
    SELECT MAX(assessment_date) 
    FROM risk_scores 
    WHERE student_id = s.id
  )
LEFT JOIN interventions i ON s.id = i.student_id 
  AND i.status IN ('pending', 'in_progress')
GROUP BY s.id, u.email, u.first_name, u.last_name, s.student_number, 
         s.program, s.gpa, rs.overall_risk_score, rs.risk_level, rs.assessment_date;

-- View: Advisor Student Count
CREATE OR REPLACE VIEW advisor_student_count AS
SELECT 
  a.id as advisor_id,
  u.email,
  u.first_name,
  u.last_name,
  a.department,
  COUNT(DISTINCT saa.student_id) as assigned_students,
  COUNT(DISTINCT CASE WHEN rs.risk_level IN ('high', 'critical') THEN saa.student_id END) as at_risk_students
FROM advisors a
JOIN users u ON a.user_id = u.id
LEFT JOIN student_advisor_assignments saa ON a.id = saa.advisor_id
LEFT JOIN students s ON saa.student_id = s.id
LEFT JOIN risk_scores rs ON s.id = rs.student_id 
  AND rs.assessment_date = (
    SELECT MAX(assessment_date) 
    FROM risk_scores 
    WHERE student_id = s.id
  )
GROUP BY a.id, u.email, u.first_name, u.last_name, a.department;

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Additional indexes for common queries
CREATE INDEX idx_users_role_active ON users(role, is_active);
CREATE INDEX idx_students_program_year ON students(program, year_of_study);
CREATE INDEX idx_risk_scores_student_date ON risk_scores(student_id, assessment_date DESC);
CREATE INDEX idx_interventions_status_date ON interventions(status, created_at DESC);
CREATE INDEX idx_notifications_recipient_read ON notifications(recipient_id, is_read);

-- ============================================================
-- END OF SCHEMA
-- ============================================================
