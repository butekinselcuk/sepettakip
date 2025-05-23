const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Creating test users...');

  try {
    // Test password
    const passwordHash = await bcryptjs.hash('Test123', 10);
    
    // Test users to create
    const testUsers = [
      { email: 'admin1@example.com', name: 'Admin User', role: 'ADMIN' },
      { email: 'business1@example.com', name: 'Business User', role: 'BUSINESS' },
      { email: 'courier1@example.com', name: 'Courier User', role: 'COURIER' },
      { email: 'customer1@example.com', name: 'Customer User', role: 'CUSTOMER' }
    ];
    
    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists. Skipping.`);
        continue;
      }
      
      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: passwordHash,
          role: userData.role
        }
      });
      
      console.log(`Created user: ${user.email} with role ${user.role}`);
      
      // Create role-specific record
      if (userData.role === 'ADMIN') {
        await prisma.admin.create({
          data: {
            userId: user.id
          }
        });
        console.log(`Created admin record for user: ${user.email}`);
      } else if (userData.role === 'BUSINESS') {
        const business = await prisma.business.create({
          data: {
            userId: user.id,
            name: "Test Business",
            address: "Test Business Address",
            phone: "+905551234567"
          }
        });
        
        console.log(`Created business record for user: ${user.email}`);
        
        // Create a zone for the business
        const zone = await prisma.zone.create({
          data: {
            name: "Test Zone",
            description: "Test Zone Description",
            boundaries: JSON.stringify({
              type: 'Polygon',
              coordinates: [
                [
                  [28.9684, 41.0082],
                  [28.9884, 41.0082],
                  [28.9884, 41.0182],
                  [28.9684, 41.0182],
                  [28.9684, 41.0082]
                ]
              ]
            }),
            businessId: business.id
          }
        });
        
        console.log(`Created zone: ${zone.name} for business: ${business.name}`);
        
        // Create products for the business
        await prisma.product.create({
          data: {
            name: "Test Product 1",
            description: "Test Product 1 Description",
            price: 10.99,
            imageUrl: "https://via.placeholder.com/150",
            isActive: true,
            stock: 100,
            businessId: business.id
          }
        });
        
        await prisma.product.create({
          data: {
            name: "Test Product 2",
            description: "Test Product 2 Description",
            price: 15.99,
            imageUrl: "https://via.placeholder.com/150",
            isActive: true,
            stock: 50,
            businessId: business.id
          }
        });
        
        await prisma.product.create({
          data: {
            name: "Test Product 3",
            description: "Test Product 3 Description",
            price: 25.99,
            imageUrl: "https://via.placeholder.com/150",
            isActive: true,
            stock: 30,
            businessId: business.id
          }
        });
        
        console.log(`Created products for business: ${business.name}`);
      } else if (userData.role === 'COURIER') {
        // Create courier record
        const courier = await prisma.courier.create({
          data: {
            userId: user.id,
            phone: "+905551234599",
            status: "AVAILABLE",
            availabilityStatus: "AVAILABLE",
            isActive: true,
            documentsVerified: true
          }
        });
        
        // Create vehicle for courier
        await prisma.vehicle.create({
          data: {
            type: "MOTORCYCLE",
            make: "Honda",
            model: "CG 125",
            year: 2020,
            licensePlate: "34 ABC 123",
            color: "Red",
            courierId: courier.id
          }
        });
        
        console.log(`Created courier record and vehicle for user: ${user.email}`);
      } else if (userData.role === 'CUSTOMER') {
        // Create customer record
        await prisma.customer.create({
          data: {
            userId: user.id,
            phone: "+905551234578",
            address: "Test Customer Address",
            latitude: 41.0082,
            longitude: 28.9784
          }
        });
        
        console.log(`Created customer record for user: ${user.email}`);
      }
      
      // Create user settings
      await prisma.userSettings.create({
        data: {
          userId: user.id,
          theme: "light",
          language: "tr",
          receiveNotifications: true,
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          newOrderAlert: true,
          newCustomerAlert: true,
          orderStatusAlert: true,
          newDeliveryAlert: true,
          deliveryStatusAlert: true
        }
      });
      
      console.log(`Created user settings for user: ${user.email}`);
    }
    
    console.log('Test users created successfully!');
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 