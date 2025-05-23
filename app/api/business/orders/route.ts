import { NextRequest, NextResponse } from "next/server";
import { verifyJwtToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Status } from "@prisma/client";

// GET endpoint for fetching business orders
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
    
    // Kullanıcı business mi kontrolü
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      include: { business: true }
    });
    
    if (!user || user.role !== 'BUSINESS' || !user.business) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: İşletme erişimi gerekiyor' },
        { status: 403 }
      );
    }
    
    const businessId = user.business.id;
    
    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // Filtreleme koşullarını oluştur
    const where = {
      businessId: businessId,
      ...(status ? { status } : {})
    };
    
    // Siparişleri getir
    const orders = await prisma.order.findMany({
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

// PUT endpoint for updating order status
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
    
    // Kullanıcı business mi kontrolü
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      include: { business: true }
    });
    
    if (!user || user.role !== 'BUSINESS' || !user.business) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: İşletme erişimi gerekiyor' },
        { status: 403 }
      );
    }
    
    const businessId = user.business.id;
    
    // Request verilerini al
    const body = await request.json();
    
    // Sipariş ID'si kontrol et
    if (!body.id) {
      return NextResponse.json(
        { error: 'Sipariş ID\'si belirtilmedi' },
        { status: 400 }
      );
    }
    
    // Siparişin işletmeye ait olduğunu kontrol et
    const existingOrder = await prisma.order.findUnique({
      where: { id: body.id }
    });
    
    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Sipariş bulunamadı' },
        { status: 404 }
      );
    }
    
    if (existingOrder.businessId !== businessId) {
      return NextResponse.json(
        { error: 'Bu siparişi güncelleme yetkiniz yok' },
        { status: 403 }
      );
    }
    
    // Güncelleme verilerini hazırla
    const updateData = {};
    
    if (body.status) updateData.status = body.status;
    if (body.notes) updateData.notes = body.notes;
    if (body.address) updateData.address = body.address;
    
    // Siparişi güncelle
    const updatedOrder = await prisma.order.update({
      where: { id: body.id },
      data: updateData
    });
    
    // Sipariş durumu değiştiyse bildirim gönder
    if (body.status && body.status !== existingOrder.status) {
      // İşletmeye bildirim
      await prisma.notification.create({
        data: {
          type: 'ORDER_ACCEPTED',
          title: 'Sipariş Durumu Güncellendi',
          message: `${updatedOrder.id} numaralı siparişin durumu ${updatedOrder.status} olarak güncellendi.`,
          isRead: false,
          userId: user.id
        }
      });
      
      // Müşteriye bildirim
      const customer = await prisma.customer.findUnique({
        where: { id: updatedOrder.customerId },
        select: { userId: true }
      });
      
      if (customer) {
        await prisma.notification.create({
          data: {
            type: 'ORDER_ACCEPTED',
            title: 'Sipariş Durumunuz Güncellendi',
            message: `${updatedOrder.id} numaralı siparişinizin durumu ${updatedOrder.status} olarak güncellendi.`,
            isRead: false,
            userId: customer.userId
          }
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Sipariş güncellenirken hata:', error);
    return NextResponse.json(
      { error: 'Sipariş güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST: Yeni sipariş oluştur
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
    
    // Kullanıcı business mi kontrolü
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      include: { business: true }
    });
    
    if (!user || user.role !== 'BUSINESS' || !user.business) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: İşletme erişimi gerekiyor' },
        { status: 403 }
      );
    }
    
    const businessId = user.business.id;
    
    // Request verilerini al
    const body = await request.json();
    
    // Zorunlu alanları kontrol et
    if (!body.customerId || !body.zoneId || !body.items || !body.totalPrice || !body.address) {
      return NextResponse.json(
        { error: 'Eksik bilgiler: customerId, zoneId, items, totalPrice ve address alanları zorunludur' },
        { status: 400 }
      );
    }
    
    // Sipariş oluştur
    const order = await prisma.order.create({
      data: {
        customerId: body.customerId,
        businessId: businessId,
        zoneId: body.zoneId,
        items: typeof body.items === 'string' ? body.items : JSON.stringify(body.items),
        totalPrice: body.totalPrice,
        address: body.address,
        notes: body.notes || null,
        status: body.status || 'PENDING'
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
          customerId: body.customerId,
          businessId: businessId
        }
      });
    }
    
    // Sipariş bildirimi oluştur
    await prisma.notification.create({
      data: {
        type: 'ORDER_PLACED',
        title: 'Yeni Sipariş Alındı',
        message: `${order.id} numaralı yeni bir sipariş alındı.`,
        isRead: false,
        userId: user.id
      }
    });
    
    // Müşteriye de bildirim gönder
    await prisma.notification.create({
      data: {
        type: 'ORDER_PLACED',
        title: 'Siparişiniz Alındı',
        message: `${order.id} numaralı siparişiniz alındı. Durumu buradan takip edebilirsiniz.`,
        isRead: false,
        userId: (await prisma.customer.findUnique({
          where: { id: body.customerId },
          select: { userId: true }
        }))?.userId || ''
      }
    });
    
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