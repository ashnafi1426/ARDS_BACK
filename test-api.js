// Simple API test script
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5004';

async function testAPI() {
  console.log('🧪 Testing ARDS Backend API\n');
  
  // Test 1: Health Check
  console.log('1️⃣ Testing Health Check...');
  try {
    const response = await fetch(`${BASE_URL}/`);
    const text = await response.text();
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Response: ${text}\n`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  
  // Test 2: Register Student
  console.log('2️⃣ Testing Student Registration...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teststudent@test.com',
        password: 'password123',
        role: 'student',
        full_name: 'Test Student',
        student_number: 'STU999',
        department: 'Computer Science'
      })
    });
    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Response:`, JSON.stringify(data, null, 2));
    
    if (data.token) {
      console.log(`✅ Token received: ${data.token.substring(0, 20)}...\n`);
      return data.token;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  
  return null;
}

testAPI().then(() => {
  console.log('✅ API tests completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
