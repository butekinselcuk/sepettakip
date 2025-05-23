import { prisma } from '../lib/prisma';
import { signJwtToken } from '../lib/auth';
import { log } from '../lib/logger';
import { PrismaClient } from '@prisma/client';

/**
 * Comprehensive permission testing utility for the SepetTakip application
 * This script tests access controls for different roles across various endpoints
 */

// Define test user data for each role
const TEST_USERS = {
  ADMIN: {
    email: 'admin-test@sepettakip.com',
    name: 'Test Admin',
    password: 'test-password-123'
  },
  BUSINESS: {
    email: 'business-test@sepettakip.com',
    name: 'Test Business',
    password: 'test-password-123'
  },
  COURIER: {
    email: 'courier-test@sepettakip.com',
    name: 'Test Courier',
    password: 'test-password-123'
  },
  CUSTOMER: {
    email: 'customer-test@sepettakip.com',
    name: 'Test Customer',
    password: 'test-password-123'
  }
};

// Define all endpoints to test
const TEST_ENDPOINTS = [
  // Admin endpoints
  { path: '/api/admin/dashboard', methods: ['GET'], allowedRoles: ['ADMIN'] },
  { path: '/api/admin/users', methods: ['GET', 'POST'], allowedRoles: ['ADMIN'] },
  { path: '/api/admin/users/:id', methods: ['GET', 'PUT', 'DELETE'], allowedRoles: ['ADMIN'] },
  { path: '/api/admin/settings', methods: ['GET', 'PUT'], allowedRoles: ['ADMIN'] },
  
  // Business endpoints
  { path: '/api/business/profile', methods: ['GET', 'PUT'], allowedRoles: ['ADMIN', 'BUSINESS'] },
  { path: '/api/business/orders', methods: ['GET'], allowedRoles: ['ADMIN', 'BUSINESS'] },
  { path: '/api/business/products', methods: ['GET', 'POST'], allowedRoles: ['ADMIN', 'BUSINESS'] },
  { path: '/api/business/products/:id', methods: ['GET', 'PUT', 'DELETE'], allowedRoles: ['ADMIN', 'BUSINESS'] },
  
  // Courier endpoints
  { path: '/api/courier/profile', methods: ['GET', 'PUT'], allowedRoles: ['ADMIN', 'COURIER'] },
  { path: '/api/courier/deliveries', methods: ['GET'], allowedRoles: ['ADMIN', 'COURIER'] },
  { path: '/api/courier/earnings', methods: ['GET'], allowedRoles: ['ADMIN', 'COURIER'] },
  { path: '/api/courier/location', methods: ['POST'], allowedRoles: ['COURIER'] },
  
  // Customer endpoints
  { path: '/api/customer/profile', methods: ['GET', 'PUT'], allowedRoles: ['ADMIN', 'CUSTOMER'] },
  { path: '/api/customer/orders', methods: ['GET', 'POST'], allowedRoles: ['ADMIN', 'CUSTOMER'] },
  
  // General endpoints
  { path: '/api/orders', methods: ['GET'], allowedRoles: ['ADMIN', 'BUSINESS', 'COURIER'] },
  { path: '/api/orders/:id', methods: ['GET'], allowedRoles: ['ADMIN', 'BUSINESS', 'COURIER', 'CUSTOMER'] },
  { path: '/api/orders/:id/status', methods: ['PUT'], allowedRoles: ['ADMIN', 'BUSINESS', 'COURIER'] },
  
  // Authentication endpoints (no token required)
  { path: '/api/auth/login', methods: ['POST'], allowedRoles: ['PUBLIC'] },
  { path: '/api/auth/register', methods: ['POST'], allowedRoles: ['PUBLIC'] },
  { path: '/api/auth/refresh', methods: ['POST'], allowedRoles: ['PUBLIC'] }
];

// Store test users and their tokens
let testUsers: Record<string, { id: string; token: string }> = {};

/**
 * Setup test users
 */
async function setupTestUsers() {
  log.info('Setting up test users...');
  
  for (const [role, userData] of Object.entries(TEST_USERS)) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });
    
    if (existingUser) {
      // Generate token for existing user
      const token = await signJwtToken({
        userId: existingUser.id,
        email: existingUser.email,
        role: role as any
      });
      
      testUsers[role] = {
        id: existingUser.id,
        token
      };
      
      log.info(`Using existing test user for ${role} role`);
    } else {
      // Create new test user
      log.info(`Creating new test user for ${role} role`);
      
      // Add more specific setup based on role
      try {
        // This is a simplified version - in a real implementation, you would
        // create proper user accounts with hashed passwords, etc.
        const user = await prisma.user.create({
          data: {
            email: userData.email,
            name: userData.name,
            password: userData.password, // In real app, this would be hashed
            role: role
          }
        });
        
        // Generate token
        const token = await signJwtToken({
          userId: user.id,
          email: user.email,
          role: role as any
        });
        
        testUsers[role] = {
          id: user.id,
          token
        };
        
        // Create additional data based on role
        if (role === 'BUSINESS') {
          await prisma.business.create({
            data: {
              userId: user.id,
              businessName: 'Test Business',
              address: 'Test Address',
              phone: '+905551234567'
            }
          });
        } else if (role === 'COURIER') {
          await prisma.courier.create({
            data: {
              userId: user.id,
              status: 'ACTIVE',
              phone: '+905551234567'
            }
          });
        } else if (role === 'CUSTOMER') {
          await prisma.customer.create({
            data: {
              userId: user.id,
              address: 'Test Customer Address',
              phone: '+905551234567'
            }
          });
        }
      } catch (error) {
        log.error(`Error creating test user for ${role}`, error);
      }
    }
  }
}

