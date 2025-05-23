// auth-test.js - Simple testing script for authentication
// Run with: node auth-test.js

// Use ESM syntax for importing node-fetch
import fetch from 'node-fetch';

async function testAuth() {
  console.log('Running authentication test suite...');
  
  // Test 1: Public health API check
  console.log('\n🧪 TEST 1: Public Health API Check');
  try {
    const healthResponse = await fetch('http://localhost:3001/api/health');
    console.log(`Status: ${healthResponse.status}`);
    const healthData = await healthResponse.json();
    console.log(`Health API response: ${JSON.stringify(healthData, null, 2).substring(0, 300)}...`);
    console.log('✅ Test 1 Passed: Health API is accessible');
  } catch (error) {
    console.error('❌ Test 1 Failed:', error.message);
  }
  
  // Test 2: Login with admin user
  console.log('\n🧪 TEST 2: Login with Admin User');
  try {
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'Test123'
      })
    });
    
    console.log(`Status: ${loginResponse.status}`);
    console.log(`Headers:\n${Array.from(loginResponse.headers.entries())
      .map(([k, v]) => `  ${k}: ${v}`)
      .join('\n')}`);
    
    const loginData = await loginResponse.json();
    console.log(`Login response: ${JSON.stringify(loginData, null, 2)}`);
    
    if (loginResponse.status === 200 && loginData.success) {
      console.log('✅ Test 2 Passed: Admin login successful');
      return loginData.token; // Return token for next tests
    } else {
      console.log('❌ Test 2 Failed: Admin login unsuccessful');
      return null;
    }
  } catch (error) {
    console.error('❌ Test 2 Failed:', error.message);
    return null;
  }
}

async function testProtectedApis(token) {
  if (!token) {
    console.log('\n❌ Skipping protected API tests - no token available');
    return;
  }
  
  // Test 3: Access admin dashboard API with token
  console.log('\n🧪 TEST 3: Access Admin Dashboard API with Token');
  try {
    const dashboardResponse = await fetch('http://localhost:3001/api/admin/dashboard', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Cookie': `token=${token}`
      }
    });
    
    console.log(`Status: ${dashboardResponse.status}`);
    
    if (dashboardResponse.status === 200) {
      const dashboardData = await dashboardResponse.json();
      console.log(`Dashboard API response: ${JSON.stringify(dashboardData, null, 2).substring(0, 300)}...`);
      console.log('✅ Test 3 Passed: Admin dashboard API accessible with token');
    } else {
      console.log('❌ Test 3 Failed: Admin dashboard API not accessible');
      // Try to parse error response
      try {
        const errorData = await dashboardResponse.text();
        console.log(`Error response: ${errorData.substring(0, 500)}...`);
      } catch (e) {
        console.log('Could not parse error response');
      }
    }
  } catch (error) {
    console.error('❌ Test 3 Failed:', error.message);
  }
}

// Run all tests
async function runTests() {
  const token = await testAuth();
  await testProtectedApis(token);
  console.log('\n🏁 All tests completed');
}

runTests().catch(console.error); 