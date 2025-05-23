// Test script to test the new TEST-LOGIN endpoint
const { default: fetch } = require('node-fetch');

// Define the test users to verify
const testUsers = [
  { email: 'admin@example.com', role: 'ADMIN', expectedRedirect: '/admin/dashboard' },
  { email: 'business@example.com', role: 'BUSINESS', expectedRedirect: '/business/dashboard' },
  { email: 'courier@example.com', role: 'COURIER', expectedRedirect: '/courier/dashboard' },
  { email: 'customer@example.com', role: 'CUSTOMER', expectedRedirect: '/customer/dashboard' },
];

// Default test password
const password = 'Test123';
const API_URL = process.env.API_URL || 'http://localhost:3001/api/auth/test-login';

/**
 * Test the login functionality for a user
 * @param {Object} userInfo - User information
 * @param {boolean} bypass - Whether to bypass password verification
 * @returns {Promise<Object>} - Login response
 */
async function testLogin(userInfo, bypass = true) {
  console.log(`Testing login for ${userInfo.email} (${userInfo.role}) with bypass=${bypass}`);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userInfo.email,
        password: password,
        bypass: bypass,
      }),
    });
    
    const data = await response.json();
    
    // Log detailed response
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);
    
    if (data.success) {
      console.log(`✅ Login successful for ${userInfo.email}`);
      console.log(`- User ID: ${data.user?.id}`);
      console.log(`- Role: ${data.user?.role}`);
      console.log(`- Redirect URL: ${data.redirectUrl}`);
      
      // Verify redirect URL
      if (data.redirectUrl === userInfo.expectedRedirect) {
        console.log(`✅ Redirect URL is correct: ${data.redirectUrl}`);
      } else {
        console.log(`❌ Redirect URL mismatch: Expected ${userInfo.expectedRedirect}, got ${data.redirectUrl}`);
      }
      
      // Verify token exists
      if (data.token) {
        console.log(`✅ Token received (${data.token.substring(0, 15)}...)`);
      } else {
        console.log(`❌ No token received`);
      }
    } else {
      console.log(`❌ Login failed for ${userInfo.email}: ${data.error}`);
      if (data.stack) {
        console.log('Error stack:', data.stack);
      }
    }
    
    console.log('-'.repeat(50));
    return data;
  } catch (error) {
    console.error(`❌ Error testing login for ${userInfo.email}:`, error.message);
    console.log('-'.repeat(50));
    return { success: false, error: error.message };
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('='.repeat(50));
  console.log('STARTING TEST LOGIN TESTS');
  console.log('='.repeat(50));
  
  // Test with bypass enabled (default)
  console.log('\n📋 Testing all users with bypass enabled:');
  for (const user of testUsers) {
    await testLogin(user, true);
  }
  
  // Test with bypass disabled
  console.log('\n📋 Testing all users with bypass disabled:');
  for (const user of testUsers) {
    await testLogin(user, false);
  }
  
  // Test with invalid email
  console.log('\n📋 Testing invalid email:');
  await testLogin({ email: 'nonexistent@example.com', role: 'UNKNOWN', expectedRedirect: '/' });
  
  // Test with invalid password
  console.log('\n📋 Testing invalid password:');
  await testLogin({ email: 'admin@example.com', role: 'ADMIN', expectedRedirect: '/admin/dashboard' }, false);
  
  console.log('='.repeat(50));
  console.log('TEST LOGIN TESTS COMPLETED');
  console.log('='.repeat(50));
}

// Run the tests
runTests().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
}); 