import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  try {
    // Kullanıcı şifreleri
    const password = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    // Admin kullanıcı
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@sepet.com',
        name: 'Admin User',
        password: adminPassword,
        role: 'ADMIN',
        admin: {
          create: {}
        },
        settings: {
          create: {
            receiveNotifications: true,
            emailNotifications: true,
            pushNotifications: true,
            smsNotifications: true,
            theme: 'dark',
            language: 'tr'
          }
        }
      },
      include: {
        admin: true
      }
    });

    console.log('Admin user created:', adminUser.id);

    // İşletme kullanıcısı
    const businessUser = await prisma.user.create({
      data: {
        email: 'business@sepet.com',
        name: 'Business Owner',
        password: password,
        role: 'BUSINESS',
        business: {
          create: {
            name: 'Test Market',
            address: 'İstanbul, Türkiye',
            phone: '+90 555 123 4567',
            latitude: 41.0082,
            longitude: 28.9784
          }
        },
        settings: {
          create: {
            receiveNotifications: true,
            emailNotifications: true,
            pushNotifications: true,
            smsNotifications: false,
            newOrderAlert: true,
            newCustomerAlert: true,
            deliveryStatusAlert: true,
            theme: 'light',
            language: 'tr'
          }
        }
      },
      include: {
        business: true
      }
    });

    console.log('Business user created:', businessUser.id);

    // Kurye kullanıcısı
    const courierUser = await prisma.user.create({
      data: {
        email: 'courier@sepet.com',
        name: 'Test Courier',
        password: password,
        role: 'COURIER',
        courier: {
          create: {
            phone: '+90 555 987 6543',
            latitude: 41.0062,
            longitude: 28.9764,
            isActive: true,
            vehicleType: 'MOTORCYCLE',
            status: 'AVAILABLE',
            availabilityStatus: 'AVAILABLE',
            currentLatitude: 41.0062,
            currentLongitude: 28.9764,
            documentsVerified: true
          }
        },
        settings: {
          create: {
            receiveNotifications: true,
            emailNotifications: false,
            pushNotifications: true,
            smsNotifications: true,
            newDeliveryAlert: true,
            deliveryStatusAlert: true,
            theme: 'dark',
            language: 'tr'
          }
        }
      },
      include: {
        courier: true
      }
    });

    console.log('Courier user created:', courierUser.id);

    // Müşteri kullanıcısı
    const customerUser = await prisma.user.create({
      data: {
        email: 'customer@sepet.com',
        name: 'Test Customer',
        password: password,
        role: 'CUSTOMER',
        customer: {
          create: {
            phone: '+90 555 111 2222',
            address: 'İstanbul, Türkiye',
            latitude: 41.0102,
            longitude: 28.9704
          }
        },
        settings: {
          create: {
            receiveNotifications: true,
            emailNotifications: true,
            pushNotifications: true,
            smsNotifications: false,
            orderStatusAlert: true,
            deliveryStatusAlert: true,
            theme: 'light',
            language: 'tr'
          }
        }
      },
      include: {
        customer: true
      }
    });

    console.log('Customer user created:', customerUser.id);

    // Test bölgesi oluştur
    const zone = await prisma.zone.create({
      data: {
        name: 'İstanbul Merkez',
        description: 'İstanbul merkez teslimat bölgesi',
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
        businessId: businessUser.business!.id
      }
    });

    console.log('Zone created:', zone.id);

    // Test ürünleri oluştur
    const product1 = await prisma.product.create({
      data: {
        name: 'Ekmek',
        description: 'Taze günlük ekmek',
        price: 5.0,
        imageUrl: 'https://example.com/bread.jpg',
        stock: 100,
        businessId: businessUser.business!.id
      }
    });

    const product2 = await prisma.product.create({
      data: {
        name: 'Süt',
        description: 'Günlük taze süt',
        price: 15.0,
        imageUrl: 'https://example.com/milk.jpg',
        stock: 50,
        businessId: businessUser.business!.id
      }
    });

    console.log('Products created');

    // Kurye için araç oluştur
    const vehicle = await prisma.vehicle.create({
      data: {
        type: 'MOTORCYCLE',
        make: 'Honda',
        model: 'PCX',
        year: 2022,
        licensePlate: '34AB123',
        color: 'Kırmızı',
        courierId: courierUser.courier!.id
      }
    });

    console.log('Vehicle created:', vehicle.id);

    // Test siparişi oluştur
    const order = await prisma.order.create({
      data: {
        customerId: customerUser.customer!.id,
        businessId: businessUser.business!.id,
        zoneId: zone.id,
        status: 'PENDING',
        items: JSON.stringify([
          { id: product1.id, name: 'Ekmek', price: 5.0, quantity: 2 },
          { id: product2.id, name: 'Süt', price: 15.0, quantity: 1 }
        ]),
        totalPrice: 25.0,
        address: 'Test Mahallesi, Test Sokak No:1, İstanbul'
      }
    });

    console.log('Order created:', order.id);

    // Ödeme oluştur
    const payment = await prisma.payment.create({
      data: {
        amount: 25.0,
        method: 'CREDIT_CARD',
        status: 'COMPLETED',
        reference: 'PAY-123456789',
        orderId: order.id,
        customerId: customerUser.customer!.id,
        businessId: businessUser.business!.id,
        processedAt: new Date()
      }
    });

    console.log('Payment created:', payment.id);

    // Test teslimatı oluştur
    const delivery = await prisma.delivery.create({
      data: {
        orderId: order.id,
        courierId: courierUser.courier!.id,
        customerId: customerUser.customer!.id,
        zoneId: zone.id,
        status: 'PENDING',
        estimatedDuration: 30,
        pickupAddress: 'Test Market, İstanbul',
        pickupLatitude: 41.0082,
        pickupLongitude: 28.9784,
        dropoffAddress: 'Test Mahallesi, Test Sokak No:1, İstanbul',
        dropoffLatitude: 41.0102,
        dropoffLongitude: 28.9704,
        distance: 2.5
      }
    });

    console.log('Delivery created:', delivery.id);

    // Bildirim oluştur
    const notification1 = await prisma.notification.create({
      data: {
        type: 'ORDER_PLACED',
        title: 'Yeni Sipariş',
        message: 'Yeni bir sipariş oluşturuldu.',
        userId: businessUser.id,
        isRead: false
      }
    });

    const notification2 = await prisma.notification.create({
      data: {
        type: 'COURIER_ASSIGNED',
        title: 'Kurye Atandı',
        message: 'Siparişiniz için kurye atandı.',
        userId: customerUser.id,
        isRead: false
      }
    });

    console.log('Notifications created');

    // Kurye ödeme oluştur
    const courierPayment = await prisma.payment.create({
      data: {
        amount: 10.0,
        method: 'TRANSFER',
        status: 'COMPLETED',
        reference: 'CR-PAY-12345',
        courierId: courierUser.courier!.id,
        processedAt: new Date()
      }
    });

    console.log('Courier payment created:', courierPayment.id);

    console.log('Database seeding completed.');
  } catch (error) {
    console.error('Error during seed operation:', error);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });