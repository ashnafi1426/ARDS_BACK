/**
 * Calculate risk score for a student
 * Uses weighted factors: GPA (30%), Attendance (25%), Assignments (25%), Self-Check (20%)
 * 
 * @param {Object} studentData - Student academic and wellness data
 * @param {number} studentData.gpa - Current GPA (0-4.0)
 * @param {number} studentData.attendanceRate - Attendance percentage (0-100)
 * @param {number} studentData.assignmentCompletionRate - Assignment completion percentage (0-100)
 * @param {Object} studentData.latestSelfCheck - Most recent self-check data
 * @returns {Object} { score: number, level: string }
 */
export const calculateRiskScore = (studentData) => {
  const {
    gpa = 4.0,
    attendanceRate = 100,
    assignmentCompletionRate = 100,
    latestSelfCheck = {}
  } = studentData;
  
  // Calculate individual component scores (0-100, where 100 is highest risk)
  const gpaScore = ((4.0 - Math.min(gpa, 4.0)) / 4.0) * 100;
  const attendanceScore = 100 - Math.min(attendanceRate, 100);
  const assignmentScore = 100 - Math.min(assignmentCompletionRate, 100);
  
  // Self-check score (average of stress, workload, financial concern)
  const selfCheckScore = latestSelfCheck.stress_level || latestSelfCheck.workload_difficulty || latestSelfCheck.financial_concern
    ? ((latestSelfCheck.stress_level || 1) + 
       (latestSelfCheck.workload_difficulty || 1) + 
       (latestSelfCheck.financial_concern || 1)) / 3 * 20
    : 0;
  
  // Weighted calculation
  const score = Math.round(
    (gpaScore * 0.30) +
    (attendanceScore * 0.25) +
    (assignmentScore * 0.25) +
    (selfCheckScore * 0.20)
  );
  
  // Ensure score is between 0-100
  const finalScore = Math.max(0, Math.min(100, score));
  
  return {
    score: finalScore,
    level: getRiskLevel(finalScore)
  };
};

/**
 * Determine risk level from score
 * @param {number} score - Risk score (0-100)
 * @returns {string} Risk level: LOW, MEDIUM, HIGH, or CRITICAL
 */
export const getRiskLevel = (score) => {
  if (score >= 0 && score <= 25) return 'LOW';
  if (score >= 26 && score <= 50) return 'MEDIUM';
  if (score >= 51 && score <= 75) return 'HIGH';
  if (score >= 76 && score <= 100) return 'CRITICAL';
  return 'LOW'; // Default
};
