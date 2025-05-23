import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Sets up test data for end-to-end tests
 */
async function setupTestData() {
  const reportPath = path.join(process.cwd(), 'app/page-manual-check/page-manual-check.md');
  const timestamp = new Date().toISOString();
  let reportContent = `\n\n## Test Data Setup Results - ${timestamp}\n\n`;

  try {
    // First, clean up any existing test data
    await cleanupData();
    reportContent += "✅ Cleaned up existing test data successfully\n";

    // Create test users and their respective roles
    await createTestUsers();
    reportContent += "✅ Created test users (admin, businesses, couriers, customers) successfully\n";

    // Create test zones for businesses
    const zones = await createTestZones();
    reportContent += "✅ Created test zones successfully\n";

    // Create test orders and deliveries
    await createTestOrdersAndDeliveries(zones);
    reportContent += "✅ Created test orders and deliveries successfully\n";

    reportContent += "\n### Summary\n";
    reportContent += "- 1 admin user created\n";
    reportContent += "- 2 business users created\n";
    reportContent += "- 2 courier users created\n";
    reportContent += "- 3 customer users created\n";
    reportContent += "- 4 zones created\n";
    reportContent += "- 5 orders created with various statuses\n";
    reportContent += "- 4 deliveries created\n";

  } catch (error: any) {
    console.error('Error setting up test data:', error);
    reportContent += `❌ Error setting up test data: ${error.message}\n`;
    reportContent += `\`\`\`\n${error.stack}\n\`\`\`\n`;
  } finally {
    // Append the report content to the file
    if (fs.existsSync(reportPath)) {
      fs.appendFileSync(reportPath, reportContent);
    } else {
      fs.writeFileSync(reportPath, reportContent);
    }
  }

  console.log('Test data setup complete');
}

/**
 * Cleans up existing test data from the database
 */
async function cleanupData() {
  // Delete in reverse order to avoid foreign key constraints
  console.log('Cleaning up existing test data...');
  
  // Delete deliveries
  await prisma.delivery.deleteMany({
    where: {
      OR: [
        { customer: { user: { email: { contains: 'customer' } } } },
        { courier: { user: { email: { contains: 'courier' } } } }
      ]
    }
  });
  
  // Delete orders
  await prisma.order.deleteMany({
    where: {
      OR: [
        { customer: { user: { email: { contains: 'customer' } } } },
        { business: { user: { email: { contains: 'business' } } } }
      ]
    }
  });

  // Delete zones
  await prisma.zone.deleteMany({
    where: {
      business: { user: { email: { contains: 'business' } } }
    }
  });

  // Delete customers
  await prisma.customer.deleteMany({
    where: {
      user: { email: { contains: 'customer' } }
    }
  });

  // Delete couriers
  await prisma.courier.deleteMany({
    where: {
      user: { email: { contains: 'courier' } }
    }
  });

  // Delete businesses
  await prisma.business.deleteMany({
    where: {
      user: { email: { contains: 'business' } }
    }
  });

  // Delete admins
  await prisma.admin.deleteMany({
    where: {
      user: { email: { contains: 'admin' } }
    }
  });

  // Delete users
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { contains: 'admin' } },
        { email: { contains: 'business' } },
        { email: { contains: 'courier' } },
        { email: { contains: 'customer' } }
      ]
    }
  });

  console.log('Cleanup complete');
}

/**
 * Creates test users for all roles
 */
