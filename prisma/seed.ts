import { PrismaClient, Role, Status } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Başlangıç verileri yükleniyor...');

  // Tüm verileri temizle (isteğe bağlı, geliştirme ortamında kullanılabilir)
  // await prisma.menuItem.deleteMany();
  // await prisma.business.deleteMany();
  // await prisma.customer.deleteMany();
  // await prisma.courier.deleteMany();
  // await prisma.admin.deleteMany();
  // await prisma.order.deleteMany();
  // await prisma.user.deleteMany();
  // await prisma.userSettings.deleteMany();

  // Kullanıcı oluşturma işlevi
  async function createUser(email: string, password: string, role: Role, fullName: string) {
    const hashedPassword = await hash(password, 10);
    
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log(`Kullanıcı zaten mevcut: ${email}`);
      return existingUser;
    }
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        name: fullName
      }
    });
    
    // Kullanıcı ayarlarını oluştur
    await prisma.userSettings.create({
      data: {
        userId: user.id,
        settings: {
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          preferences: {
            language: 'tr',
            darkMode: false,
            timeZone: 'Europe/Istanbul'
          },
          privacy: {
            shareLocation: true,
            shareActivity: false
          }
        }
      }
    });
    
    console.log(`Oluşturulan kullanıcı: ${email} (${role})`);
    return user;
  }

  // Kullanıcıları oluştur
  const adminUser = await createUser('admin@example.com', 'password', Role.ADMIN, 'Admin Kullanıcı');
  const businessUser = await createUser('business@example.com', 'password', Role.BUSINESS, 'İşletme Kullanıcısı');
  const courierUser = await createUser('courier@example.com', 'password', Role.COURIER, 'Kurye Kullanıcısı');
  const customerUser = await createUser('customer@example.com', 'password', Role.CUSTOMER, 'Müşteri Kullanıcısı');

  // Admin profili oluştur
  const adminProfile = await prisma.admin.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id
    }
  });
  console.log('Admin profili oluşturuldu');

  // İşletme profili oluştur
  const business = await prisma.business.upsert({
    where: { userId: businessUser.id },
    update: {},
    create: {
      userId: businessUser.id,
      name: 'Kebapçı Ahmet',
      status: Status.ACTIVE,
      phone: '+90 555 123 4567',
      address: 'Kızılay Mahallesi, Atatürk Bulvarı No:123, Ankara',
      description: 'Geleneksel lezzetleri modern sunumlarla buluşturan, 30 yıllık tecrübemizle hizmetinizdeyiz.',
      website: 'www.kebapciahmet.com',
      logoUrl: '/images/logo.png',
      rating: 4.8
    }
  });
  console.log('İşletme profili oluşturuldu');

  // Müşteri profili oluştur
  const customer = await prisma.customer.upsert({
    where: { userId: customerUser.id },
    update: {},
    create: {
      userId: customerUser.id,
      address: 'Bahçelievler Mah. 7. Cadde No:42 D:5, Ankara',
      phone: '+90 532 987 6543'
    }
  });
  console.log('Müşteri profili oluşturuldu');

  // Kurye profili oluştur
  const courier = await prisma.courier.upsert({
    where: { userId: courierUser.id },
    update: {},
    create: {
      userId: courierUser.id,
      status: Status.ACTIVE,
      vehicleType: 'Motosiklet',
      phone: '+90 541 234 5678',
      currentLatitude: 39.9255,
      currentLongitude: 32.8662,
      lastLocationUpdate: new Date(),
      ratings: 4.7
    }
  });
  console.log('Kurye profili oluşturuldu');

  // Menü öğeleri oluştur
  const menuItems = [
    { name: "Adana Kebap", description: "Acılı kıyma kebabı", price: 80, category: "Kebaplar", isAvailable: true, imageUrl: "/images/adana.jpg" },
    { name: "Urfa Kebap", description: "Acısız kıyma kebabı", price: 75, category: "Kebaplar", isAvailable: true, imageUrl: "/images/urfa.jpg" },
    { name: "Tavuk Şiş", description: "Marine edilmiş tavuk şiş", price: 65, category: "Kebaplar", isAvailable: true, imageUrl: "/images/tavuk-sis.jpg" },
    { name: "Karışık Izgara", description: "Adana, şiş kebap ve kanat karışık porsiyon", price: 120, category: "Izgaralar", isAvailable: true, imageUrl: "/images/karisik.jpg" },
    { name: "Lahmacun", description: "İnce hamur üzerinde kıymalı açık pide", price: 25, category: "Pideler", isAvailable: true, imageUrl: "/images/lahmacun.jpg" },
    { name: "Kaşarlı Pide", description: "Kaşar peynirli pide", price: 45, category: "Pideler", isAvailable: true, imageUrl: "/images/kasarli-pide.jpg" },
    { name: "Ayran", description: "Geleneksel Türk yoğurt içeceği", price: 10, category: "İçecekler", isAvailable: true, imageUrl: "/images/ayran.jpg" },
    { name: "Şalgam", description: "Ekşi şalgam suyu", price: 10, category: "İçecekler", isAvailable: true, imageUrl: "/images/salgam.jpg" },
    { name: "Künefe", description: "Kadayıf hamurundan yapılan peynirli tatlı", price: 60, category: "Tatlılar", isAvailable: true, imageUrl: "/images/kunefe.jpg" },
    { name: "Baklava", description: "Fıstıklı baklava (4 dilim)", price: 70, category: "Tatlılar", isAvailable: true, imageUrl: "/images/baklava.jpg" }
  ];

  // Her bir menü öğesini oluştur
  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { 
        businessId_name: {
          businessId: business.id,
          name: item.name
        }
      },
      update: {},
      create: {
        businessId: business.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        isAvailable: item.isAvailable,
        imageUrl: item.imageUrl
      }
    });
  }
  console.log('Menü öğeleri oluşturuldu');

  // Örnek siparişler oluştur
  const orderStatuses = ['PENDING', 'PROCESSING', 'PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
  
  for (let i = 0; i < 10; i++) {
    const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
    const price = Math.floor(Math.random() * 200) + 50;
    
    await prisma.order.create({
      data: {
        customerId: customer.id,
        businessId: business.id,
        status: status as Status,
        items: [
          {
            id: '1',
            name: 'Adana Kebap',
            quantity: 2,
            price: 80
          },
          {
            id: '2',
            name: 'Ayran',
            quantity: 2,
            price: 10
          }
        ],
        totalPrice: price,
        address: 'Bahçelievler Mah. 7. Cadde No:42 D:5, Ankara',
        courierId: status === 'IN_TRANSIT' || status === 'DELIVERED' ? courier.id : null,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
      }
    });
  }
  console.log('Örnek siparişler oluşturuldu');

  console.log('Seed verileri başarıyla yüklendi');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 