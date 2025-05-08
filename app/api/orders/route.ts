import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { Status } from '@prisma/client';

// GET /api/orders - Tüm siparişleri listele
export async function GET(req: Request) {
  try {
    // Yetkilendirme kontrolü
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Kimlik doğrulama gerekli' }, { status: 401 });
    }
    
    const userData = await verifyJWT(token);
    if (!userData) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }
    
    // Rol kontrolü
    if (!['ADMIN', 'BUSINESS', 'COURIER'].includes(userData.role as string)) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }
    
    // URL'den filtreleme parametrelerini al
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const courierId = searchParams.get('courierId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Filtre koşullarını oluştur
    const filter: any = {};
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (courierId) filter.courierId = courierId;
    
    // Kullanıcı rolüne göre filtreleme
    if (userData.role === 'BUSINESS') {
      filter.businessId = userData.id;
    } else if (userData.role === 'COURIER') {
      // Kurye sadece kendisine atanan siparişleri görebilir
      filter.courierId = userData.id;
    }
    
    // Siparişleri sorgula
    const orders = await prisma.order.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        items: true,
        business: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        customer: {
          select: {
            id: true, 
            name: true,
            email: true,
            phone: true
          }
        },
        courier: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    // Toplam sipariş sayısını al
    const totalOrders = await prisma.order.count({ where: filter });
    
    // Frontend'e uygun formatta veri hazırla
    const formattedOrders = orders.map(order => ({
      id: order.id,
      status: order.status,
      totalPrice: order.totalPrice,
      address: order.address,
      notes: order.notes,
      estimatedDelivery: order.estimatedDelivery,
      actualDelivery: order.actualDelivery,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      customerId: order.customerId,
      businessId: order.businessId,
      courierId: order.courierId,
      customer: order.customer,
      business: order.business,
      courier: order.courier ? {
        id: order.courier.id,
        status: order.courier.status,
        user: order.courier.user
      } : null,
      items: order.items
    }));
    
    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        totalItems: totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
      },
    });
  } catch (error) {
    console.error('Siparişleri getirme hatası:', error);
    return NextResponse.json({ error: 'Siparişler alınırken bir hata oluştu' }, { status: 500 });
  }
}

// POST /api/orders - Yeni sipariş oluştur
export async function POST(req: Request) {
  try {
    // Yetkilendirme kontrolü
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Kimlik doğrulama gerekli' }, { status: 401 });
    }
    
    const userData = await verifyJWT(token);
    if (!userData) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }
    
    // Rol kontrolü
    if (!['ADMIN', 'BUSINESS'].includes(userData.role as string)) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }
    
    // İstek gövdesini al
    const body = await req.json();
    
    // Temel doğrulama
    if (!body.customerId || !body.items || !body.address) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
    }
    
    // Teslimat tahmini hesapla (örnek: şu andan 30 dakika sonra)
    const estimatedDelivery = new Date();
    estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + 30);
    
    // Yeni sipariş oluştur
    const order = await prisma.order.create({
      data: {
        customerId: body.customerId,
        businessId: userData.role === 'BUSINESS' ? userData.id : body.businessId,
        status: Status.PENDING,
        totalPrice: body.totalPrice || 0,
        address: body.address,
        notes: body.notes || '',
        estimatedDelivery,
        items: {
          create: body.items.map((item: any) => ({
            quantity: item.quantity,
            price: item.price,
            name: item.name,
            productId: item.productId
          }))
        }
      }
    });
    
    // İlişkili verileri dahil ederek yeni siparişi getir
    const newOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: true,
        business: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });
    
    return NextResponse.json({ order: newOrder }, { status: 201 });
  } catch (error) {
    console.error('Sipariş oluşturma hatası:', error);
    return NextResponse.json({ error: 'Sipariş oluşturulurken bir hata oluştu' }, { status: 500 });
  }
} 