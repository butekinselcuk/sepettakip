import { prisma } from '../lib/prisma';
import { hashSync } from 'bcrypt';

async function main() {
  console.log('Starting test users seed...');
  
  // Hash for 'Test123'
  const password = hashSync('Test123', 10);
  
  // Test users data with proper string roles
  const testUsers = [
    {
      email: 'admin1@example.com',
      password,
      name: 'Test Admin',
      role: 'ADMIN',
    },
    {
      email: 'courier1@example.com',
      password,
      name: 'Test Courier',
      role: 'COURIER',
    },
    {
      email: 'business1@example.com',
      password,
      name: 'Test Business',
      role: 'BUSINESS',
    },
    {
      email: 'customer1@example.com',
      password,
      name: 'Test Customer',
      role: 'CUSTOMER',
    },
  ];
  
  // Create or update each test user
  for (const userData of testUsers) {
    const { email, password, name, role } = userData;
    
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      
      if (existingUser) {
        // Update existing user
        await prisma.user.update({
          where: { email },
          data: { password, name },
        });
        console.log(`Updated existing user: ${email}`);
      } else {
        // Create new user with string role
        const user = await prisma.user.create({
          data: { 
            email, 
            password, 
            name, 
            role, 
          },
        });
        console.log(`Created user: ${email}, ID: ${user.id}`);
        
        // Create role-specific records
        if (role === 'ADMIN') {
          await prisma.admin.create({
            data: {
              userId: user.id,
            },
          });
        } else if (role === 'COURIER') {
          await prisma.courier.create({
            data: {
              userId: user.id,
              phone: '+905551234567',
              status: 'AVAILABLE',
              availabilityStatus: 'AVAILABLE',
            },
          });
        } else if (role === 'BUSINESS') {
          await prisma.business.create({
            data: {
              userId: user.id,
              name: 'Test Business',
              address: 'Test Address',
              phone: '+905551234568',
            },
          });
        } else if (role === 'CUSTOMER') {
          await prisma.customer.create({
            data: {
              userId: user.id,
              phone: '+905551234569',
              address: 'Test Customer Address',
            },
          });
        }
        
        // Create user settings according to actual schema
        await prisma.userSettings.create({
          data: {
            userId: user.id,
            theme: 'light',
            language: 'tr',
            receiveNotifications: true,
            emailNotifications: true,
            pushNotifications: true,
            smsNotifications: false,
            newOrderAlert: true,
            newCustomerAlert: true,
            orderStatusAlert: true,
            newDeliveryAlert: true,
            deliveryStatusAlert: true,
          },
        });
        
        console.log(`Created ${role.toLowerCase()} profile and settings for ${email}`);
      }
    } catch (error) {
      console.error(`Error processing ${email}:`, error);
    }
  }
  
  console.log('Test users seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 