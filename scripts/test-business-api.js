const axios = require('axios');

// Test business API with authentication
async function testBusinessAPI() {
  console.log('Testing business API...');
  
  // 1. First login to get token
  let token;
  try {
    console.log('Logging in as business user...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'business1@example.com',
      password: 'Test123'
    });
    
    token = loginResponse.data.token;
    console.log(`Login successful, received token: ${token.substring(0, 20)}...`);
  } catch (error) {
    console.error('Login error:');
    console.error(error.response?.data || error.message);
    return;
  }
  
  // Configure axios with auth token
  const authClient = axios.create({
    baseURL: 'http://localhost:3001',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  // 2. Test business stats API
  try {
    console.log('\nTesting business stats API...');
    const statsResponse = await authClient.get('/api/business/stats');
    console.log('Business stats response:');
    console.log(JSON.stringify(statsResponse.data, null, 2));
  } catch (error) {
    console.error('Error fetching business stats:');
    console.error(error.response?.data || error.message);
  }
  
  // 3. Test business orders API
  try {
    console.log('\nTesting business orders API...');
    const ordersResponse = await authClient.get('/api/business/orders');
    console.log('Business orders response:');
    console.log(`Total orders: ${ordersResponse.data.orders?.length || 0}`);
    
    if (ordersResponse.data.orders?.length > 0) {
      console.log('First order details:');
      console.log(JSON.stringify(ordersResponse.data.orders[0], null, 2));
    }
  } catch (error) {
    console.error('Error fetching business orders:');
    console.error(error.response?.data || error.message);
  }
  
  // 4. Test business products API
  try {
    console.log('\nTesting business products API...');
    const productsResponse = await authClient.get('/api/business/orders/chart');
    console.log('Business products chart response:');
    console.log(JSON.stringify(productsResponse.data, null, 2));
  } catch (error) {
    console.error('Error fetching business products:');
    console.error(error.response?.data || error.message);
  }
  
  console.log('\nBusiness API tests completed!');
}

// Run tests
testBusinessAPI().catch(error => {
  console.error('Unhandled error during tests:', error);
}); 