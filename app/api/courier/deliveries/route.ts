import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deliveryFilterSchema, deliveryStatusUpdateSchema } from '@/lib/validations/delivery';
import { getTokenData } from '@/lib/auth';
import { JWTPayload } from '@/lib/validations/auth';
import { verifyJwtToken } from '@/lib/auth';

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

    // Kullanıcı courier mi kontrolü
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      include: { courier: true }
    });

    if (!user || user.role !== 'COURIER' || !user.courier) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Kurye erişimi gerekiyor' },
        { status: 403 }
      );
    }

    const courierId = user.courier.id;
    
    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // Filtreleme koşullarını oluştur
    const where = {
      courierId: courierId,
      ...(status ? { status } : {})
    };
    
    // Teslimatları getir
    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
            customer: {
          include: {
                user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        order: {
          include: {
            business: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });
    
    // Toplam teslimat sayısını getir
    const totalDeliveries = await prisma.delivery.count({ where });
    
    return NextResponse.json({
      deliveries,
      pagination: {
        total: totalDeliveries,
        page,
        limit,
        pages: Math.ceil(totalDeliveries / limit)
      }
    });
  } catch (error) {
    console.error('Teslimatları getirirken hata:', error);
    return NextResponse.json(
      { error: 'Teslimatlar alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT: Teslimat durumunu güncelle
export async function PUT(request: NextRequest) {
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
    
    // Kullanıcı courier mi kontrolü
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      include: { courier: true }
    });
    
    if (!user || user.role !== 'COURIER' || !user.courier) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Kurye erişimi gerekiyor' },
        { status: 403 }
      );
    }
    
    const courierId = user.courier.id;
    
    // Request verilerini al
    const body = await request.json();
    
    // Teslimat ID'si kontrol et
    if (!body.id) {
      return NextResponse.json(
        { error: 'Teslimat ID\'si belirtilmedi' },
        { status: 400 }
      );
    }
    
    // Teslimatın kuryeye ait olduğunu kontrol et
    const existingDelivery = await prisma.delivery.findUnique({
      where: { id: body.id }
    });
    
    if (!existingDelivery) {
      return NextResponse.json(
        { error: 'Teslimat bulunamadı' },
        { status: 404 }
      );
    }
    
    if (existingDelivery.courierId !== courierId) {
      return NextResponse.json(
        { error: 'Bu teslimatı güncelleme yetkiniz yok' },
        { status: 403 }
      );
    }
    
    // Güncelleme verilerini hazırla
    const updateData: any = {};
    
    if (body.status) {
      updateData.status = body.status;
      
      // Duruma göre timestamp güncelle
      if (body.status === 'PICKED_UP') {
        updateData.pickedUpAt = new Date();
      } else if (body.status === 'DELIVERED') {
        updateData.deliveredAt = new Date();
      }
    }
    
    if (body.notes) updateData.notes = body.notes;
    if (body.actualDistance) updateData.actualDistance = body.actualDistance;
    
    // Konum bilgisi varsa güncelle
    if (body.currentLatitude && body.currentLongitude) {
      await prisma.courier.update({
        where: { id: courierId },
        data: {
          currentLatitude: body.currentLatitude,
          currentLongitude: body.currentLongitude
        }
      });
    }
    
    // Teslimatı güncelle
    const updatedDelivery = await prisma.delivery.update({
      where: { id: body.id },
      data: updateData
    });
    
    // Teslimat tamamlandıysa siparişi de güncelle
    if (body.status === 'DELIVERED' && updatedDelivery.orderId) {
      await prisma.order.update({
        where: { id: updatedDelivery.orderId },
        data: { status: 'DELIVERED' }
      });
      
      // Bildirimleri oluştur
      // Müşteriye bildirim
      const customer = await prisma.customer.findUnique({
        where: { id: updatedDelivery.customerId },
        select: { userId: true }
      });
      
      if (customer) {
        await prisma.notification.create({
        data: {
            type: 'ORDER_DELIVERED',
            title: 'Siparişiniz Teslim Edildi',
            message: `Siparişiniz başarıyla teslim edildi.`,
            isRead: false,
            userId: customer.userId
          }
        });
      }
      
      // İşletmeye bildirim
      const order = await prisma.order.findUnique({
        where: { id: updatedDelivery.orderId },
        select: { 
          businessId: true,
          business: {
            select: {
              userId: true
            }
          }
        }
      });
      
      if (order?.business?.userId) {
        await prisma.notification.create({
          data: {
            type: 'ORDER_DELIVERED',
            title: 'Sipariş Teslim Edildi',
            message: `${updatedDelivery.orderId} numaralı sipariş başarıyla teslim edildi.`,
            isRead: false,
            userId: order.business.userId
          }
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      delivery: updatedDelivery
    });
  } catch (error) {
    console.error('Teslimat güncellenirken hata:', error);
    return NextResponse.json(
      { error: 'Teslimat güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST: Kuryenin konum bilgisini güncelle
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
    
    // Kullanıcı courier mi kontrolü
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      include: { courier: true }
    });
    
    if (!user || user.role !== 'COURIER' || !user.courier) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Kurye erişimi gerekiyor' },
        { status: 403 }
      );
    }
    
    const courierId = user.courier.id;
    
    // Request verilerini al
    const body = await request.json();
    
    // Konum bilgisi kontrol et
    if (!body.latitude || !body.longitude) {
      return NextResponse.json(
        { error: 'Konum bilgisi eksik' },
        { status: 400 }
      );
    }
    
    // Kurye konumunu güncelle
    const updatedCourier = await prisma.courier.update({
      where: { id: courierId },
      data: {
        currentLatitude: body.latitude,
        currentLongitude: body.longitude,
        availabilityStatus: body.status || 'AVAILABLE'
      }
    });
    
    return NextResponse.json({
      success: true,
      courier: {
        id: updatedCourier.id,
        latitude: updatedCourier.currentLatitude,
        longitude: updatedCourier.currentLongitude,
        status: updatedCourier.availabilityStatus
      }
    });
  } catch (error) {
    console.error('Kurye konumu güncellenirken hata:', error);
    return NextResponse.json(
      { error: 'Konum güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 