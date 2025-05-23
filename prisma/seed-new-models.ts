import { PrismaClient } from '@prisma/client';

// Sadece yeni eklenen modeller için seed
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding new models...');

  try {
    // Kullanıcıları al
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      include: { admin: true }
    });

    const businessUser = await prisma.user.findFirst({
      where: { role: 'BUSINESS' },
      include: { business: true }
    });

    const courierUser = await prisma.user.findFirst({
      where: { role: 'COURIER' },
      include: { courier: true }
    });

    const customerUser = await prisma.user.findFirst({
      where: { role: 'CUSTOMER' },
      include: { customer: true }
    });

    if (!adminUser || !businessUser || !courierUser || !customerUser) {
      console.error('Temel kullanıcılar bulunmadı, önce normal seed çalıştırın');
      return;
    }

    // Varolan siparişi ve zone'u al
    const order = await prisma.order.findFirst();
    const zone = await prisma.zone.findFirst();

    if (!order || !zone) {
      console.error('Sipariş veya zone bulunamadı, önce normal seed çalıştırın');
      return;
    }

    // 1. Ürünler oluştur
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

    // 2. Kurye için araç oluştur
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

    // 3. Ödeme oluştur
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

    // 4. Bildirimler oluştur
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

    // 5. Kurye ödemesi oluştur
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
    console.log('New models seeding completed.');
  } catch (error) {
    console.error('Error during new models seed operation:', error);
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