/**
 * Test endpoints against different roles
 */
async function testPermissions() {
  log.info('Starting permission tests...');
  
  // Record test results
  const testResults: Array<{
    endpoint: string;
    method: string;
    role: string;
    expected: boolean;
    actual: boolean;
    statusCode: number;
  }> = [];
  
  // Test each endpoint with each role
  for (const endpoint of TEST_ENDPOINTS) {
    for (const method of endpoint.methods) {
      for (const [role, userData] of Object.entries(testUsers)) {
        const isAllowed = endpoint.allowedRoles.includes(role) || endpoint.allowedRoles.includes('PUBLIC');
        
        // Skip public endpoints for authenticated tests
        if (endpoint.allowedRoles.includes('PUBLIC') && role !== 'PUBLIC') {
          continue;
        }
        
        // Prepare request URL (replace any path parameters)
        let url = `http://localhost:3000${endpoint.path}`;
        if (url.includes(':id')) {
          // Replace :id with an appropriate ID based on the context
          if (url.includes('/api/business/products/:id')) {
            url = url.replace(':id', 'sample-product-id');
          } else if (url.includes('/api/orders/:id')) {
            url = url.replace(':id', 'sample-order-id');
          } else if (url.includes('/api/admin/users/:id')) {
            url = url.replace(':id', userData.id);
          } else {
            url = url.replace(':id', 'sample-id');
          }
        }
        
        try {
          // Prepare headers and request options
          const headers: HeadersInit = {
            'Content-Type': 'application/json'
          };
          
          // Add authorization header for authenticated requests
          if (role !== 'PUBLIC') {
            headers['Authorization'] = `Bearer ${userData.token}`;
          }
          
          // Prepare request body for POST/PUT methods
          let body = null;
          if (method === 'POST' || method === 'PUT') {
            // Simple dummy data
            body = JSON.stringify({ test: true });
          }
          
          // Send request
          log.info(`Testing ${method} ${url} with role ${role}`);
          const response = await fetch(url, {
            method,
            headers,
            body
          });
          
          // Check results
          const statusCode = response.status;
          const actualAllowed = statusCode < 400; // Consider any non-4xx response as allowed
          
          testResults.push({
            endpoint: endpoint.path,
            method,
            role,
            expected: isAllowed,
            actual: actualAllowed,
            statusCode
          });
          
          // Log immediate results
          if (isAllowed === actualAllowed) {
            log.info(`✅ ${method} ${endpoint.path} for ${role}: ${statusCode}`);
          } else {
            log.error(`❌ ${method} ${endpoint.path} for ${role}: Expected ${isAllowed ? 'allowed' : 'denied'}, got ${statusCode}`);
          }
        } catch (error) {
          log.error(`Error testing ${method} ${endpoint.path} for ${role}`, error);
          
          // Record the error as a failed test
          testResults.push({
            endpoint: endpoint.path,
            method,
            role,
            expected: isAllowed,
            actual: false,
            statusCode: 0 // Error
          });
        }
      }
    }
  }
  
  // Generate final report
  generateReport(testResults);
}

/**
 * Generate and print the test report
 */
function generateReport(results: Array<{
  endpoint: string;
  method: string;
  role: string;
  expected: boolean;
  actual: boolean;
  statusCode: number;
}>) {
  log.info('PERMISSION TEST REPORT');
  log.info('=====================');
  
  // Calculate statistics
  const total = results.length;
  const passed = results.filter(r => r.expected === r.actual).length;
  const failed = total - passed;
  const passRate = (passed / total * 100).toFixed(2);
  
  log.info(`Total tests: ${total}`);
  log.info(`Passed: ${passed} (${passRate}%)`);
  log.info(`Failed: ${failed}`);
  log.info('=====================');
  
  // List failed tests
  if (failed > 0) {
    log.info('Failed tests:');
    results
      .filter(r => r.expected !== r.actual)
      .forEach(r => {
        log.info(`- ${r.method} ${r.endpoint} (${r.role}): Expected ${r.expected ? 'allow' : 'deny'}, got ${r.statusCode}`);
      });
  }
  
  // Results per role
  log.info('=====================');
  log.info('Results per role:');
  
  const roles = [...new Set(results.map(r => r.role))];
  for (const role of roles) {
    const roleTests = results.filter(r => r.role === role);
    const rolePassed = roleTests.filter(r => r.expected === r.actual).length;
    const rolePassRate = (rolePassed / roleTests.length * 100).toFixed(2);
    
    log.info(`${role}: ${rolePassed}/${roleTests.length} (${rolePassRate}%)`);
  }
}

/**
 * Cleanup test data
 */
async function cleanup(deleteUsers = false) {
  // If requested, delete the test users after the test
  if (deleteUsers) {
    log.info('Cleaning up test users...');
    
    for (const userData of Object.values(TEST_USERS)) {
      await prisma.user.delete({
        where: { email: userData.email }
      }).catch(e => {
        // Ignore errors if user doesn't exist
        log.debug(`Could not delete test user: ${userData.email}`, { error: e });
      });
    }
  }
  
  await prisma.$disconnect();
}

/**
 * Run the permission tests
 */
async function runTests(options = { cleanup: false }) {
  try {
    await setupTestUsers();
    await testPermissions();
    
    if (options.cleanup) {
      await cleanup(true);
    }
    
    log.info('Permission tests completed');
  } catch (error) {
    log.error('Error running permission tests', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests when this script is executed directly
if (require.main === module) {
  runTests({ cleanup: false })
    .then(() => log.info('All tests completed'))
    .catch(err => log.error('Error running tests', err));
}

export default runTests; 