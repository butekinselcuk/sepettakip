const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('⏳ Starting database seeding process...');
    
    // Hash passwords for different roles
    const saltRounds = 10;
    const adminPassword = await bcrypt.hash('admin123', saltRounds);
    const businessPassword = await bcrypt.hash('business123', saltRounds);
    const customerPassword = await bcrypt.hash('customer123', saltRounds);
    const courierPassword = await bcrypt.hash('courier123', saltRounds);
    
    console.log('🛠️ Creating system settings...');
    await prisma.systemSettings.create({
      data: {
        maintenance: false,
        maintenanceMessage: "",
        theme: "light",
        language: "tr",
        dateFormat: "DD.MM.YYYY",
        timeFormat: "24h"
      }
    });
    
    // Create admin user
    console.log('👤 Creating admin user...');
    const admin = await prisma.user.create({
      data: {
        email: 'admin@sepettakip.com',
        password: adminPassword,
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
    console.log(`✅ Created admin user: ${admin.email}`);
    
    // Create Zone
    console.log('🗺️ Creating delivery zone...');
    const zone = await prisma.zone.create({
      data: {
        name: 'İstanbul Merkez',
        description: 'İstanbul merkez bölgesi',
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
          create: {
            name: 'Merkez İşletme',
            address: 'İstanbul, Merkez',
            phone: '+905551112233',
            latitude: 41.0082,
            longitude: 28.9784,
            user: {
              create: {
                email: 'business@sepettakip.com',
                password: businessPassword,
                name: 'Business User',
                role: 'BUSINESS'
              }
            }
          }
        }
      },
      include: {
        business: {
          include: {
            user: true
          }
        }
      }
    });
    console.log(`✅ Created zone: ${zone.name} for business: ${zone.business.user.email}`);
    
    const businessId = zone.business.id;
    
    // Create products
    console.log('🍔 Creating products...');
    const products = [
      {
        name: 'Hamburger',
        description: 'Lezzetli hamburger',
        price: 55.99,
        imageUrl: 'https://example.com/hamburger.jpg',
        isActive: true,
        stock: 50,
        businessId
      },
      {
        name: 'Pizza',
        description: 'Karışık pizza',
        price: 89.99,
        imageUrl: 'https://example.com/pizza.jpg',
        isActive: true,
        stock: 30,
        businessId
      },
      {
        name: 'Cola',
        description: '330ml kutu cola',
        price: 15.99,
        imageUrl: 'https://example.com/cola.jpg',
        isActive: true,
        stock: 100,
        businessId
      }
    ];
    
    for (const product of products) {
      await prisma.product.create({ data: product });
    }
    console.log(`✅ Created ${products.length} products`);
    
    // Create customer
    console.log('👤 Creating customer...');
    const customer = await prisma.user.create({
      data: {
        email: 'customer@sepettakip.com',
        password: customerPassword,
        name: 'Customer User',
        role: 'CUSTOMER',
        customer: {
          create: {
            phone: '+905551112244',
            address: 'İstanbul, Beşiktaş',
            latitude: 41.0422,
            longitude: 29.0083
          }
        }
      },
      include: {
        customer: true
      }
    });
    console.log(`✅ Created customer: ${customer.email}`);
    
    // Create customer address
    console.log('🏠 Creating customer address...');
    await prisma.customerAddress.create({
      data: {
        customerId: customer.customer.id,
        title: 'Ev Adresi',
        firstName: 'Customer',
        lastName: 'User',
        addressLine1: 'Beşiktaş Caddesi No:123',
        city: 'İstanbul',
        postalCode: '34000',
        country: 'Türkiye',
        phone: '+905551112244',
        isDefault: true,
        latitude: 41.0422,
        longitude: 29.0083
      }
    });
    console.log(`✅ Created address for customer: ${customer.email}`);
    
    // Create courier
    console.log('🚚 Creating courier...');
    const courier = await prisma.user.create({
      data: {
        email: 'courier@sepettakip.com',
        password: courierPassword,
        name: 'Courier User',
        role: 'COURIER',
        courier: {
          create: {
            phone: '+905551112255',
            vehicleType: 'MOTORCYCLE',
            status: 'AVAILABLE',
            availabilityStatus: 'AVAILABLE',
            zoneId: zone.id,
            currentLatitude: 41.0082,
            currentLongitude: 28.9784,
            documentsVerified: true
          }
        }
      },
      include: {
        courier: true
      }
    });
    console.log(`✅ Created courier: ${courier.email}`);
    
    // Create vehicle for courier
    console.log('🏍️ Creating vehicle for courier...');
    await prisma.vehicle.create({
      data: {
        type: 'MOTORCYCLE',
        make: 'Honda',
        model: 'PCX 125',
        year: 2022,
        licensePlate: '34ABC123',
        color: 'Black',
        courierId: courier.courier.id
      }
    });
    console.log(`✅ Created vehicle for courier: ${courier.email}`);
    
    // Create order and order items
    console.log('📦 Creating order...');
    const allProducts = await prisma.product.findMany();
    
    const order = await prisma.order.create({
      data: {
        customerId: customer.customer.id,
        businessId: businessId,
        status: 'PENDING',
        items: JSON.stringify([
          { product: 'Hamburger', quantity: 2, price: 55.99 },
          { product: 'Cola', quantity: 2, price: 15.99 }
        ]),
        totalPrice: 143.96,
        address: 'İstanbul, Beşiktaş, Beşiktaş Caddesi No:123',
        notes: 'Kapıda kartla ödeme',
        zoneId: zone.id
      }
    });
    console.log(`✅ Created order: ${order.id}`);
    
    // Create order items
    console.log('🍔 Creating order items...');
    await prisma.orderItem.createMany({
      data: [
        {
          orderId: order.id,
          productId: allProducts[0].id, // Hamburger
          quantity: 2,
          price: 55.99
        },
        {
          orderId: order.id,
          productId: allProducts[2].id, // Cola
          quantity: 2,
          price: 15.99
        }
      ]
    });
    console.log(`✅ Created order items for order: ${order.id}`);
    
    // Create payment for order
    console.log('💳 Creating payment...');
    await prisma.payment.create({
      data: {
        amount: 143.96,
        method: 'CREDIT_CARD',
        status: 'PENDING',
        reference: `PAY-${Math.floor(Math.random() * 1000000)}`,
        orderId: order.id,
        customerId: customer.customer.id,
        businessId: businessId
      }
    });
    console.log(`✅ Created payment for order: ${order.id}`);
    
    // Create delivery
    console.log('🚚 Creating delivery...');
    await prisma.delivery.create({
      data: {
        orderId: order.id,
        courierId: courier.courier.id,
        customerId: customer.customer.id,
        zoneId: zone.id,
        status: 'PENDING',
        estimatedDuration: 30,
        pickupAddress: 'İstanbul, Merkez',
        pickupLatitude: 41.0082,
        pickupLongitude: 28.9784,
        dropoffAddress: 'İstanbul, Beşiktaş, Beşiktaş Caddesi No:123',
        dropoffLatitude: 41.0422,
        dropoffLongitude: 29.0083,
        distance: 5.2
      }
    });
    console.log(`✅ Created delivery for order: ${order.id}`);
    
    // Create user settings
    console.log('⚙️ Creating user settings...');
    await prisma.userSettings.create({
      data: {
        userId: admin.id,
        receiveNotifications: true,
        theme: 'dark',
        language: 'tr'
      }
    });
    console.log(`✅ Created user settings for: ${admin.email}`);
    
    // Create notifications
    console.log('🔔 Creating notification...');
    await prisma.notification.create({
      data: {
        type: 'SYSTEM_NOTIFICATION',
        title: 'Hoş Geldiniz',
        message: 'Sepet Takip sistemine hoş geldiniz!',
        userId: admin.id
      }
    });
    console.log(`✅ Created notification for: ${admin.email}`);
    
    console.log('✨ Database seeding completed successfully! ✨');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Seed process ended.');
  }); 