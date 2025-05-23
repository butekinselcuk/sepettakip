const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Creating test data...');

  try {
    // Get existing users
    const admin = await prisma.user.findFirst({
      where: { email: 'admin1@example.com' },
      include: { admin: true }
    });
    
    const business = await prisma.user.findFirst({
      where: { email: 'business1@example.com' },
      include: { business: true }
    });
    
    const courier = await prisma.user.findFirst({
      where: { email: 'courier1@example.com' },
      include: { courier: true }
    });
    
    const customer = await prisma.user.findFirst({
      where: { email: 'customer1@example.com' },
      include: { customer: true }
    });
    
    if (!admin || !business || !courier || !customer) {
      console.error('Missing test users. Please run create-test-users.js first.');
      return;
    }
    
    console.log('Found test users:');
    console.log(`Admin: ${admin.email}`);
    console.log(`Business: ${business.email}`);
    console.log(`Courier: ${courier.email}`);
    console.log(`Customer: ${customer.email}`);
    
    // Get or create zone
    let zone = await prisma.zone.findFirst({
      where: { businessId: business.business.id }
    });
    
    if (!zone) {
      zone = await prisma.zone.create({
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
          businessId: business.business.id
        }
      });
      console.log(`Created zone: ${zone.name} for business: ${business.business.id}`);
    } else {
      console.log(`Found existing zone: ${zone.name}`);
    }
    
    // Get or create products
    let products = await prisma.product.findMany({
      where: { businessId: business.business.id }
    });
    
    if (products.length === 0) {
      // Create sample products
      const product1 = await prisma.product.create({
        data: {
          name: "Test Product 1",
          description: "Test Product 1 Description",
          price: 10.99,
          imageUrl: "https://via.placeholder.com/150",
          isActive: true,
          stock: 100,
          businessId: business.business.id
        }
      });
      
      const product2 = await prisma.product.create({
        data: {
          name: "Test Product 2",
          description: "Test Product 2 Description",
          price: 15.99,
          imageUrl: "https://via.placeholder.com/150",
          isActive: true,
          stock: 50,
          businessId: business.business.id
        }
      });
      
      const product3 = await prisma.product.create({
        data: {
          name: "Test Product 3",
          description: "Test Product 3 Description",
          price: 25.99,
          imageUrl: "https://via.placeholder.com/150",
          isActive: true,
          stock: 30,
          businessId: business.business.id
        }
      });
      
      products = [product1, product2, product3];
      console.log(`Created products for business: ${business.business.id}`);
    } else {
      console.log(`Found ${products.length} existing products`);
    }
    
    // Create test vehicle for courier if not exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { courierId: courier.courier.id }
    });
    
    if (!existingVehicle) {
      await prisma.vehicle.create({
        data: {
          type: 'MOTORCYCLE',
          make: 'Honda',
          model: 'CG 125',
          year: 2020,
          licensePlate: '34 ABC 123',
          color: 'Red',
          courierId: courier.courier.id
        }
      });
      console.log('Created test vehicle for courier.');
    } else {
      console.log('Courier already has a vehicle.');
    }
    
    // Create test orders (one completed, one pending)
    // Check if orders already exist
    const existingOrders = await prisma.order.findMany({
      where: { 
        customerId: customer.customer.id,
        businessId: business.business.id
      }
    });
    
    if (existingOrders.length === 0) {
      // Create completed order
      const completedOrder = await prisma.order.create({
        data: {
          customerId: customer.customer.id,
          businessId: business.business.id,
          status: 'DELIVERED',
          items: JSON.stringify([
            { productId: products[0].id, name: products[0].name, quantity: 2, price: products[0].price },
            { productId: products[1].id, name: products[1].name, quantity: 1, price: products[1].price }
          ]),
          totalPrice: products[0].price * 2 + products[1].price,
          address: customer.customer.address,
          notes: 'Please deliver to the door.',
          zoneId: zone.id
        }
      });
      
      // Create delivery for completed order
      const completedDelivery = await prisma.delivery.create({
        data: {
          orderId: completedOrder.id,
          courierId: courier.courier.id,
          customerId: customer.customer.id,
          zoneId: zone.id,
          status: 'DELIVERED',
          pickupAddress: business.business.address,
          dropoffAddress: customer.customer.address,
          assignedAt: new Date(Date.now() - 3600000), // 1 hour ago
          pickedUpAt: new Date(Date.now() - 1800000), // 30 minutes ago
          deliveredAt: new Date(), // Now
          distance: 5.2,
          actualDistance: 5.4,
          notes: 'Customer was satisfied with the delivery.',
        }
      });
      
      // Create payment for completed order
      await prisma.payment.create({
        data: {
          amount: completedOrder.totalPrice,
          method: 'CREDIT_CARD',
          status: 'COMPLETED',
          reference: 'PAY123456',
          orderId: completedOrder.id,
          customerId: customer.customer.id,
          businessId: business.business.id,
          processedAt: new Date()
        }
      });
      
      console.log(`Created completed order with id: ${completedOrder.id}`);
      
      // Create pending order
      const pendingOrder = await prisma.order.create({
        data: {
          customerId: customer.customer.id,
          businessId: business.business.id,
          status: 'PENDING',
          items: JSON.stringify([
            { productId: products[0].id, name: products[0].name, quantity: 1, price: products[0].price }
          ]),
          totalPrice: products[0].price,
          address: customer.customer.address,
          notes: 'Please call before delivery.',
          zoneId: zone.id
        }
      });
      
      console.log(`Created pending order with id: ${pendingOrder.id}`);
      
      // Create payment for pending order
      await prisma.payment.create({
        data: {
          amount: pendingOrder.totalPrice,
          method: 'CASH',
          status: 'PENDING',
          orderId: pendingOrder.id,
          customerId: customer.customer.id,
          businessId: business.business.id
        }
      });
    } else {
      console.log(`${existingOrders.length} orders already exist for customer. Skipping order creation.`);
    }
    
    // Create notifications for all users
    for (const user of [admin, business, courier, customer]) {
      const existingNotifications = await prisma.notification.findMany({
        where: { userId: user.id }
      });
      
      if (existingNotifications.length === 0) {
        await prisma.notification.create({
          data: {
            type: 'SYSTEM_NOTIFICATION',
            title: 'Welcome to Sepet',
            message: `Welcome to Sepet, ${user.name}! We're glad to have you here.`,
            isRead: false,
            userId: user.id
          }
        });
        
        // Role specific notifications
        if (user.role === 'ADMIN') {
          await prisma.notification.create({
            data: {
              type: 'SYSTEM_NOTIFICATION',
              title: 'Admin Dashboard Ready',
              message: 'Your admin dashboard is ready to use.',
              isRead: false,
              userId: user.id
            }
          });
        } else if (user.role === 'BUSINESS') {
          await prisma.notification.create({
            data: {
              type: 'ORDER_PLACED',
              title: 'New Order Received',
              message: 'You have received a new order.',
              isRead: false,
              userId: user.id
            }
          });
        } else if (user.role === 'COURIER') {
          await prisma.notification.create({
            data: {
              type: 'COURIER_ASSIGNED',
              title: 'New Delivery Assigned',
              message: 'You have been assigned a new delivery.',
              isRead: false,
              userId: user.id
            }
          });
        } else if (user.role === 'CUSTOMER') {
          await prisma.notification.create({
            data: {
              type: 'ORDER_DELIVERED',
              title: 'Order Delivered',
              message: 'Your order has been delivered.',
              isRead: false,
              userId: user.id
            }
          });
        }
        
        console.log(`Created notifications for ${user.role} user.`);
      } else {
        console.log(`${existingNotifications.length} notifications already exist for ${user.role} user. Skipping notification creation.`);
      }
    }
    
    console.log('Test data created successfully!');
  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 