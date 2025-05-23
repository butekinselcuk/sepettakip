const axios = require('axios');

async function testLoginAPI() {
  console.log('Testing login API...');
  
  const users = [
    { email: 'admin1@example.com', password: 'Test123', role: 'ADMIN' },
    { email: 'business1@example.com', password: 'Test123', role: 'BUSINESS' },
    { email: 'courier1@example.com', password: 'Test123', role: 'COURIER' },
    { email: 'customer1@example.com', password: 'Test123', role: 'CUSTOMER' }
  ];
  
  for (const user of users) {
    console.log(`Testing login for ${user.email} (${user.role})...`);
    
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        email: user.email,
        password: user.password
      });
      
      const { success, token, redirectUrl } = response.data;
      
      console.log(`Login successful: ${success}`);
      console.log(`Received token: ${token ? token.substring(0, 20) + '...' : 'No token'}`);
      console.log(`Redirect URL: ${redirectUrl}`);
      console.log('----------------------------------------');
    } catch (error) {
      console.error(`Error logging in as ${user.email}:`);
      console.error(error.response?.data || error.message);
      console.log('----------------------------------------');
    }
  }
}

// Test logout API
async function testLogoutAPI() {
  console.log('\nTesting logout API...');
  
  try {
    const response = await axios.post('http://localhost:3001/api/auth/logout');
    console.log('Logout response:', response.data);
  } catch (error) {
    console.error('Error during logout:');
    console.error(error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  await testLoginAPI();
  await testLogoutAPI();
  console.log('\nAPI tests completed!');
}

// Start tests
runTests().catch(error => {
  console.error('Unhandled error during tests:', error);
}); 