// test-fetch.mjs - Simple test script using built-in fetch
// Run with: node test-fetch.mjs

async function testHealthApi() {
  console.log('Testing health API...');
  try {
    const response = await fetch('http://localhost:3001/api/health');
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Health data:', data);
    return true;
  } catch (error) {
    console.error('Error testing health API:', error.message);
    return false;
  }
}

async function testLoginApi() {
  console.log('\nTesting login API...');
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'Test123'
      })
    });
    
    console.log('Status:', response.status);
    try {
      const data = await response.json();
      console.log('Login response:', data);
      if (data.token) {
        return data.token;
      }
    } catch (e) {
      console.log('Could not parse response as JSON');
      const text = await response.text();
      console.log('Response text:', text.substring(0, 200));
    }
  } catch (error) {
    console.error('Error testing login API:', error.message);
  }
  return null;
}

async function testAdminDashboardApi(token) {
  if (!token) {
    console.log('\nSkipping admin dashboard test - no token available');
    return;
  }
  
  console.log('\nTesting admin dashboard API with token...');
  try {
    const response = await fetch('http://localhost:3001/api/admin/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cookie': `token=${token}`
      }
    });
    
    console.log('Status:', response.status);
    try {
      const data = await response.json();
      console.log('Dashboard response:', JSON.stringify(data).substring(0, 500) + '...');
    } catch (e) {
      console.log('Could not parse response as JSON');
      const text = await response.text();
      console.log('Response text:', text.substring(0, 200));
    }
  } catch (error) {
    console.error('Error testing admin dashboard API:', error.message);
  }
}

// Run tests
async function runTests() {
  const healthOk = await testHealthApi();
  if (healthOk) {
    const token = await testLoginApi();
    await testAdminDashboardApi(token);
  }
  console.log('\nTests completed');
}

runTests().catch(console.error); 