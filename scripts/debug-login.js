const axios = require('axios');

// Test user credentials for direct login
const user = {
  email: 'admin1@example.com',
  password: 'Test123'
};

// Function to handle login
async function testDirectLogin() {
  console.log(`Testing direct login API for user: ${user.email}`);
  
  try {
    console.log('Sending request to /api/auth/direct endpoint...');
    const response = await axios.post('http://localhost:3001/api/auth/direct', user, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (response.data.success) {
      console.log('✅ Login successful!');
      console.log('User:', response.data.user);
      
      // Only display first part of token for security
      const token = response.data.token;
      console.log('Token:', token ? `${token.substring(0, 20)}...` : 'No token received');
      
      console.log('Redirect URL:', response.data.redirectUrl);
      
      // Test token validation
      if (token) {
        console.log('\nTesting token validation...');
        try {
          const validateResponse = await axios.get('http://localhost:3001/api/auth/validate', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('✅ Token validation successful!');
          console.log('Validated user:', validateResponse.data.user);
        } catch (validationError) {
          console.log('❌ Token validation failed:', validationError.message);
          if (validationError.response) {
            console.log('Error status:', validationError.response.status);
            console.log('Error data:', validationError.response.data);
          }
        }
      }
    } else {
      console.log('❌ Login failed!');
      console.log('Error message:', response.data.error || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Request failed!');
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Error status:', error.response.status);
      console.log('Error data:', error.response.data);
    }
  }
}

// Run the test
testDirectLogin().catch(error => {
  console.error('Script execution error:', error);
}); 