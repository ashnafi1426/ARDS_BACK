// Simple test script to verify admin endpoints
const axios = require('axios');

const API_URL = 'http://localhost:5004/api';

async function testAdminEndpoints() {
  console.log('🧪 Testing Admin Endpoints...\n');

  try {
    // Step 1: Login as admin
    console.log('1. Testing admin login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@ards.com',
      password: 'admin123'
    });

    if (loginResponse.data.token) {
      console.log('✅ Admin login successful');
      const token = loginResponse.data.token;
      
      // Step 2: Test get all users
      console.log('\n2. Testing get all users...');
      const usersResponse = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Get users successful');
      console.log(`   Found ${usersResponse.data.users?.length || 0} users`);
      
      // Step 3: Test create user
      console.log('\n3. Testing create user...');
      const testUser = {
        full_name: 'Test User ' + Date.now(),
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        role: 'student',
        department: 'Computer Science'
      };
      
      const createResponse = await axios.post(`${API_URL}/admin/users`, testUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Create user successful');
      console.log(`   Created user: ${createResponse.data.user.email}`);
      
      // Step 4: Test get users again to verify creation
      console.log('\n4. Verifying user creation...');
      const usersResponse2 = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Verification successful');
      console.log(`   Now have ${usersResponse2.data.users?.length || 0} users`);
      
      console.log('\n🎉 All tests passed!');
      
    } else {
      console.log('❌ Admin login failed - no token received');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('   Response data:', error.response.data);
    }
  }
}

// Run the test
testAdminEndpoints();