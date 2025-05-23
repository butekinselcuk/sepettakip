/**
 * Login Test - Tests the login functionality with all four user roles
 * 
 * This script is designed to test the login process for all user roles
 * and verify that tokens and redirects work correctly.
 */

async function testLogin(email: string, password: string, expectedRole: string, baseUrl: string = 'http://localhost:3001') {
  console.log(`🧪 Testing login for ${expectedRole} user: ${email}`);
  
  try {
    // Attempt to login
    const response = await fetch(`${baseUrl}/api/auth/direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      console.error(`❌ Login failed for ${email}: ${data.error || 'Unknown error'}`);
      return false;
    }
    
    // Verify token and user data
    if (!data.token) {
      console.error(`❌ No token returned for ${email}`);
      return false;
    }
    
    if (!data.user || data.user.role.toUpperCase() !== expectedRole.toUpperCase()) {
      console.error(`❌ Invalid user data or role mismatch for ${email}. Expected ${expectedRole}, got ${data.user?.role}`);
      return false;
    }
    
    // Verify redirect URL
    const expectedRedirectUrl = `/${expectedRole.toLowerCase()}/dashboard`;
    if (!data.redirectUrl || !data.redirectUrl.includes(expectedRedirectUrl)) {
      console.error(`❌ Invalid redirect URL for ${email}. Expected to include ${expectedRedirectUrl}, got ${data.redirectUrl}`);
      return false;
    }
    
    console.log(`✅ Login successful for ${email} (${expectedRole})`);
    console.log(`   Token: ${data.token.substring(0, 20)}...`);
    console.log(`   User: ${data.user.name} (${data.user.email})`);
    console.log(`   Redirect URL: ${data.redirectUrl}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error during login test for ${email}:`, error);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting login tests for all roles...');
  
  const testUsers = [
    { email: 'admin1@example.com', password: 'Test123', role: 'ADMIN' },
    { email: 'business1@example.com', password: 'Test123', role: 'BUSINESS' },
    { email: 'courier1@example.com', password: 'Test123', role: 'COURIER' },
    { email: 'customer1@example.com', password: 'Test123', role: 'CUSTOMER' },
  ];
  
  let successes = 0;
  
  for (const user of testUsers) {
    const result = await testLogin(user.email, user.password, user.role);
    if (result) successes++;
  }
  
  console.log(`\n🏁 Login tests completed: ${successes}/${testUsers.length} successful`);
  
  if (successes === testUsers.length) {
    console.log('✅ All login tests passed successfully!');
  } else {
    console.error(`❌ Some login tests failed (${testUsers.length - successes}/${testUsers.length})`);
  }
}

// Run the tests
runTests().catch(console.error); 