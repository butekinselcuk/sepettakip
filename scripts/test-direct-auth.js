const axios = require('axios');

// Test users credentials
const users = [
  { role: 'admin', email: 'admin1@example.com', password: 'Test123' },
  { role: 'business', email: 'business1@example.com', password: 'Test123' },
  { role: 'courier', email: 'courier1@example.com', password: 'Test123' },
  { role: 'customer', email: 'customer1@example.com', password: 'Test123' }
];

async function testDirectAuth(user) {
  console.log(`Testing direct auth for ${user.role} user: ${user.email}`);
  
  try {
    console.log(`Sending request to http://localhost:3001/api/auth/direct`);
    const response = await axios.post('http://localhost:3001/api/auth/direct', {
      email: user.email,
      password: user.password
    });
    
    if (response.data && response.data.success) {
      console.log(`✅ Authentication successful for ${user.role}`);
      console.log(`Token: ${response.data.token.substring(0, 20)}...`);
      console.log(`User: ${JSON.stringify(response.data.user, null, 2)}`);
      console.log(`Redirect to: ${response.data.redirectUrl}`);
    } else {
      console.log(`❌ Authentication failed for ${user.role}: ${response.data?.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ Authentication failed for ${user.role}`);
    
    if (error.response) {
      // Sunucu yanıtı ile dönen hata
      console.log(`Status: ${error.response.status}`);
      console.log(`Error message: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      // İstek yapıldı ama yanıt alınamadı
      console.log(`No response received: ${error.message}`);
    } else {
      // İstek yapılırken hata oluştu
      console.log(`Request error: ${error.message}`);
    }
  }
  
  console.log('-----------------------------------');
}

async function main() {
  console.log('Starting direct authentication tests...');
  
  for (const user of users) {
    await testDirectAuth(user);
  }
  
  console.log('Direct authentication tests completed.');
}

main().catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
}); 