const { PrismaClient } = require('./generated/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Basitleştirilmiş seed işlemi başlatılıyor...');

  try {
    // Sistem ayarları oluştur
    await seedSystemSettings();
    
    // Dashboard metrik verileri oluştur
    await seedDashboardMetrics();
    
    // Test kullanıcıları oluştur
    await seedUsers();
    
    // Test siparişleri oluştur
    await seedOrders();
    
    console.log('✅ Seed işlemi tamamlandı!');
  } catch (error) {
    console.error('❌ Seed işlemi sırasında hata:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedSystemSettings() {
  console.log('⚙️ Sistem ayarları oluşturuluyor...');
  
  const settingsData = [
    {
      key: 'app.name',
      value: 'SepetTakip',
      category: 'GENERAL',
      description: 'Uygulama adı',
      dataType: 'STRING',
      isEncrypted: false
    },
    {
      key: 'app.version',
      value: '1.0.0',
      category: 'GENERAL',
      description: 'Uygulama versiyonu',
      dataType: 'STRING',
      isEncrypted: false
    },
    {
      key: 'email.smtp.host',
      value: 'smtp.example.com',
      category: 'EMAIL',
      description: 'SMTP sunucu adresi',
      dataType: 'STRING',
      isEncrypted: false
    },
    {
      key: 'email.smtp.port',
      value: '587',
      category: 'EMAIL',
      description: 'SMTP port',
      dataType: 'NUMBER',
      isEncrypted: false
    }
  ];

  for (const setting of settingsData) {
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

  console.log(`✅ ${settingsData.length} adet sistem ayarı oluşturuldu`);
}

async function seedDashboardMetrics() {
  console.log('📊 Dashboard metrikleri oluşturuluyor...');
  
  const now = new Date();

  // Örnek metrik verisi
  const metricData = {
    totalOrders: 125,
    newOrders: 15,
    activeDeliveries: 8,
    completedDeliveries: 7,
    ordersByStatus: [
      { status: 'PENDING', _count: { id: 15 } },
      { status: 'PROCESSING', _count: { id: 8 } },
      { status: 'IN_TRANSIT', _count: { id: 8 } },
      { status: 'DELIVERED', _count: { id: 70 } },
      { status: 'CANCELLED', _count: { id: 7 } }
    ],
    revenueByPaymentMethod: [
      { method: 'CREDIT_CARD', _sum: { amount: 3500.75 } },
      { method: 'CASH', _sum: { amount: 1250.50 } },
      { method: 'BANK_TRANSFER', _sum: { amount: 850.25 } }
    ]
  };

  try {
    await prisma.dashboardMetric.upsert({
      where: { id: 1 },
      update: {
        metrics: metricData,
        lastUpdated: now
      },
      create: {
        id: 1,
        metrics: metricData,
        lastUpdated: now
      }
    });
    console.log('✅ Dashboard metrikleri oluşturuldu');
  } catch (error) {
    console.error('Dashboard metrik hatası:', error);
  }
}

async function seedUsers() {
  console.log('👤 Test kullanıcıları oluşturuluyor...');
  
  // Admin kullanıcısı
  try {
    await prisma.user.upsert({
      where: { email: 'admin@sepettakip.com' },
      update: {
        name: 'Admin User',
        role: 'ADMIN'
      },
      create: {
        email: 'admin@sepettakip.com',
        name: 'Admin User',
        password: 'Test123', // Gerçek ortamda hash'lenmeli
        role: 'ADMIN'
      }
    });
    
    // Müşteri kullanıcısı
    await prisma.user.upsert({
      where: { email: 'customer@sepettakip.com' },
      update: {
        name: 'Test Customer',
        role: 'CUSTOMER'
      },
      create: {
        email: 'customer@sepettakip.com',
        name: 'Test Customer',
        password: 'Test123',
        role: 'CUSTOMER',
        customer: {
          create: {
            address: 'Örnek Müşteri Adresi, Ankara',
            phone: '+90 555 123 4567'
          }
        }
      }
    });
    
    // İşletme kullanıcısı
    await prisma.user.upsert({
      where: { email: 'business@sepettakip.com' },
      update: {
        name: 'Test Business',
        role: 'BUSINESS'
      },
      create: {
        email: 'business@sepettakip.com',
        name: 'Test Business',
        password: 'Test123',
        role: 'BUSINESS',
        business: {
          create: {
            name: 'Örnek İşletme',
            address: 'İşletme Adresi, İstanbul',
            phone: '+90 555 987 6543',
            status: 'ACTIVE'
          }
        }
      }
    });
    
    // Kurye kullanıcısı
    await prisma.user.upsert({
      where: { email: 'courier@sepettakip.com' },
      update: {
        name: 'Test Courier',
        role: 'COURIER'
      },
      create: {
        email: 'courier@sepettakip.com',
        name: 'Test Courier',
        password: 'Test123',
        role: 'COURIER',
        courier: {
          create: {
            status: 'ACTIVE',
            lastLocationUpdate: new Date()
          }
        }
      }
    });
    
    console.log('✅ Test kullanıcıları oluşturuldu');
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error);
  }
}

async function seedOrders() {
  console.log('🛒 Test siparişleri oluşturuluyor...');
  
  try {
    // Kullanıcıları al
    const customer = await prisma.customer.findFirst();
    const business = await prisma.business.findFirst();
    const courier = await prisma.courier.findFirst();
    
    if (!customer || !business) {
      console.log('Sipariş oluşturmak için gerekli kullanıcılar bulunamadı');
      return;
    }
    
    // Sipariş durumları
    const orderStatuses = ['PENDING', 'PROCESSING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
    // Ödeme yöntemleri
    const paymentMethods = ['CREDIT_CARD', 'CASH', 'BANK_TRANSFER'];
    
    // 10 adet test siparişi oluştur
    for (let i = 0; i < 10; i++) {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30)); // Son 30 gün içinde
      
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const totalAmount = parseFloat((Math.random() * 300 + 50).toFixed(2)); // 50-350 TL
      
      // Sipariş oluştur
      const order = await prisma.order.create({
        data: {
          customerId: customer.id,
          businessId: business.id,
          courierId: status === 'IN_TRANSIT' || status === 'DELIVERED' ? courier?.id : null,
          status: status,
          totalPrice: totalAmount,
          items: [
            { name: `Ürün ${i}-1`, price: totalAmount * 0.6, quantity: 1 },
            { name: `Ürün ${i}-2`, price: totalAmount * 0.4, quantity: 2 }
          ],
          createdAt: orderDate,
          updatedAt: orderDate
        }
      });
      
      // Ödeme oluştur (iptal edilmiş siparişler hariç)
      if (status !== 'CANCELLED') {
        const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        
        await prisma.payment.create({
          data: {
            orderId: order.id,
            amount: totalAmount,
            method: method,
            status: status === 'DELIVERED' ? 'COMPLETED' : 'PENDING',
            transactionId: `TRX-${Date.now()}-${i}`,
            createdAt: orderDate,
            updatedAt: orderDate
          }
        });
      }
    }
    
    console.log('✅ Test siparişleri ve ödemeleri oluşturuldu');
  } catch (error) {
    console.error('Sipariş oluşturma hatası:', error);
  }
}