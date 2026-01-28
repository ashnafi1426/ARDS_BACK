/**
 * Test script to verify self-check attendance insertion
 * Run with: node test-self-check-attendance.js
 */

import { supabase } from './config/supabase.js';

async function testSelfCheckAttendance() {
  console.log('=== Testing Self-Check Attendance Feature ===\n');
  
  try {
    // 1. Get a test student
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('student_id, full_name')
      .limit(1);
    
    if (studentError || !students || students.length === 0) {
      console.error('❌ No students found in database');
      return;
    }
    
    const testStudent = students[0];
    console.log('✅ Test Student:', testStudent.full_name);
    console.log('   Student ID:', testStudent.student_id);
    
    // 2. Check if student has enrollments
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('course_id, courses(course_name)')
      .eq('student_id', testStudent.student_id);
    
    if (enrollmentError) {
      console.error('❌ Error fetching enrollments:', enrollmentError);
      return;
    }
    
    console.log('\n📚 Enrollments:', enrollments?.length || 0);
    if (enrollments && enrollments.length > 0) {
      enrollments.forEach((e, i) => {
        console.log(`   ${i + 1}. ${e.courses?.course_name || 'Unknown Course'}`);
      });
    } else {
      console.log('⚠️  Student has no enrollments - attendance records cannot be created');
      console.log('   Please add enrollments first using:');
      console.log(`   INSERT INTO enrollments (student_id, course_id, semester) VALUES ('${testStudent.student_id}', '<course_id>', 'Spring 2026');`);
      return;
    }
    
    // 3. Test self-check data
    const testSelfCheckData = {
      stress_level: 3,
      study_hours: 4,
      workload_difficulty: 3,
      sleep_quality: 4,
      financial_concern: 2,
      motivation_level: 4,
      attendance_rate: 'MOSTLY_75_99',
      assignment_completion: 'MOST_COMPLETED',
      comments: 'Test self-check for attendance feature'
    };
    
    console.log('\n📝 Test Self-Check Data:');
    console.log('   Attendance Rate:', testSelfCheckData.attendance_rate);
    console.log('   Assignment Completion:', testSelfCheckData.assignment_completion);
    
    // 4. Extract attendance data
    const { attendance_rate, assignment_completion, ...selfCheckData } = testSelfCheckData;
    
    // 5. Insert self-check
    console.log('\n⏳ Inserting self-check...');
    const { data: selfCheck, error: selfCheckError } = await supabase
      .from('self_checks')
      .insert([{ student_id: testStudent.student_id, ...selfCheckData }])
      .select()
      .single();
    
    if (selfCheckError) {
      console.error('❌ Failed to insert self-check:', selfCheckError);
      return;
    }
    
    console.log('✅ Self-check inserted:', selfCheck.self_check_id);
    
    // 6. Create attendance records
    console.log('\n⏳ Creating attendance records...');
    
    const attendancePercentage = 87; // MOSTLY_75_99
    const daysToCreate = 5;
    const daysPresent = Math.round((daysToCreate * attendancePercentage) / 100);
    
    const attendanceRecords = [];
    const today = new Date();
    
    for (let i = 0; i < daysToCreate; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      const dateString = date.toISOString().split('T')[0];
      const isPresent = i < daysPresent;
      
      for (const enrollment of enrollments) {
        attendanceRecords.push({
          student_id: testStudent.student_id,
          course_id: enrollment.course_id,
          attendance_date: dateString,
          is_present: isPresent,
          remarks: `Self-reported via weekly self-check (${attendance_rate})`
        });
      }
    }
    
    console.log('   Records to create:', attendanceRecords.length);
    console.log('   Days present:', daysPresent, 'out of', daysToCreate);
    
    if (attendanceRecords.length > 0) {
      const { data: insertedRecords, error: insertError } = await supabase
        .from('attendance')
        .insert(attendanceRecords)
        .select();
      
      if (insertError) {
        console.error('❌ Failed to insert attendance records:', insertError);
        return;
      }
      
      console.log('✅ Attendance records created:', insertedRecords.length);
    }
    
    // 7. Verify attendance records
    console.log('\n🔍 Verifying attendance records...');
    const { data: verifyRecords, error: verifyError } = await supabase
      .from('attendance')
      .select('attendance_date, is_present, remarks')
      .eq('student_id', testStudent.student_id)
      .like('remarks', '%Self-reported%')
      .order('attendance_date', { ascending: false })
      .limit(10);
    
    if (verifyError) {
      console.error('❌ Error verifying records:', verifyError);
      return;
    }
    
    console.log('   Found', verifyRecords?.length || 0, 'self-reported attendance records:');
    verifyRecords?.forEach((record, i) => {
      console.log(`   ${i + 1}. ${record.attendance_date} - ${record.is_present ? '✅ Present' : '❌ Absent'}`);
    });
    
    // 8. Calculate attendance rate
    const { data: allAttendance } = await supabase
      .from('attendance')
      .select('is_present')
      .eq('student_id', testStudent.student_id);
    
    if (allAttendance && allAttendance.length > 0) {
      const totalClasses = allAttendance.length;
      const attendedClasses = allAttendance.filter(r => r.is_present).length;
      const attendanceRate = Math.round((attendedClasses / totalClasses) * 100);
      
      console.log('\n📊 Attendance Statistics:');
      console.log('   Total Classes:', totalClasses);
      console.log('   Attended:', attendedClasses);
      console.log('   Attendance Rate:', attendanceRate + '%');
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run the test
testSelfCheckAttendance();
