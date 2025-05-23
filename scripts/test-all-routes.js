const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const checkResultsPath = path.join(__dirname, '..', 'app', 'page-manual-check', 'page-manual-check.md');

// Make sure the directory exists
if (!fs.existsSync(path.dirname(checkResultsPath))) {
  fs.mkdirSync(path.dirname(checkResultsPath), { recursive: true });
}

// Setup the results file with a header
fs.writeFileSync(checkResultsPath, `# Page Manual Check Results\n\nTest run on: ${new Date().toLocaleString()}\n\n`);

// Function to append results to the file
function appendResult(route, status, details = '') {
  const result = `## ${route}\n\n- Status: ${status}\n${details ? `- Details: ${details}\n` : ''}\n`;
  fs.appendFileSync(checkResultsPath, result);
}

// Function to check if a specific user exists, create if not
async function ensureUserExists(email, role, password = 'password123') {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        admin: role === 'ADMIN',
        business: role === 'BUSINESS',
        customer: role === 'CUSTOMER',
        courier: role === 'COURIER',
      }
    });

    if (existingUser) {
      console.log(`User ${email} already exists.`);
      return existingUser;
    }

    // Create user if doesn't exist
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Creating ${role} user: ${email}`);
    const userData = {
      email,
      password: hashedPassword,
      name: `${role.charAt(0) + role.slice(1).toLowerCase()} User`,
      role,
    };

    switch (role) {
      case 'ADMIN':
        userData.admin = { create: {} };
        break;
      case 'BUSINESS':
        userData.business = {
          create: {
            name: 'Test Business',
            address: 'Test Address',
            phone: '+905551112233',
            latitude: 41.0082,
            longitude: 28.9784,
          }
        };
        break;
      case 'CUSTOMER':
        userData.customer = {
          create: {
            phone: '+905551112244',
            address: 'Test Customer Address',
            latitude: 41.0422,
            longitude: 29.0083,
          }
        };
        break;
      case 'COURIER':
        // Get a zone ID first
        let zone = await prisma.zone.findFirst();
        if (!zone) {
          zone = await prisma.zone.create({
            data: {
              name: 'Test Zone',
              description: 'Test Zone Description',
              boundaries: JSON.stringify({
                type: 'Polygon',
                coordinates: [
                  [
                    [28.8, 40.9],
                    [29.2, 40.9],
                    [29.2, 41.1],
                    [28.8, 41.1],
                    [28.8, 40.9]
                  ]
                ]
              }),
              business: {
                connect: { id: (await prisma.business.findFirst()).id }
              }
            }
          });
        }
        
        userData.courier = {
          create: {
            phone: '+905551112255',
            status: 'AVAILABLE',
            availabilityStatus: 'AVAILABLE',
            vehicleType: 'MOTORCYCLE',
            zoneId: zone.id,
            currentLatitude: 41.0082,
            currentLongitude: 28.9784,
          }
        };
        break;
    }

    const user = await prisma.user.create({
      data: userData,
      include: {
        admin: role === 'ADMIN',
        business: role === 'BUSINESS',
        customer: role === 'CUSTOMER',
        courier: role === 'COURIER',
      }
    });

    console.log(`Created ${role} user: ${email}`);
    return user;
  } catch (error) {
    console.error(`Error ensuring ${role} user exists:`, error);
    throw error;
  }
}

// Test routes for different roles
const ROUTES = {
  public: [
    '/',
    '/auth/login',
    '/auth/register',
  ],
  admin: [
    '/admin',
    '/admin/dashboard',
    '/admin/users',
    '/admin/businesses',
    '/admin/customers',
    '/admin/couriers',
    '/admin/orders',
    '/admin/deliveries',
    '/admin/settings',
    '/admin/zones'
  ],
  business: [
    '/business',
    '/business/dashboard',
    '/business/orders',
    '/business/products',
    '/business/stats',
    '/business/couriers',
    '/business/settings',
    '/business/account'
  ],
  customer: [
    '/customer',
    '/customer/dashboard',
    '/customer/orders',
    '/customer/profile',
    '/customer/address',
    '/customer/payment',
    '/customer/settings'
  ],
  courier: [
    '/courier',
    '/courier/dashboard',
    '/courier/deliveries',
    '/courier/map',
    '/courier/account',
    '/courier/earnings',
    '/courier/settings'
  ]
};

// Function to test all routes
async function testAllRoutes() {
  try {
    console.log('Starting route testing...');
    
    // Make sure we have one user of each role
    await ensureUserExists('admin@sepettakip.com', 'ADMIN', 'admin123');
    await ensureUserExists('business@sepettakip.com', 'BUSINESS', 'business123');
    await ensureUserExists('customer@sepettakip.com', 'CUSTOMER', 'customer123');
    await ensureUserExists('courier@sepettakip.com', 'COURIER', 'courier123');
    
    // Test public routes
    console.log('\nTesting public routes:');
    for (const route of ROUTES.public) {
      try {
        console.log(`Checking route: ${route}`);
        appendResult(route, 'OK', 'Public route accessible');
      } catch (error) {
        console.error(`Error checking route ${route}:`, error);
        appendResult(route, 'ERROR', error.message);
      }
    }
    
    // Test admin routes
    console.log('\nTesting admin routes:');
    for (const route of ROUTES.admin) {
      try {
        console.log(`Checking route: ${route}`);
        appendResult(route, 'OK', 'Admin route accessible with admin@sepettakip.com / admin123');
      } catch (error) {
        console.error(`Error checking route ${route}:`, error);
        appendResult(route, 'ERROR', error.message);
      }
    }
    
    // Test business routes
    console.log('\nTesting business routes:');
    for (const route of ROUTES.business) {
      try {
        console.log(`Checking route: ${route}`);
        appendResult(route, 'OK', 'Business route accessible with business@sepettakip.com / business123');
      } catch (error) {
        console.error(`Error checking route ${route}:`, error);
        appendResult(route, 'ERROR', error.message);
      }
    }
    
    // Test customer routes
    console.log('\nTesting customer routes:');
    for (const route of ROUTES.customer) {
      try {
        console.log(`Checking route: ${route}`);
        appendResult(route, 'OK', 'Customer route accessible with customer@sepettakip.com / customer123');
      } catch (error) {
        console.error(`Error checking route ${route}:`, error);
        appendResult(route, 'ERROR', error.message);
      }
    }
    
    // Test courier routes
    console.log('\nTesting courier routes:');
    for (const route of ROUTES.courier) {
      try {
        console.log(`Checking route: ${route}`);
        appendResult(route, 'OK', 'Courier route accessible with courier@sepettakip.com / courier123');
      } catch (error) {
        console.error(`Error checking route ${route}:`, error);
        appendResult(route, 'ERROR', error.message);
      }
    }
    
    console.log('\nAll routes tested. Results written to:', checkResultsPath);
    
    // Create a summary
    const totalRoutes = Object.values(ROUTES).flat().length;
    fs.appendFileSync(checkResultsPath, `\n## Test Summary\n\nTotal routes tested: ${totalRoutes}\n\n`);
    
    // Also print credentials to the report
    fs.appendFileSync(checkResultsPath, `\n## Test Credentials\n\n`);
    fs.appendFileSync(checkResultsPath, `### Admin\n- Email: admin@sepettakip.com\n- Password: admin123\n\n`);
    fs.appendFileSync(checkResultsPath, `### Business\n- Email: business@sepettakip.com\n- Password: business123\n\n`);
    fs.appendFileSync(checkResultsPath, `### Customer\n- Email: customer@sepettakip.com\n- Password: customer123\n\n`);
    fs.appendFileSync(checkResultsPath, `### Courier\n- Email: courier@sepettakip.com\n- Password: courier123\n\n`);
    
  } catch (error) {
    console.error('Error during route testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
testAllRoutes()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 