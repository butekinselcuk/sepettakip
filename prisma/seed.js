const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting database seeding...');

    // Create Admin User
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        id: 'admin-user-id-1',
        email: 'admin@example.com',
        name: 'Admin User',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // Test123
        role: 'ADMIN',
        admin: {
          create: {
            id: 'admin-id-1',
            department: 'Management',
            level: 2
          }
        }
      },
    });
    console.log('Created/updated admin user:', adminUser.email);

    // Create Business User
    const businessUser = await prisma.user.upsert({
      where: { email: 'business@example.com' },
      update: {},
      create: {
        id: 'business-user-id-1',
        email: 'business@example.com',
        name: 'Business Demo',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // Test123
        role: 'BUSINESS',
        business: {
          create: {
            id: 'business-id-1',
            name: 'Demo Restaurant',
            description: 'A demo restaurant for testing',
            address: 'İstanbul, Kadıköy',
            phone: '5551112233',
            status: 'ACTIVE'
          }
        }
      },
    });
    console.log('Created/updated business user:', businessUser.email);

    // Create Customer User
    const customerUser = await prisma.user.upsert({
      where: { email: 'customer@example.com' },
      update: {},
      create: {
        id: 'customer-user-id-1',
        email: 'customer@example.com',
        name: 'Customer Demo',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // Test123
        role: 'CUSTOMER',
        customer: {
          create: {
            id: 'customer-id-1',
            phone: '5553334455',
            address: 'İstanbul, Beşiktaş',
            latitude: 41.0422,
            longitude: 29.0093
          }
        }
      },
    });
    console.log('Created/updated customer user:', customerUser.email);

    // Create Courier User 1
    const courierUser1 = await prisma.user.upsert({
      where: { email: 'courier1@example.com' },
      update: {},
      create: {
        id: 'courier-user-id-1',
        email: 'courier1@example.com',
        name: 'Courier Demo 1',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // Test123
        role: 'COURIER',
        courier: {
          create: {
            id: 'courier-id-1',
            status: 'ACTIVE',
            vehicleType: 'MOTORCYCLE',
            phone: '5551234567',
            currentLatitude: 41.04,
            currentLongitude: 29.01
          }
        }
      },
    });
    console.log('Created/updated courier user 1:', courierUser1.email);

    // Create Courier User 2
    const courierUser2 = await prisma.user.upsert({
      where: { email: 'courier2@example.com' },
      update: {},
      create: {
        id: 'courier-user-id-2',
        email: 'courier2@example.com',
        name: 'Courier Demo 2',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // Test123
        role: 'COURIER',
        courier: {
          create: {
            id: 'courier-id-2',
            status: 'ACTIVE',
            vehicleType: 'CAR',
            phone: '5557654321',
            currentLatitude: 41.06,
            currentLongitude: 29.02
          }
        }
      },
    });
    console.log('Created/updated courier user 2:', courierUser2.email);

    // Create Zones
    const zone1 = await prisma.zone.upsert({
      where: { id: 'zone-id-1' },
      update: {},
      create: {
        id: 'zone-id-1',
        name: 'Kadıköy',
        description: 'İstanbul Anadolu Yakası',
        boundaries: { type: "Polygon", coordinates: [[[29.02, 40.99], [29.07, 40.99], [29.07, 41.02], [29.02, 41.02], [29.02, 40.99]]] }
      }
    });
    console.log('Created/updated zone 1:', zone1.name);

    const zone2 = await prisma.zone.upsert({
      where: { id: 'zone-id-2' },
      update: {},
      create: {
        id: 'zone-id-2',
        name: 'Beşiktaş',
        description: 'İstanbul Avrupa Yakası',
        boundaries: { type: "Polygon", coordinates: [[[29.00, 41.03], [29.05, 41.03], [29.05, 41.06], [29.00, 41.06], [29.00, 41.03]]] }
      }
    });
    console.log('Created/updated zone 2:', zone2.name);

    // Create sample orders
    const order1 = await prisma.order.upsert({
      where: { id: 'order-id-1' },
      update: {},
      create: {
        id: 'order-id-1',
        status: 'DELIVERED',
        totalPrice: 150.75,
        items: [
          { name: "Hamburger", quantity: 2, price: 55.50 },
          { name: "Cola", quantity: 2, price: 19.90 }
        ],
        address: 'İstanbul, Kadıköy, Moda Cad. No:123',
        estimatedDelivery: new Date(Date.now() - 1000 * 60 * 60),
        actualDelivery: new Date(Date.now() - 1000 * 60 * 30),
        customerId: 'customer-id-1',
        businessId: 'business-id-1',
        courierId: 'courier-id-1'
      }
    });
    console.log('Created/updated order 1:', order1.id);

    const order2 = await prisma.order.upsert({
      where: { id: 'order-id-2' },
      update: {},
      create: {
        id: 'order-id-2',
        status: 'PENDING',
        totalPrice: 95.50,
        items: [
          { name: "Pizza", quantity: 1, price: 85.00 },
          { name: "Water", quantity: 1, price: 10.50 }
        ],
        address: 'İstanbul, Beşiktaş, Barbaros Bulvarı No:456',
        estimatedDelivery: new Date(Date.now() + 1000 * 60 * 45),
        customerId: 'customer-id-1',
        businessId: 'business-id-1',
      }
    });
    console.log('Created/updated order 2:', order2.id);
    
    console.log('Database seed completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

main()
  .catch(e => {
    console.error('Error in seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 