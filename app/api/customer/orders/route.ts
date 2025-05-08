import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Status } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Token doğrulama fonksiyonu
const verifyToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key', (err, decoded) => {
      if (err) return resolve(null);
      resolve(decoded);
    });
  });
};

export async function GET(request: NextRequest) {
  try {
    // Token doğrulama
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Token bulunamadı' },
        { status: 401 }
      );
    }
    
    const decodedToken = await verifyToken(token);
    
    if (!decodedToken || !decodedToken.userId) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Geçersiz token' },
        { status: 401 }
      );
    }
    
    // Kullanıcı müşteri mi kontrolü
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      include: { customer: true }
    });
    
    if (!user || user.role !== 'CUSTOMER' || !user.customer) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Müşteri erişimi gerekiyor' },
        { status: 403 }
      );
    }
    
    const customerId = user.customer.id;
    
    // URL parametrelerini al
    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get('status');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 10;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string) : 1;
    const skip = (page - 1) * limit;
    
    // Status parametresini geçerli bir Status enum değerine dönüştür
    let statusFilter = {};
    if (statusParam) {
      try {
        // Status enum'da bu değer var mı kontrol et
        const validStatus = Status[statusParam as keyof typeof Status];
        if (validStatus) {
          statusFilter = { status: validStatus };
        }
      } catch (e) {
        console.warn(`Geçersiz status parametresi: ${statusParam}`);
      }
    }
    
    // Siparişleri getir
    const orders = await prisma.order.findMany({
      where: {
        customerId,
        ...statusFilter
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            address: true
          }
        },
        courier: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true
              }
            },
            phone: true,
            currentLatitude: true,
            currentLongitude: true,
            lastLocationUpdate: true
          }
        }
      }
    });
    
    // Toplam sipariş sayısını getir (pagination için)
    const totalOrders = await prisma.order.count({
      where: {
        customerId,
        ...statusFilter
      }
    });
    
    // Aktif ve tamamlanmış siparişleri ayır
    // String olarak karşılaştırma yaparak tip sorununu çözüyoruz
    const activeOrders = orders.filter(order => 
      order.status !== 'DELIVERED' && order.status !== 'CANCELLED'
    );
    
    const pastOrders = orders.filter(order => 
      order.status === 'DELIVERED' || order.status === 'CANCELLED'
    );
    
    // Yanıt oluştur
    return NextResponse.json({
      activeOrders,
      pastOrders,
      pagination: {
        total: totalOrders,
        page,
        limit,
        pages: Math.ceil(totalOrders / limit)
      }
    });
  } catch (error) {
    console.error('Müşteri siparişleri alınırken hata:', error);
    return NextResponse.json(
      { error: 'Müşteri siparişleri alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Token doğrulama
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Token bulunamadı' },
        { status: 401 }
      );
    }
    
    const decodedToken = await verifyToken(token);
    
    if (!decodedToken || !decodedToken.userId) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Geçersiz token' },
        { status: 401 }
      );
    }
    
    // Kullanıcı müşteri mi kontrolü
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      include: { customer: true }
    });
    
    if (!user || user.role !== 'CUSTOMER' || !user.customer) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Müşteri erişimi gerekiyor' },
        { status: 403 }
      );
    }
    
    const customerId = user.customer.id;
    
    // Sipariş verilerini al
    const body = await request.json();
    const { businessId, items, address, notes, latitude, longitude, totalPrice } = body;
    
    // Veri doğrulama
    if (!businessId || !items || !totalPrice) {
      return NextResponse.json(
        { error: 'Eksik sipariş bilgileri: işletme, ürünler ve toplam fiyat gereklidir' },
        { status: 400 }
      );
    }
    
    // İşletme kontrolü
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });
    
    if (!business) {
      return NextResponse.json(
        { error: 'İşletme bulunamadı' },
        { status: 404 }
      );
    }
    
    // Yeni sipariş oluştur
    const newOrder = await prisma.order.create({
      data: {
        businessId,
        customerId,
        items, // JSON olarak kaydedilecek
        totalPrice,
        status: Status.PENDING,
        address: address || user.customer.address || '',
        notes: notes || '',
        latitude: latitude || user.customer.latitude,
        longitude: longitude || user.customer.longitude,
        estimatedDelivery: new Date(new Date().getTime() + 45 * 60000) // 45 dakika sonra
      }
    });
    
    // İşletmeye bildirim eklenebilir
    // ...
    
    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('Sipariş oluşturulurken hata:', error);
    return NextResponse.json(
      { error: 'Sipariş oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
} 