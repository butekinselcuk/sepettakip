import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Test data setup for end-to-end tests
 * This script ensures all required test users and data exists
 */
async function setupTestData() {
  console.log('Setting up test data for E2E tests...');
  
  try {
    // Create test users if they don't exist
    await createTestUsers();
    
    // Create test zones
    const zone = await createTestZone();
    
    // Create test orders
    await createTestOrders(zone.id);
    
    console.log('Test data setup completed successfully.');
  } catch (error) {
    console.error('Error setting up test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createTestUsers() {
  // Test user credentials
  const testUsers = [
    { email: '"admin@sepettakip.com"', password: 'admin123', name: 'Admin Test', role: 'ADMIN' },
    { email: '"business1@example.com"', password: 'business123', name: 'Business Test', role: 'BUSINESS' },
    { email: 'courier1@example.com', password: 'courier123', name: 'Courier Test', role: 'COURIER' },
    { email: 'customer1@example.com', password: 'customer123', name: 'Customer Test', role: 'CUSTOMER' },
  ];
  
  for (const userData of testUsers) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });
    
    if (!existingUser) {
      // Hash password and create user
      const hashedPassword = await hash(userData.password, 10);
      
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: userData.role
        }
      });
      
      console.log(`Created test user: ${userData.email} with role ${userData.role}`);
      
      // Create additional role-specific data
      if (userData.role === 'BUSINESS') {
        await prisma.business.create({
          data: {
            userId: user.id,
            name: 'Test Business',
            address: 'Test Business Address',
            phone: '+905551234567'
          }
        });
      } else if (userData.role === 'COURIER') {
        await prisma.courier.create({
          data: {
            userId: user.id,
            phone: '+905551234567',
            isActive: true,
            vehicleType: 'BICYCLE'
          }
        });
      } else if (userData.role === 'CUSTOMER') {
        await prisma.customer.create({
          data: {
            userId: user.id,
            address: 'Test Customer Address',
            phone: '+905551234567'
          }
        });
      } else if (userData.role === 'ADMIN') {
        await prisma.admin.create({
          data: {
            userId: user.id
          }
        });
      }
    } else {
      console.log(`Test user already exists: ${userData.email}`);
    }
  }
}

async function createTestZone() {
  // Get business user for zone association
  const businessUser = await prisma.user.findFirst({
    where: { email: 'business1@example.com' },
    include: { business: true }
  });
  
  if (!businessUser || !businessUser.business) {
    console.error('Business user not found, cannot create test zone');
    throw new Error('Business user not found');
  }
  
  const businessId = businessUser.business.id;
  
  // Check if zone already exists
  let zone = await prisma.zone.findFirst({
    where: { 
      businessId,
      name: 'Test Zone'
    }
  });
  
  if (!zone) {
    zone = await prisma.zone.create({
      data: {
        name: 'Test Zone',
        description: 'Test zone for e2e tests',
        boundaries: JSON.stringify([
          { lat: 41.01, lng: 28.97 },
          { lat: 41.02, lng: 28.97 },
          { lat: 41.02, lng: 28.98 },
          { lat: 41.01, lng: 28.98 }
        ]),
        businessId
      }
    });
    
    console.log(`Created test zone: ${zone.name}`);
  } else {
    console.log(`Test zone already exists: ${zone.name}`);
  }
  
  return zone;
}

async function createTestOrders(zoneId: string) {
  // Get customer user for order association
  const customerUser = await prisma.user.findFirst({
    where: { email: 'customer1@example.com' },
    include: { customer: true }
  });
  
  if (!customerUser || !customerUser.customer) {
    console.error('Customer user not found, cannot create test orders');
    throw new Error('Customer user not found');
  }
  
  const customerId = customerUser.customer.id;
  
  // Get business for order association
  const businessUser = await prisma.user.findFirst({
    where: { email: 'business1@example.com' },
    include: { business: true }
  });
  
  if (!businessUser || !businessUser.business) {
    console.error('Business not found, cannot create test orders');
    throw new Error('Business not found');
  }
  
  const businessId = businessUser.business.id;
  
  // Check if test order already exists
  const existingOrder = await prisma.order.findFirst({
    where: {
      customerId,
      status: 'PENDING'
    }
  });
  
  if (!existingOrder) {
    // Create a test order with sample items
    const items = JSON.stringify([
      { id: '1', name: 'Test Product 1', price: 99.99, quantity: 1 },
      { id: '2', name: 'Test Product 2', price: 149.99, quantity: 2 }
    ]);
    
    const order = await prisma.order.create({
      data: {
        customerId,
        businessId,
        zoneId,
        status: 'PENDING',
        items,
        totalPrice: 399.97, // 99.99 + (149.99 * 2)
        address: 'Test Delivery Address',
        notes: 'This is a test order created for E2E testing'
      }
    });
    
    console.log(`Created test order #${order.id}`);
  } else {
    console.log('Test order already exists');
  }
  
  // Create a courier for delivery tests
  const courierUser = await prisma.user.findFirst({
    where: { email: 'courier1@example.com' },
    include: { courier: true }
  });
  
  if (!courierUser || !courierUser.courier) {
    console.error('Courier user not found, cannot create test delivery');
    throw new Error('Courier user not found');
  }
  
  const courierId = courierUser.courier.id;
  
  // Check if test delivery exists
  const existingDelivery = await prisma.delivery.findFirst({
    where: {
      courierId,
      status: 'DELIVERED'
    }
  });
  
  if (!existingDelivery) {
    // Create a completed order for the delivery
    const completedOrder = await prisma.order.create({
      data: {
        customerId,
        businessId,
        zoneId,
        status: 'DELIVERED',
        items: JSON.stringify([
          { id: '3', name: 'Test Product 3', price: 299.99, quantity: 1 }
        ]),
        totalPrice: 299.99,
        address: 'Test Completed Delivery Address',
        notes: 'This is a completed test order for E2E testing'
      }
    });
    
    // Create delivery for completed order
    await prisma.delivery.create({
      data: {
        orderId: completedOrder.id,
        courierId,
        customerId,
        zoneId,
        status: 'DELIVERED',
        estimatedDuration: 30, // 30 minutes
        actualDuration: 25, // 25 minutes
        pickupAddress: 'Test Business Address',
        pickupLatitude: 41.01,
        pickupLongitude: 28.97,
        dropoffAddress: 'Test Completed Delivery Address',
        dropoffLatitude: 41.02,
        dropoffLongitude: 28.98,
        assignedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        pickedUpAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        deliveredAt: new Date(), // Now
        distance: 2.5, // 2.5 km
        actualDistance: 2.7, // 2.7 km
        notes: 'This is a test delivery'
      }
    });
    
    console.log(`Created completed test order #${completedOrder.id} with delivery`);
  } else {
    console.log('Completed test delivery already exists');
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupTestData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to set up test data:', error);
      process.exit(1);
    });
}

export { setupTestData }; 