import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const prisma = new PrismaClient();

const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
  } catch (error) {
    return null;
  }
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = params.id;
  
  // Authorization header kontrolü
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Yetkisiz erişim. Token bulunamadı.' },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7); // "Bearer " kısmını çıkart
  const decodedToken = verifyToken(token);
  
  if (!decodedToken) {
    return NextResponse.json(
      { error: 'Geçersiz token.' },
      { status: 401 }
    );
  }

  try {
    // Kullanıcıyı doğrula
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      include: { customer: true },
    });

    if (!user || !user.customer || user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Yetkisiz erişim. Müşteri hesabı gereklidir.' },
        { status: 403 }
      );
    }

    // Siparişi getir
    const order = await prisma.order.findUnique({
      where: { 
        id: orderId,
      },
      include: {
        business: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Sipariş bulunamadı.' },
        { status: 404 }
      );
    }

    // Müşterinin kendi siparişini iptal ettiğinden emin ol
    if (order.customerId !== user.customer.id) {
      return NextResponse.json(
        { error: 'Bu siparişi iptal etme yetkiniz yok.' },
        { status: 403 }
      );
    }

    // Sipariş durumunu kontrol et - sadece belirli durumlarda iptal edilebilir
    const cancellableStatuses = ['PENDING', 'PROCESSING', 'PREPARING'];
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        { 
          error: 'Bu sipariş artık iptal edilemez. Sipariş durumu: ' + order.status,
          message: 'Sipariş hazırlandıktan veya kurye teslimata çıktıktan sonra iptal işlemi yapılamaz.'
        },
        { status: 400 }
      );
    }

    // Siparişi iptal et
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });

    // İşletmeye bildirim gönder
    // TODO: Notification service'i entegre edince eklenecek
    /*
    await prisma.notification.create({
      data: {
        businessId: order.businessId,
        message: `${user.customer.user.name} tarafından ${order.id.substring(0, 8)} numaralı sipariş iptal edildi.`,
        type: 'ORDER_CANCELLED',
      },
    });
    */

    return NextResponse.json(
      { 
        message: 'Sipariş başarıyla iptal edildi.',
        order: updatedOrder
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Sipariş iptal edilirken hata:', error);
    return NextResponse.json(
      { error: 'Sipariş iptal edilirken bir hata oluştu.' },
      { status: 500 }
    );
  }
} 