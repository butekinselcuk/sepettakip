import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';

// GET: Müşteri siparişlerini getir
export async function GET(request: NextRequest) {
  try {
    // Token doğrulama
    const token = request.headers.get('authorization')?.split(' ')[1] || 
                  request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Token bulunamadı' },
        { status: 401 }
      );
    }
    
    const decodedToken = await verifyJwtToken(token);
    
    if (!decodedToken || !decodedToken.userId) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Geçersiz token' },
        { status: 401 }
      );
    }
    
    // Kullanıcı customer mi kontrolü
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // Filtreleme koşullarını oluştur
    const where = {
      customerId: customerId,
      ...(status ? { status } : {})
      };
    
    // Siparişleri getir
    const orders = await prisma.order.findMany({
      where,
      include: {
        business: {
          select: {
            name: true,
            address: true,
            phone: true
          }
        },
        delivery: true,
        payments: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });
    
    // Toplam sipariş sayısını getir
    const totalOrders = await prisma.order.count({ where });
    
    return NextResponse.json({
      orders,
      pagination: {
        total: totalOrders,
        page,
        limit,
        pages: Math.ceil(totalOrders / limit)
      }
    });
  } catch (error) {
    console.error('Siparişleri getirirken hata:', error);
    return NextResponse.json(
      { error: 'Siparişler alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST: Müşteri yeni sipariş oluştur
export async function POST(request: NextRequest) {
  try {
    // Token doğrulama
    const token = request.headers.get('authorization')?.split(' ')[1] || 
                  request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Token bulunamadı' },
        { status: 401 }
      );
    }
    
    const decodedToken = await verifyJwtToken(token);
    
    if (!decodedToken || !decodedToken.userId) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Geçersiz token' },
        { status: 401 }
      );
    }
    
    // Kullanıcı customer mi kontrolü
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
    
    // Request verilerini al
    const body = await request.json();
    
    // Zorunlu alanları kontrol et
    if (!body.businessId || !body.zoneId || !body.items || !body.totalPrice || !body.address) {
      return NextResponse.json(
        { error: 'Eksik bilgiler: businessId, zoneId, items, totalPrice ve address alanları zorunludur' },
        { status: 400 }
      );
    }
    
    // İşletmenin varlığını kontrol et
    const business = await prisma.business.findUnique({
      where: { id: body.businessId }
    });
    
    if (!business) {
      return NextResponse.json(
        { error: 'İşletme bulunamadı' },
        { status: 404 }
      );
    }
    
    // Sipariş oluştur
    const order = await prisma.order.create({
      data: {
        customerId: customerId,
        businessId: body.businessId,
        zoneId: body.zoneId,
        items: typeof body.items === 'string' ? body.items : JSON.stringify(body.items),
        totalPrice: body.totalPrice,
        address: body.address || user.customer.address,
        notes: body.notes || null,
        status: 'PENDING'
      }
    });
    
    // Ödeme bilgisi varsa ödeme oluştur
    if (body.payment) {
      await prisma.payment.create({
        data: {
          amount: body.totalPrice,
          method: body.payment.method || 'CASH',
          status: body.payment.status || 'PENDING',
          reference: body.payment.reference || null,
          orderId: order.id,
          customerId: customerId,
          businessId: body.businessId
        }
      });
    }
    
    // Müşteriye bildirim oluştur
    await prisma.notification.create({
      data: {
        type: 'ORDER_PLACED',
        title: 'Siparişiniz Alındı',
        message: `${order.id} numaralı siparişiniz alındı. Durumu buradan takip edebilirsiniz.`,
        isRead: false,
        userId: user.id
      }
    });
    
    // İşletmeye bildirim gönder
    const businessUser = await prisma.business.findUnique({
      where: { id: body.businessId },
      select: { userId: true }
    });
    
    if (businessUser) {
      await prisma.notification.create({
        data: {
          type: 'ORDER_PLACED',
          title: 'Yeni Sipariş Alındı',
          message: `${order.id} numaralı yeni bir sipariş alındı.`,
          isRead: false,
          userId: businessUser.userId
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Sipariş oluştururken hata:', error);
    return NextResponse.json(
      { error: 'Sipariş oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// GET: Sipariş detaylarını getir
export async function GET_BY_ID(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Token doğrulama
    const token = request.headers.get('authorization')?.split(' ')[1] || 
                  request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Token bulunamadı' },
        { status: 401 }
      );
    }
    
    const decodedToken = await verifyJwtToken(token);
    
    if (!decodedToken || !decodedToken.userId) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Geçersiz token' },
        { status: 401 }
      );
    }
    
    // Kullanıcı customer mi kontrolü
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
    const orderId = params.id;
    
    // Siparişi getir
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        business: true,
        delivery: {
          include: {
            courier: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                },
                vehicle: true
              }
            }
          }
        },
        payments: true
      }
    });
    
    // Sipariş yoksa veya başka bir müşteriye aitse hata dön
    if (!order) {
      return NextResponse.json(
        { error: 'Sipariş bulunamadı' },
        { status: 404 }
      );
    }
    
    if (order.customerId !== customerId) {
      return NextResponse.json(
        { error: 'Bu siparişe erişim yetkiniz yok' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Sipariş detayları alınırken hata:', error);
    return NextResponse.json(
      { error: 'Sipariş detayları alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
} 