async function createTestUsers() {
  console.log('Creating test users...');
  
  // Hash the common test password
  const hashedPassword = await bcrypt.hash('Test123', 10);
  
  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin1@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      admin: {
        create: {}
      }
    },
    include: {
      admin: true
    }
  });
  
  console.log(`Created admin user: ${adminUser.email}`);
  
  // Create customer users
  const customer1 = await prisma.user.create({
    data: {
      email: 'customer1@example.com',
      password: hashedPassword,
      name: 'Customer One',
      role: 'CUSTOMER',
      customer: {
        create: {
          phone: '+90 555 123 4567',
          address: 'Bahçelievler Mah. Atatürk Cad. No:123 İstanbul',
          latitude: 41.0082,
          longitude: 28.9784
        }
      }
    },
    include: {
      customer: true
    }
  });
  
  const customer2 = await prisma.user.create({
    data: {
      email: 'customer2@example.com',
      password: hashedPassword,
      name: 'Customer Two',
      role: 'CUSTOMER',
      customer: {
        create: {
          phone: '+90 555 765 4321',
          address: 'Kadıköy Mah. Bağdat Cad. No:456 İstanbul',
          latitude: 40.9891,
          longitude: 29.0253
        }
      }
    },
    include: {
      customer: true
    }
  });
  
  const customer3 = await prisma.user.create({
    data: {
      email: 'customer3@example.com',
      password: hashedPassword,
      name: 'Customer Three',
      role: 'CUSTOMER',
      customer: {
        create: {
          phone: '+90 555 987 6543',
          address: 'Etiler Mah. Nispetiye Cad. No:789 İstanbul',
          latitude: 41.0811,
          longitude: 29.0320
        }
      }
    },
    include: {
      customer: true
    }
  });
  
  console.log(`Created customer users: ${customer1.email}, ${customer2.email}, ${customer3.email}`);
  
  // Create business users
  const business1 = await prisma.user.create({
    data: {
      email: 'business1@example.com',
      password: hashedPassword,
      name: 'Business One Manager',
      role: 'BUSINESS',
      business: {
        create: {
          name: 'Lezzetli Yemekler',
          address: 'Mecidiyeköy Mah. Büyükdere Cad. No:120 İstanbul',
          phone: '+90 212 123 4567',
          latitude: 41.0682,
          longitude: 28.9959
        }
      }
    },
    include: {
      business: true
    }
  });
  
  const business2 = await prisma.user.create({
    data: {
      email: 'business2@example.com',
      password: hashedPassword,
      name: 'Business Two Manager',
      role: 'BUSINESS',
      business: {
        create: {
          name: 'Tatlı Pasta Dükkanı',
          address: 'Beyoğlu Mah. İstiklal Cad. No:42 İstanbul',
          phone: '+90 212 987 6543',
          latitude: 41.0362,
          longitude: 28.9850
        }
      }
    },
    include: {
      business: true
    }
  });
  
  console.log(`Created business users: ${business1.email}, ${business2.email}`);
  
  // Create courier users
  const courier1 = await prisma.user.create({
    data: {
      email: 'courier1@example.com',
      password: hashedPassword,
      name: 'Courier One',
      role: 'COURIER',
      courier: {
        create: {
          phone: '+90 555 111 2222',
          latitude: 41.0255,
          longitude: 28.9755,
          isActive: true,
          vehicleType: 'MOTORCYCLE'
        }
      }
    },
    include: {
      courier: true
    }
  });
  
  const courier2 = await prisma.user.create({
    data: {
      email: 'courier2@example.com',
      password: hashedPassword,
      name: 'Courier Two',
      role: 'COURIER',
      courier: {
        create: {
          phone: '+90 555 333 4444',
          latitude: 41.0419,
          longitude: 29.0108,
          isActive: true,
          vehicleType: 'CAR'
        }
      }
    },
    include: {
      courier: true
    }
  });
  
  console.log(`Created courier users: ${courier1.email}, ${courier2.email}`);
  
  return {
    adminUser,
    customer1,
    customer2,
    customer3,
    business1,
    business2,
    courier1,
    courier2
  };
}

/**
 * Creates test zones for businesses
 */
async function createTestZones() {
  console.log('Creating test zones...');
  
  // Get businesses
  const business1 = await prisma.business.findFirst({
    where: { user: { email: 'business1@example.com' } }
  });
  
  if (!business1) {
    throw new Error('Business 1 not found');
  }
  
  const business2 = await prisma.business.findFirst({
    where: { user: { email: 'business2@example.com' } }
  });
  
  if (!business2) {
    throw new Error('Business 2 not found');
  }
  
  // Create zones for business1
  const zone1 = await prisma.zone.create({
    data: {
      name: 'Şişli Bölgesi',
      description: 'Şişli ve çevresi',
      boundaries: JSON.stringify([
        { lat: 41.0682, lng: 28.9859 },
        { lat: 41.0582, lng: 28.9959 },
        { lat: 41.0782, lng: 28.9959 },
        { lat: 41.0682, lng: 28.9759 }
      ]),
      businessId: business1.id
    }
  });
  
  const zone2 = await prisma.zone.create({
    data: {
      name: 'Beşiktaş Bölgesi',
      description: 'Beşiktaş ve çevresi',
      boundaries: JSON.stringify([
        { lat: 41.0422, lng: 29.0059 },
        { lat: 41.0322, lng: 29.0159 },
        { lat: 41.0522, lng: 29.0159 },
        { lat: 41.0422, lng: 28.9959 }
      ]),
      businessId: business1.id
    }
  });
  
  // Create zones for business2
  const zone3 = await prisma.zone.create({
    data: {
      name: 'Beyoğlu Bölgesi',
      description: 'Beyoğlu ve çevresi',
      boundaries: JSON.stringify([
        { lat: 41.0362, lng: 28.9750 },
        { lat: 41.0262, lng: 28.9850 },
        { lat: 41.0462, lng: 28.9850 },
        { lat: 41.0362, lng: 28.9650 }
      ]),
      businessId: business2.id
    }
  });
  
  const zone4 = await prisma.zone.create({
    data: {
      name: 'Kadıköy Bölgesi',
      description: 'Kadıköy ve çevresi',
      boundaries: JSON.stringify([
        { lat: 40.9891, lng: 29.0153 },
        { lat: 40.9791, lng: 29.0253 },
        { lat: 40.9991, lng: 29.0253 },
        { lat: 40.9891, lng: 29.0053 }
      ]),
      businessId: business2.id
    }
  });
  
  console.log(`Created zones: ${zone1.name}, ${zone2.name}, ${zone3.name}, ${zone4.name}`);
  
  return { zone1, zone2, zone3, zone4 };
}

