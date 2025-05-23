const { PrismaClient } = require('../prisma/generated/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

/**
 * Sistem ayarları oluşturan fonksiyon
 */
async function createSystemSettings() {
  console.log('📝 Varsayılan sistem ayarları oluşturuluyor...');
  
  const defaultSettings = [
    // Genel sistem ayarları
    {
      key: 'system.name',
      value: 'Sepet Takip',
      category: 'general',
      description: 'Sistem adı',
      dataType: 'string',
      isEncrypted: false
    },
    {
      key: 'system.logo',
      value: '/logo.png',
      category: 'general',
      description: 'Sistem logosu',
      dataType: 'string',
      isEncrypted: false
    },
    {
      key: 'system.maintenance',
      value: 'false',
      category: 'general',
      description: 'Bakım modu',
      dataType: 'boolean',
      isEncrypted: false
    },
    {
      key: 'system.timezone',
      value: 'Europe/Istanbul',
      category: 'general',
      description: 'Sistem saat dilimi',
      dataType: 'string',
      isEncrypted: false
    },
    {
      key: 'system.currency',
      value: 'TRY',
      category: 'general',
      description: 'Para birimi',
      dataType: 'string',
      isEncrypted: false
    },
    {
      key: 'system.language',
      value: 'tr',
      category: 'general',
      description: 'Varsayılan dil',
      dataType: 'string',
      isEncrypted: false
    },
    
    // E-posta ayarları
    {
      key: 'email.host',
      value: 'smtp.example.com',
      category: 'email',
      description: 'SMTP sunucu adresi',
      dataType: 'string',
      isEncrypted: false
    },
    {
      key: 'email.port',
      value: '587',
      category: 'email',
      description: 'SMTP port',
      dataType: 'number',
      isEncrypted: false
    },
    {
      key: 'email.secure',
      value: 'false',
      category: 'email',
      description: 'SSL kullan',
      dataType: 'boolean',
      isEncrypted: false
    },
    {
      key: 'email.auth.user',
      value: 'info@example.com',
      category: 'email',
      description: 'SMTP kullanıcı adı',
      dataType: 'string',
      isEncrypted: false
    },
    {
      key: 'email.auth.pass',
      value: 'password123', // Gerçek ortamda bu şifrelenmiş olmalı
      category: 'email',
      description: 'SMTP şifre',
      dataType: 'string',
      isEncrypted: true
    },
    {
      key: 'email.from',
      value: 'info@sepettakip.com',
      category: 'email',
      description: 'Gönderen e-posta adresi',
      dataType: 'string',
      isEncrypted: false
    },
    {
      key: 'email.replyTo',
      value: 'support@sepettakip.com',
      category: 'email',
      description: 'Yanıt adresi',
      dataType: 'string',
      isEncrypted: false
    }
  ];
  
  for (const setting of defaultSettings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: setting,
      create: {
        ...setting,
        lastUpdated: new Date(),
        updatedBy: 'system' 
      }
    });
  }
  
  console.log('✅ Sistem ayarları başarıyla oluşturuldu');
}

/**
 * Dashboard metrikleri oluşturan fonksiyon
 */
