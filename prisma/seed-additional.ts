import { PrismaClient } from './generated/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Ek seed işlemi başlatılıyor...');

  try {
    // SystemSettings tablosuna test verileri ekleme
    await createSystemSettings();

    // Orders tablosuna test verileri ekleme
    await createOrders();

    // Payments tablosuna test verileri ekleme
    await createPayments();

    console.log('✅ Ek seed işlemi tamamlandı!');
  } catch (error) {
    console.error('❌ Seed işlemi sırasında hata:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createSystemSettings() {
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
    },
    {
      key: 'email.smtp.user',
      value: 'info@sepettakip.com',
      category: 'EMAIL',
      description: 'SMTP kullanıcı adı',
      dataType: 'STRING',
      isEncrypted: true
    },
    {
      key: 'email.smtp.password',
      value: 'test-password',
      category: 'EMAIL',
      description: 'SMTP şifresi',
      dataType: 'STRING',
      isEncrypted: true
    },
    {
      key: 'email.from',
      value: 'SepetTakip <info@sepettakip.com>',
      category: 'EMAIL',
      description: 'E-posta gönderen bilgisi',
      dataType: 'STRING',
      isEncrypted: false
    },
    {
      key: 'dashboard.metrics.period',
      value: 'today',
      category: 'DASHBOARD',
      description: 'Dashboard metrik periyodu (today, week, month, year)',
      dataType: 'STRING',
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

async function createOrders() {
  console.log('🛒 Test siparişleri oluşturuluyor...');
  
  // Önce kullanıcıları kontrol et
  const customerUser = await prisma.user.findUnique({
    where: { email: 'customer@sepettakip.com' }
  });
  
  const businessUser = await prisma.user.findUnique({
    where: { email: 'business@sepettakip.com' }
  });
  
  const courierUser = await prisma.user.findUnique({
    where: { email: 'courier@sepettakip.com' }
  });

  if (!customerUser || !businessUser || !courierUser) {
    console.log('❌ Gerekli kullanıcı hesapları bulunamadı, sipariş oluşturulamıyor');
    return;
  }

  // Customer oluştur veya al
  let customer = await prisma.customer.findUnique({
    where: { userId: customerUser.id }
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        userId: customerUser.id,
        address: 'Örnek Adres 123, Ankara',
        phone: '+90 555 123 4567'
      }
    });
  }

  // Business oluştur veya al
  let business = await prisma.business.findUnique({
    where: { userId: businessUser.id }
  });

  if (!business) {
    business = await prisma.business.create({
      data: {
        userId: businessUser.id,
        name: 'Örnek İşletme',
        address: 'İşletme Adresi 456, İstanbul',
        phone: '+90 555 987 6543',
        status: 'ACTIVE'
      }
    });
  }

  // Courier oluştur veya al
  let courier = await prisma.courier.findUnique({
    where: { userId: courierUser.id }
  });

  if (!courier) {
    courier = await prisma.courier.create({
      data: {
        userId: courierUser.id,
        status: 'ACTIVE',
        lastLocationUpdate: new Date()
      }
    });
  }

  // Sipariş durumları
  const orderStatuses = ['PENDING', 'PROCESSING', 'PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
  
  // 15 adet test siparişi oluştur
  for (let i = 0; i < 15; i++) {
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30)); // Son 30 gün içinde rastgele tarih
    
    const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
    const price = (Math.random() * 300 + 50).toFixed(2); // 50-350 TL arası rastgele fiyat
    const totalPrice = (parseFloat(price) + (parseFloat(price) * 0.18)).toFixed(2); // KDV eklenmiş fiyat
    
    await prisma.order.create({
      data: {
        customerId: customer.id,
        businessId: business.id,
        courierId: status === 'IN_TRANSIT' || status === 'DELIVERED' ? courier.id : null,
        status: status,
        totalAmount: parseFloat(totalPrice),
        items: {
          create: [
            {
              name: `Ürün ${i}-1`,
              price: parseFloat((parseFloat(price) * 0.6).toFixed(2)),
              quantity: 1
            },
            {
              name: `Ürün ${i}-2`,
              price: parseFloat((parseFloat(price) * 0.4).toFixed(2)),
              quantity: 2
            }
          ]
        },
        createdAt: orderDate,
        updatedAt: orderDate
      }
    });
  }

  console.log('✅ 15 adet test siparişi oluşturuldu');
}

async function createPayments() {
  console.log('💳 Test ödemeleri oluşturuluyor...');
  
  // Önce siparişleri al
  const orders = await prisma.order.findMany({
    take: 15
  });

  if (orders.length === 0) {
    console.log('❌ Ödeme oluşturmak için sipariş bulunamadı');
    return;
  }

  // Ödeme yöntemleri
  const paymentMethods = ['CREDIT_CARD', 'CASH', 'BANK_TRANSFER'];
  
  // Her sipariş için ödeme oluştur
  for (const order of orders) {
    // Sipariş iptal edilmediyse ödeme oluştur
    if (order.status !== 'CANCELLED') {
      const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          method: method,
          status: order.status === 'DELIVERED' ? 'COMPLETED' : 'PENDING',
          transactionId: `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        }
      });
    }
  }

  console.log('✅ Ödeme kayıtları oluşturuldu');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 