/**
 * Creates test orders and deliveries
 */
async function createTestOrdersAndDeliveries(zones: { 
  zone1: { id: string }, 
  zone2: { id: string }, 
  zone3: { id: string }, 
  zone4: { id: string } 
}) {
  console.log('Creating test orders and deliveries...');
  
  // Get users
  const customer1 = await prisma.customer.findFirst({
    where: { user: { email: 'customer1@example.com' } }
  });
  
  if (!customer1) {
    throw new Error('Customer 1 not found');
  }
  
  const customer2 = await prisma.customer.findFirst({
    where: { user: { email: 'customer2@example.com' } }
  });
  
  if (!customer2) {
    throw new Error('Customer 2 not found');
  }
  
  const customer3 = await prisma.customer.findFirst({
    where: { user: { email: 'customer3@example.com' } }
  });
  
  if (!customer3) {
    throw new Error('Customer 3 not found');
  }
  
  const business1 = await prisma.business.findFirst({
    where: { user: { email: 'business1@example.com' } }
  });
  
  if (!business1) {
    throw new Error('Business 1 not found');
  }
  
  const business2 = await prisma.business.findFirst({
    where: { user: { email: 'business2@example.com' } }
  });
  
  if (!business2) {
    throw new Error('Business 2 not found');
  }
  
  const courier1 = await prisma.courier.findFirst({
    where: { user: { email: 'courier1@example.com' } }
  });
  
  if (!courier1) {
    throw new Error('Courier 1 not found');
  }
  
  const courier2 = await prisma.courier.findFirst({
    where: { user: { email: 'courier2@example.com' } }
  });
  
  if (!courier2) {
    throw new Error('Courier 2 not found');
  }
  
  // Create order 1 - Completed order with delivery
  const order1 = await prisma.order.create({
    data: {
      customerId: customer1.id,
      businessId: business1.id,
      status: 'COMPLETED',
      items: JSON.stringify([
        { name: 'Köfte Menü', quantity: 2, price: 150.0 },
        { name: 'Ayran', quantity: 2, price: 15.0 }
      ]),
      totalPrice: 330.0,
      address: customer1.address,
      notes: 'Lütfen kapıda zile basınız',
      zoneId: zones.zone1.id
    }
  });
  
  // Create delivery for order 1
  const delivery1 = await prisma.delivery.create({
    data: {
      orderId: order1.id,
      courierId: courier1.id,
      customerId: customer1.id,
      zoneId: zones.zone1.id,
      status: 'DELIVERED',
      estimatedDuration: 30,
      actualDuration: 25,
      pickupAddress: business1.address,
      pickupLatitude: business1.latitude,
      pickupLongitude: business1.longitude,
      dropoffAddress: customer1.address,
      dropoffLatitude: customer1.latitude,
      dropoffLongitude: customer1.longitude,
      assignedAt: new Date(Date.now() - 3600000), // 1 hour ago
      pickedUpAt: new Date(Date.now() - 3000000), // 50 minutes ago
      deliveredAt: new Date(Date.now() - 2100000), // 35 minutes ago
      distance: 4.5,
      actualDistance: 4.7,
      notes: 'Müşteri kapıya kadar çıktı'
    }
  });
  
  // Create order 2 - Pending order
  const order2 = await prisma.order.create({
    data: {
      customerId: customer2.id,
      businessId: business1.id,
      status: 'PENDING',
      items: JSON.stringify([
        { name: 'Döner Sandviç', quantity: 1, price: 80.0 },
        { name: 'Patates Kızartması', quantity: 1, price: 35.0 },
        { name: 'Kola', quantity: 1, price: 15.0 }
      ]),
      totalPrice: 130.0,
      address: customer2.address,
      zoneId: zones.zone2.id
    }
  });
  
  // Create order 3 - In progress order with delivery
  const order3 = await prisma.order.create({
    data: {
      customerId: customer3.id,
      businessId: business1.id,
      status: 'PROCESSING',
      items: JSON.stringify([
        { name: 'Tavuk Menü', quantity: 3, price: 120.0 },
        { name: 'Salata', quantity: 1, price: 55.0 },
        { name: 'Su', quantity: 3, price: 10.0 }
      ]),
      totalPrice: 415.0,
      address: customer3.address,
      notes: 'Bol acılı olsun lütfen',
      zoneId: zones.zone1.id
    }
  });
  
  // Create delivery for order 3
  const delivery2 = await prisma.delivery.create({
    data: {
      orderId: order3.id,
      courierId: courier1.id,
      customerId: customer3.id,
      zoneId: zones.zone1.id,
      status: 'IN_PROGRESS',
      estimatedDuration: 35,
      pickupAddress: business1.address,
      pickupLatitude: business1.latitude,
      pickupLongitude: business1.longitude,
      dropoffAddress: customer3.address,
      dropoffLatitude: customer3.latitude,
      dropoffLongitude: customer3.longitude,
      assignedAt: new Date(),
      pickedUpAt: new Date(),
      distance: 6.2
    }
  });
  
  // Create order 4 - Completed order with delivery from business 2
  const order4 = await prisma.order.create({
    data: {
      customerId: customer1.id,
      businessId: business2.id,
      status: 'COMPLETED',
      items: JSON.stringify([
        { name: 'Çikolatalı Pasta', quantity: 1, price: 180.0 },
        { name: 'Tiramisu', quantity: 2, price: 90.0 }
      ]),
      totalPrice: 360.0,
      address: customer1.address,
      zoneId: zones.zone3.id
    }
  });
  
  // Create delivery for order 4
  const delivery3 = await prisma.delivery.create({
    data: {
      orderId: order4.id,
      courierId: courier2.id,
      customerId: customer1.id,
      zoneId: zones.zone3.id,
      status: 'DELIVERED',
      estimatedDuration: 40,
      actualDuration: 38,
      pickupAddress: business2.address,
      pickupLatitude: business2.latitude,
      pickupLongitude: business2.longitude,
      dropoffAddress: customer1.address,
      dropoffLatitude: customer1.latitude,
      dropoffLongitude: customer1.longitude,
      assignedAt: new Date(Date.now() - 7200000), // 2 hours ago
      pickedUpAt: new Date(Date.now() - 6600000), // 1 hour 50 minutes ago
      deliveredAt: new Date(Date.now() - 5400000), // 1 hour 30 minutes ago
      distance: 5.8,
      actualDistance: 6.1
    }
  });
  
  // Create order 5 - Cancelled order
  const order5 = await prisma.order.create({
    data: {
      customerId: customer2.id,
      businessId: business2.id,
      status: 'CANCELLED',
      items: JSON.stringify([
        { name: 'Meyveli Tart', quantity: 3, price: 65.0 },
        { name: 'Sütlü Tatlı', quantity: 2, price: 55.0 }
      ]),
      totalPrice: 305.0,
      address: customer2.address,
      notes: 'Siparişi iptal ettim',
      zoneId: zones.zone4.id
    }
  });
  
  // Create a delivery with FAILED status (without order connection)
  const delivery4 = await prisma.delivery.create({
    data: {
      courierId: courier2.id,
      customerId: customer2.id,
      zoneId: zones.zone4.id,
      status: 'FAILED',
      estimatedDuration: 25,
      pickupAddress: 'Mecidiyeköy Metro Durağı',
      pickupLatitude: 41.0677,
      pickupLongitude: 28.9870,
      dropoffAddress: 'Levent Metro Durağı',
      dropoffLatitude: 41.0819,
      dropoffLongitude: 29.0119,
      assignedAt: new Date(Date.now() - 9000000), // 2.5 hours ago
      distance: 3.2,
      notes: 'Paket hasarlı olduğu için müşteri teslim almadı'
    }
  });
  
  console.log(`Created orders: ${order1.id}, ${order2.id}, ${order3.id}, ${order4.id}, ${order5.id}`);
  console.log(`Created deliveries: ${delivery1.id}, ${delivery2.id}, ${delivery3.id}, ${delivery4.id}`);
}

// If this file is called directly, run the setup
if (require.main === module) {
  setupTestData()
    .catch(error => {
      console.error('Error in setup:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

export { setupTestData }; 