async function createDashboardMetrics() {
  console.log('📊 Dashboard metrikleri oluşturuluyor...');
  
  // Son 30 gün için günlük sipariş verileri
  const today = new Date();
  const orderTimeseries = [];
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    
    // Rastgele sipariş sayısı (10-100 arası)
    const count = Math.floor(Math.random() * 90) + 10;
    
    orderTimeseries.push({
      date: date.toISOString().split('T')[0],
      count
    });
  }
  
  // Sipariş sıcaklık haritası (haftanın günleri ve saatler)
  const daysOfWeek = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const ordersHeatmap = [];
  
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      // Rastgele sipariş sayısı (0-40 arası)
      const value = Math.floor(Math.random() * 40);
      
      ordersHeatmap.push({
        day: daysOfWeek[day],
        hour: hour.toString(),
        value
      });
    }
  }
  
  // İşletme kategorileri dağılımı
  const businessCategories = [
    { category: 'Restoran', count: 156 },
    { category: 'Kafe', count: 89 },
    { category: 'Bakkal', count: 64 },
    { category: 'Market', count: 112 },
    { category: 'Manav', count: 42 }
  ];
  
  // Metrikleri JSON olarak kaydet
  const metrics = {
    dailyOrders: {
      today: 157,
      yesterday: 142,
      change: 10.56
    },
    totalRevenue: {
      today: 24850,
      yesterday: 22340,
      change: 11.23
    },
    activeBusinesses: {
      today: 463,
      yesterday: 457,
      change: 1.31
    },
    activeCouriers: {
      today: 98,
      yesterday: 95,
      change: 3.16
    },
    orderTimeseries,
    ordersHeatmap,
    businessCategories
  };
  
  // Metrikleri bir JSON dosyasına kaydet (gerçek dünyada bu veritabanında saklanabilir)
  await prisma.systemSettings.upsert({
    where: { key: 'dashboard.metrics' },
    update: {
      value: JSON.stringify(metrics),
      lastUpdated: new Date()
    },
    create: {
      key: 'dashboard.metrics',
      value: JSON.stringify(metrics),
      category: 'dashboard',
      description: 'Dashboard metrikleri',
      dataType: 'json',
      isEncrypted: false,
      lastUpdated: new Date(),
      updatedBy: 'system'
    }
  });
  
  console.log('✅ Dashboard metrikleri başarıyla oluşturuldu');
}

/**
 * Seed fonksiyonu
 */
