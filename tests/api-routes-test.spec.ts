import { test, expect, Page, APIResponse } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Test credentials for all roles
const ROLE_CREDENTIALS = {
  admin: { email: 'admin1@example.com', password: 'Test123' },
  courier: { email: 'courier1@example.com', password: 'Test123' },
  business: { email: 'business1@example.com', password: 'Test123' },
  customer: { email: 'customer1@example.com', password: 'Test123' },
};

// API endpoints to test for each role
const ROLE_ENDPOINTS = {
  admin: [
    '/api/admin/users',
    '/api/admin/dashboard',
    '/api/admin/businesses',
    '/api/admin/couriers'
  ],
  courier: [
    '/api/courier/profile',
    '/api/courier/settings',
    '/api/courier/deliveries',
    '/api/courier/availability'
  ],
  business: [
    '/api/business/profile',
    '/api/business/settings',
    '/api/business/products',
    '/api/business/orders'
  ],
  customer: [
    '/api/customer/profile',
    '/api/customer/settings',
    '/api/customer/orders',
    '/api/customer/addresses'
  ],
  public: [
    '/api/auth/login',
    '/api/auth/register'
  ]
};

// Path for report file
const REPORT_PATH = 'app/page-manual-check/page-manual-check.md';

// Helper function to append results to report file
async function appendToReport(result: string) {
  let reportDir = path.dirname(REPORT_PATH);
  let reportPath = path.join(process.cwd(), REPORT_PATH);
  
  // Ensure directory exists
  if (!fs.existsSync(path.join(process.cwd(), reportDir))) {
    fs.mkdirSync(path.join(process.cwd(), reportDir), { recursive: true });
  }
  
  // Check if file exists and read it
  let content = '';
  if (fs.existsSync(reportPath)) {
    content = fs.readFileSync(reportPath, 'utf8');
  }

  // Append new result
  const timestamp = new Date().toLocaleTimeString('tr-TR', { hour12: false });
  content += `\n### API Test: ${timestamp}\n\n${result}\n`;
  
  // Write back to file
  fs.writeFileSync(reportPath, content, 'utf8');
}

// Get a nice display name for roles
function getRoleName(role: string): string {
  switch(role) {
    case 'admin': return 'Admin';
    case 'courier': return 'Kurye';
    case 'business': return 'İşletme';
    case 'customer': return 'Müşteri';
    case 'public': return 'Public';
    default: return role;
  }
}

// Test auth endpoints (no authentication required)
test.describe('Public API Tests', () => {
  test('Auth endpoints test', async ({ request }) => {
    const endpoints = ROLE_ENDPOINTS.public;
    
    for (const endpoint of endpoints) {
      try {
        let response: APIResponse;
        
        if (endpoint === '/api/auth/login') {
          // Test login with valid credentials
          response = await request.post(endpoint, {
            data: ROLE_CREDENTIALS.admin
          });
        } else if (endpoint === '/api/auth/register') {
          // Just check if the endpoint exists, don't actually register
          response = await request.head(endpoint);
        } else {
          response = await request.get(endpoint);
        }
        
        const status = response.status();
        
        if (status === 200) {
          await appendToReport(`✅ Public API - ${endpoint} responds successfully with status ${status}`);
        } else if (status === 401 || status === 403) {
          await appendToReport(`✅ Public API - ${endpoint} requires authentication (${status})`);
        } else {
          await appendToReport(`⚠️ Public API - ${endpoint} responds with unexpected status ${status}`);
        }
      } catch (error: any) {
        await appendToReport(`❌ Public API - Error testing ${endpoint}: ${error.message}`);
      }
    }
  });
});

// Test authenticated endpoints for each role
for (const [role, credentials] of Object.entries(ROLE_CREDENTIALS)) {
  test.describe(`${getRoleName(role)} API Tests`, () => {
    test.setTimeout(60000); // 1 minute timeout
    
    test(`${getRoleName(role)} API endpoints test`, async ({ request }) => {
      // First login to get a token
      let token: string | null = null;
      
      try {
        const loginResponse = await request.post('/api/auth/login', {
          data: credentials
        });
        
        const responseData = await loginResponse.json().catch(() => null);
        token = responseData?.token || null;
        
        if (token) {
          await appendToReport(`✅ ${getRoleName(role)} login API successful, received token`);
        } else {
          await appendToReport(`❌ ${getRoleName(role)} login API failed, no token received`);
          return; // Stop testing further endpoints if login fails
        }
      } catch (error: any) {
        await appendToReport(`❌ ${getRoleName(role)} login API error: ${error.message}`);
        return; // Stop testing further endpoints if login fails
      }
      
      // Test role-specific endpoints with the token
      const endpoints = ROLE_ENDPOINTS[role as keyof typeof ROLE_ENDPOINTS] || [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await request.get(endpoint, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const status = response.status();
          
          if (status === 200) {
            await appendToReport(`✅ ${getRoleName(role)} API - ${endpoint} responds successfully with status ${status}`);
          } else if (status === 401 || status === 403) {
            await appendToReport(`⚠️ ${getRoleName(role)} API - ${endpoint} authentication issue (${status})`);
          } else {
            await appendToReport(`⚠️ ${getRoleName(role)} API - ${endpoint} responds with unexpected status ${status}`);
          }
          
          // Get response details for debugging
          const responseText = await response.text().catch(() => "No response body");
          console.log(`${getRoleName(role)} - ${endpoint}: Status ${status}, Response: ${responseText.substring(0, 100)}...`);
          
        } catch (error: any) {
          await appendToReport(`❌ ${getRoleName(role)} API - Error testing ${endpoint}: ${error.message}`);
        }
      }
    });
  });
} 