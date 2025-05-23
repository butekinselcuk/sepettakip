const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing database issues and creating test data...');

  try {
    // 1. Test Kullanıcılarını Oluştur veya Güncelle
    console.log('👤 Test kullanıcılarını kontrol ediliyor...');
    const testPassword = await bcryptjs.hash('Test123', 10);
    
    const testUsers = [
      { email: 'admin1@example.com', name: 'Admin User', role: 'ADMIN' },
      { email: 'business1@example.com', name: 'Business User', role: 'BUSINESS' },
      { email: 'courier1@example.com', name: 'Courier User', role: 'COURIER' },
      { email: 'customer1@example.com', name: 'Customer User', role: 'CUSTOMER' }
    ];
    
    for (const userData of testUsers) {
      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (user) {
        console.log(`✅ Kullanıcı zaten mevcut: ${userData.email}`);
        
        // Kullanıcı şifresini güncelle
        user = await prisma.user.update({
          where: { id: user.id },
          data: { password: testPassword }
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: userData.email,
            name: userData.name,
            password: testPassword,
            role: userData.role
          }
        });
        console.log(`✅ Yeni kullanıcı oluşturuldu: ${userData.email}`);
      }
      
      // Rol bazlı kayıtları kontrol et ve oluştur
      if (userData.role === 'ADMIN') {
        const adminRecord = await prisma.admin.findFirst({
          where: { userId: user.id }
        });
        
        if (!adminRecord) {
          await prisma.admin.create({
            data: { userId: user.id }
          });
          console.log(`✅ Admin kaydı oluşturuldu: ${user.email}`);
        }
      } 
      else if (userData.role === 'BUSINESS') {
        let businessRecord = await prisma.business.findFirst({
          where: { userId: user.id }
        });
        
        if (!businessRecord) {
          businessRecord = await prisma.business.create({
            data: {
              userId: user.id,
              name: "Test İşletme",
              address: "Test İşletme Adresi",
              phone: "+905551234567"
            }
          });
          console.log(`✅ İşletme kaydı oluşturuldu: ${user.email}`);
        }
        
        // İşletme için ürünleri kontrol et
        const productCount = await prisma.product.count({
          where: { businessId: businessRecord.id }
        });
        
        if (productCount === 0) {
          // Örnek ürünler oluştur
          await prisma.product.createMany({
            data: [
              {
                name: "Test Ürün 1",
                description: "Test Ürün 1 Açıklama",
                price: 10.99,
                imageUrl: "https://via.placeholder.com/150",
                isActive: true,
                stock: 100,
                businessId: businessRecord.id
              },
              {
                name: "Test Ürün 2",
                description: "Test Ürün 2 Açıklama",
                price: 15.99,
                imageUrl: "https://via.placeholder.com/150",
                isActive: true,
                stock: 50,
                businessId: businessRecord.id
              },
              {
                name: "Test Ürün 3",
                description: "Test Ürün 3 Açıklama",
                price: 25.99,
                imageUrl: "https://via.placeholder.com/150",
                isActive: true,
                stock: 30,
                businessId: businessRecord.id
              }
            ]
          });
          console.log(`✅ İşletme için ürünler oluşturuldu: ${businessRecord.name}`);
        }
        
        // İşletme için bölge kontrolü
        const zoneCount = await prisma.zone.count({
          where: { businessId: businessRecord.id }
        });
        
        if (zoneCount === 0) {
          await prisma.zone.create({
            data: {
              name: "Test Bölge",
              description: "Test Bölge Açıklama",
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
              businessId: businessRecord.id
            }
          });
          console.log(`✅ İşletme için bölge oluşturuldu: ${businessRecord.name}`);
        }
      } 
      else if (userData.role === 'COURIER') {
        let courierRecord = await prisma.courier.findFirst({
          where: { userId: user.id }
        });
        
        if (!courierRecord) {
          courierRecord = await prisma.courier.create({
            data: {
              userId: user.id,
              phone: "+905551234599",
              status: "AVAILABLE",
              availabilityStatus: "AVAILABLE",
              isActive: true,
              documentsVerified: true
            }
          });
          console.log(`✅ Kurye kaydı oluşturuldu: ${user.email}`);
        }
        
        // Kurye aracı kontrolü
        const vehicleCount = await prisma.vehicle.count({
          where: { courierId: courierRecord.id }
        });
        
        if (vehicleCount === 0) {
          await prisma.vehicle.create({
            data: {
              type: "MOTORCYCLE",
              make: "Honda",
              model: "CG 125",
              year: 2020,
              licensePlate: "34 ABC 123",
              color: "Red",
              courierId: courierRecord.id
            }
          });
          console.log(`✅ Kurye için araç oluşturuldu: ${user.email}`);
        }
      } 
      else if (userData.role === 'CUSTOMER') {
        let customerRecord = await prisma.customer.findFirst({
          where: { userId: user.id }
        });
        
        if (!customerRecord) {
          customerRecord = await prisma.customer.create({
            data: {
              userId: user.id,
              phone: "+905551234578",
              address: "Test Müşteri Adresi",
              latitude: 41.0082,
              longitude: 28.9784
            }
          });
          console.log(`✅ Müşteri kaydı oluşturuldu: ${user.email}`);
        }
      }
      
      // Her kullanıcı için ayarları kontrol et
      const settingsCount = await prisma.userSettings.count({
        where: { userId: user.id }
      });
      
      if (settingsCount === 0) {
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
        console.log(`✅ Kullanıcı ayarları oluşturuldu: ${user.email}`);
      }
    }
    
    // 2. Örnek Siparişler ve Teslimatlar Oluştur
    console.log('\n📦 Örnek siparişler ve teslimatlar kontrol ediliyor...');
    
    // Kullanıcıları al
    const business1 = await prisma.business.findFirst({
      where: { user: { email: 'business1@example.com' } }
    });
    
    const courier1 = await prisma.courier.findFirst({
      where: { user: { email: 'courier1@example.com' } }
    });
    
    const customer1 = await prisma.customer.findFirst({
      where: { user: { email: 'customer1@example.com' } }
    });
    
    const zone1 = await prisma.zone.findFirst({
      where: { businessId: business1?.id }
    });
    
    if (!business1 || !courier1 || !customer1 || !zone1) {
      console.error('❌ Gerekli kayıtlar bulunamadı, sipariş oluşturulamıyor.');
      return;
    }
    
    // Business ürünlerini al
    const products = await prisma.product.findMany({
      where: { businessId: business1.id }
    });
    
    if (products.length === 0) {
      console.error('❌ İşletme için ürün bulunamadı, sipariş oluşturulamıyor.');
      return;
    }
    
    // Mevcut siparişleri kontrol et
    const orderCount = await prisma.order.count({
      where: { 
        customerId: customer1.id,
        businessId: business1.id
      }
    });
    
    if (orderCount < 2) {
      console.log('🔄 Yeni siparişler oluşturuluyor...');
      
      // Tamamlanmış sipariş oluştur
      const completedOrder = await prisma.order.create({
        data: {
          customerId: customer1.id,
          businessId: business1.id,
          status: 'DELIVERED',
          items: JSON.stringify([
            { productId: products[0].id, name: products[0].name, quantity: 2, price: products[0].price },
            { productId: products[1].id, name: products[1].name, quantity: 1, price: products[1].price }
          ]),
          totalPrice: parseFloat((products[0].price * 2 + products[1].price).toFixed(2)),
          address: customer1.address,
          notes: 'Lütfen kapıya teslim edin.',
          zoneId: zone1.id
        }
      });
      
      // Tamamlanmış sipariş için teslimat oluştur
      const completedDelivery = await prisma.delivery.create({
        data: {
          orderId: completedOrder.id,
          courierId: courier1.id,
          customerId: customer1.id,
          zoneId: zone1.id,
          status: 'DELIVERED',
          pickupAddress: business1.address,
          dropoffAddress: customer1.address,
          assignedAt: new Date(Date.now() - 3600000), // 1 saat önce
          pickedUpAt: new Date(Date.now() - 1800000), // 30 dakika önce
          deliveredAt: new Date(), // Şimdi
          distance: 5.2,
          actualDistance: 5.4,
          notes: 'Müşteri teslimatından memnun kaldı.',
        }
      });
      
      // Tamamlanmış sipariş için ödeme oluştur
      await prisma.payment.create({
        data: {
          amount: completedOrder.totalPrice,
          method: 'CREDIT_CARD',
          status: 'COMPLETED',
          reference: 'PAY123456',
          orderId: completedOrder.id,
          customerId: customer1.id,
          businessId: business1.id,
          processedAt: new Date()
        }
      });
      
      console.log(`✅ Tamamlanmış sipariş oluşturuldu: ${completedOrder.id}`);
      
      // Bekleyen sipariş oluştur
      const pendingOrder = await prisma.order.create({
        data: {
          customerId: customer1.id,
          businessId: business1.id,
          status: 'PENDING',
          items: JSON.stringify([
            { productId: products[0].id, name: products[0].name, quantity: 1, price: products[0].price }
          ]),
          totalPrice: products[0].price,
          address: customer1.address,
          notes: 'Teslimat öncesi lütfen arayın.',
          zoneId: zone1.id
        }
      });
      
      // Bekleyen sipariş için ödeme oluştur
      await prisma.payment.create({
        data: {
          amount: pendingOrder.totalPrice,
          method: 'CASH',
          status: 'PENDING',
          orderId: pendingOrder.id,
          customerId: customer1.id,
          businessId: business1.id
        }
      });
      
      console.log(`✅ Bekleyen sipariş oluşturuldu: ${pendingOrder.id}`);
    } else {
      console.log('✅ Yeterli sayıda sipariş zaten mevcut.');
    }
    
    // 3. Bildirimler oluştur
    console.log('\n🔔 Bildirimler kontrol ediliyor...');
    
    // Tüm test kullanıcıları için bildirim oluştur
    for (const userData of testUsers) {
      const user = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (!user) continue;
      
      const notificationCount = await prisma.notification.count({
        where: { userId: user.id }
      });
      
      if (notificationCount < 2) {
        await prisma.notification.createMany({
          data: [
            {
              type: 'SYSTEM_NOTIFICATION',
              title: 'Sepet\'e Hoş Geldiniz',
              message: `Merhaba ${user.name}! Sepet'e hoş geldiniz. Uygulamamızı kullanmaya başlamanız için size yardımcı olabiliriz.`,
              isRead: false,
              userId: user.id
            },
            {
              type: 'SYSTEM_NOTIFICATION',
              title: 'Profil Bilgilerinizi Güncelleyin',
              message: 'Lütfen profil bilgilerinizi güncelleyerek size daha iyi hizmet verebilmemize yardımcı olun.',
              isRead: false,
              userId: user.id
            }
          ]
        });
        
        console.log(`✅ ${user.email} için bildirimler oluşturuldu.`);
      } else {
        console.log(`✅ ${user.email} için yeterli bildirim zaten mevcut.`);
      }
    }
    
    console.log('\n✅ Veritabanı düzeltme ve test verisi oluşturma işlemi tamamlandı!');
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 