async function main() {
  try {
    console.log('Seeding database...');
    
    // Add SystemSettings and Dashboard metrics
    await createSystemSettings();
    await createDashboardMetrics();
    
    // Hash passwords for different roles
    const saltRounds = 10;
    const adminPassword = await bcrypt.hash('admin123', saltRounds);
    const businessPassword = await bcrypt.hash('business123', saltRounds);
    const customerPassword = await bcrypt.hash('customer123', saltRounds);
    const courierPassword = await bcrypt.hash('courier123', saltRounds);
    
    // Create a delivery zone
    console.log('Creating delivery zone...');
    const zone = await prisma.zone.create({
      data: {
        name: 'İstanbul Merkez',
        coordinates: {
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
        }
      }
    });
    console.log(`Created zone: ${zone.name}`);
    
    // Create admin user
    console.log('Creating admin user...');
    const admin = await prisma.user.upsert({
      where: { email: 'admin@sepettakip.com' },
      update: {},
      create: {
        email: 'admin@sepettakip.com',
        name: 'Admin User',
        role: 'ADMIN',
        password: adminPassword,
        admin: {
          create: {
            department: 'Management',
            permissions: ['ALL'],
            level: 4,
            isSuperAdmin: true
          }
        }
      }
    });
    console.log(`Created admin user: ${admin.email}`);
    
    // Create customers
    console.log('Creating customers...');
    const customers = [];
    for (let i = 1; i <= 5; i++) {
      const customer = await prisma.user.upsert({
        where: { email: `customer${i}@example.com` },
        update: {},
        create: {
          email: `customer${i}@example.com`,
          name: `Customer ${i}`,
          role: 'CUSTOMER',
          password: customerPassword,
          customer: {
            create: {
              phone: `+9055511${i}2233`,
              address: `Customer ${i} Address, Istanbul`,
              latitude: 41.0 + (i * 0.01),
              longitude: 29.0 + (i * 0.01)
            }
          }
        }
      });
      customers.push(customer);
      console.log(`Created customer: ${customer.email}`);
    }
    
    // Create businesses
    console.log('Creating businesses...');
    const businesses = [];
    const businessTypes = ['RESTAURANT', 'GROCERY', 'PHARMACY', 'RETAIL', 'OTHER'];
    for (let i = 1; i <= 2; i++) {
      const businessType = businessTypes[i % businessTypes.length];
      const business = await prisma.user.upsert({
        where: { email: `business${i}@example.com` },
        update: {},
        create: {
          email: `business${i}@example.com`,
          name: `Business ${i}`,
          role: 'BUSINESS',
          password: businessPassword,
          business: {
            create: {
              name: `Business ${i} Store`,
              type: businessType,
              tax_id: `TAX${i}12345`,
              description: `This is business ${i} description`,
              phone: `+9055522${i}2233`,
              address: `Business ${i} Address, Istanbul`,
              openingTime: '09:00',
              closingTime: '18:00',
              latitude: 41.0 + (i * 0.02),
              longitude: 29.0 + (i * 0.02),
              zoneId: zone.id
            }
          }
        }
      });
      businesses.push(business);
      console.log(`Created business: ${business.email} (${businessType})`);
    }
    
    // Create couriers
    console.log('Creating couriers...');
    const couriers = [];
    for (let i = 1; i <= 2; i++) {
      const courier = await prisma.user.upsert({
        where: { email: `courier${i}@example.com` },
        update: {},
        create: {
          email: `courier${i}@example.com`,
          name: `Courier ${i}`,
          role: 'COURIER',
          password: courierPassword,
          courier: {
            create: {
              vehicleType: i % 2 === 0 ? 'MOTORCYCLE' : 'BICYCLE',
              phone: `+9055533${i}2233`,
              currentLatitude: 41.0 + (i * 0.01),
              currentLongitude: 29.0 + (i * 0.01),
              zoneId: zone.id,
              status: 'ACTIVE'
            }
          }
        }
      });
      couriers.push(courier);
      console.log(`Created courier: ${courier.email}`);
    }
    
    // Fetch all created users to get their IDs
    const allCustomers = await prisma.customer.findMany();
    const allBusinesses = await prisma.business.findMany();
    const allCouriers = await prisma.courier.findMany();
    
    // Create orders
    console.log('Creating orders...');
    const statuses = ['PENDING', 'PROCESSING', 'PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED'];
    const paymentMethods = ['CREDIT_CARD', 'CASH', 'TRANSFER'];
    
    for (let i = 1; i <= 5; i++) {
      const customer = allCustomers[i % allCustomers.length];
      const business = allBusinesses[i % allBusinesses.length];
      const courier = allCouriers[i % allCouriers.length];
      
      if (!customer || !business) {
        console.log(`Skipping order ${i} due to missing user references`);
        continue;
      }
      
      const statusIndex = i % statuses.length;
      const status = statuses[statusIndex];
      const paymentMethod = paymentMethods[i % paymentMethods.length];
      
      console.log(`Creating order ${i} with status ${status}...`);
      
      try {
        const orderItems = [
          { name: 'Item 1', price: 10.99, quantity: 2 },
          { name: 'Item 2', price: 5.99, quantity: 1 }
        ];
        
        const order = await prisma.order.create({
          data: {
            customerId: customer.id,
            businessId: business.id,
            status: status,
            items: orderItems,
            totalPrice: 27.97,
            address: `Delivery Address ${i}, Istanbul`,
            latitude: 41.0 + (i * 0.01),
            longitude: 29.0 + (i * 0.01),
            notes: `Order ${i} notes`,
            priority: 'MEDIUM',
            estimatedDelivery: new Date(Date.now() + 3600000), // 1 hour from now
            courierId: statusIndex >= 2 ? courier.id : null, // Only assign courier if status is beyond PREPARING
            payments: {
              create: {
                amount: 27.97,
                status: status === 'DELIVERED' ? 'COMPLETED' : 'PENDING',
                method: paymentMethod,
                business: {
                  connect: { id: business.id }
                },
                recipient: statusIndex >= 2 ? {
                  connect: { id: courier.id }
                } : undefined
              }
            }
          }
        });
        
        // Create delivery for orders that are in progress or delivered
        if (statusIndex >= 2) {
          try {
            await prisma.delivery.create({
              data: {
                orderId: order.id,
                status: status,
                courierId: courier.id,
                customerId: customer.id,
                zoneId: zone.id,
                pickupLatitude: business.latitude,
                pickupLongitude: business.longitude,
                dropoffLatitude: 41.0 + (i * 0.01),
                dropoffLongitude: 29.0 + (i * 0.01),
                pickedUpAt: status === 'IN_TRANSIT' || status === 'DELIVERED' ? new Date() : null,
                deliveredAt: status === 'DELIVERED' ? new Date() : null,
                duration: 30,
                priority: 'MEDIUM'
              }
            });
            console.log(`Created delivery for order #${order.id}`);
          } catch (error) {
            console.error(`Error creating delivery for order ${order.id}:`, error.message);
            // Continue with other orders even if delivery creation fails
          }
        }
        
        console.log(`Created order #${order.id} with status ${status}`);
      } catch (error) {
        console.error(`Error creating order ${i}:`, error);
      }
    }
    
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
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