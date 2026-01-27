-- ============================================================
-- ACADEMIC RISK DETECTION SYSTEM
-- PostgreSQL Schema (Auto-increment INT IDs)
-- ============================================================

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT CHECK (role IN ('student', 'advisor', 'admin')) NOT NULL DEFAULT 'student',
  phone_number TEXT,
  profile_picture_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================================
-- 2. STUDENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_number TEXT UNIQUE NOT NULL,
  program TEXT,
  year_of_study INT CHECK (year_of_study BETWEEN 1 AND 6),
  gpa NUMERIC(3,2) CHECK (gpa BETWEEN 0 AND 4),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_student_number ON students(student_number);
CREATE INDEX idx_students_program ON students(program);

-- ============================================================
-- 3. ADVISORS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS advisors (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department TEXT,
  specialization TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_advisors_user_id ON advisors(user_id);
CREATE INDEX idx_advisors_department ON advisors(department);

-- ============================================================
-- 4. STUDENT-ADVISOR ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS student_advisor_assignments (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  advisor_id INT NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  assigned_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, advisor_id)
);

CREATE INDEX idx_saa_student_id ON student_advisor_assignments(student_id);
CREATE INDEX idx_saa_advisor_id ON student_advisor_assignments(advisor_id);
CREATE INDEX idx_saa_assigned_date ON student_advisor_assignments(assigned_date);

-- ============================================================
-- 5. SELF ASSESSMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS self_assessments (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  stress_level INT CHECK (stress_level BETWEEN 1 AND 10),
  study_hours NUMERIC(4,1),
  sleep_hours NUMERIC(4,1),
  assessment_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sa_student_id ON self_assessments(student_id);
CREATE INDEX idx_sa_assessment_date ON self_assessments(assessment_date);
CREATE INDEX idx_sa_created_at ON self_assessments(created_at);

-- ============================================================
-- 6. RISK SCORES
-- ============================================================
CREATE TABLE IF NOT EXISTS risk_scores (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  overall_risk_score NUMERIC(3,2),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  assessment_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rs_student_id ON risk_scores(student_id);
CREATE INDEX idx_rs_risk_level ON risk_scores(risk_level);
CREATE INDEX idx_rs_assessment_date ON risk_scores(assessment_date);
CREATE INDEX idx_rs_created_at ON risk_scores(created_at);

-- ============================================================
-- 7. INTERVENTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS interventions (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  advisor_id INT REFERENCES advisors(id) ON DELETE SET NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending','in_progress','completed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_int_student_id ON interventions(student_id);
CREATE INDEX idx_int_advisor_id ON interventions(advisor_id);
CREATE INDEX idx_int_status ON interventions(status);
CREATE INDEX idx_int_created_at ON interventions(created_at);

-- ============================================================
-- 8. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  recipient_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_not_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_not_is_read ON notifications(is_read);
CREATE INDEX idx_not_created_at ON notifications(created_at);
