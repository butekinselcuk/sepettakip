import { PrismaClient } from './generated/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Basitleştirilmiş seed işlemi başlatılıyor...');

  try {
    // Sistem ayarları oluştur
    await seedSystemSettings();
    
    // Dashboard metrik verileri oluştur
    await seedDashboardMetrics();
    
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
      { status: 'PENDING', count: 15 },
      { status: 'PROCESSING', count: 8 },
      { status: 'PREPARING', count: 12 },
      { status: 'READY', count: 5 },
      { status: 'IN_TRANSIT', count: 8 },
      { status: 'DELIVERED', count: 70 },
      { status: 'CANCELLED', count: 7 }
    ],
    revenueByPaymentMethod: [
      { method: 'CREDIT_CARD', amount: 3500.75 },
      { method: 'CASH', amount: 1250.50 },
      { method: 'TRANSFER', amount: 850.25 },
      { method: 'MOBILE_PAYMENT', amount: 2100.00 }
    ],
    totalUsers: 230,
    customers: 180,
    businesses: 25,
    couriers: 25,
    totalRevenue: 7701.50,
    periodRevenue: 1250.25
  };

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 