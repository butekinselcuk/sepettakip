import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';
import { Role, Status } from '@prisma/client';

// İlgili enum değerleri için sabitler
const REFUND_STATUS = {
  APPROVED: 'APPROVED',
  PARTIAL_APPROVED: 'PARTIAL_APPROVED'
};

const ORDER_STATUS = {
  REFUNDED: 'REFUNDED' as Status,
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED' as Status
};

// POST /api/refunds/process - Onaylanmış iadeleri işleme koyma
export async function POST(request: NextRequest) {
  try {
    // Token doğrulama
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return new NextResponse(JSON.stringify({ error: 'Yetkisiz erişim' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const decoded = await verifyJwtToken(token);
    if (!decoded || (decoded.role !== Role.ADMIN && decoded.role !== Role.BUSINESS)) {
      return new NextResponse(JSON.stringify({ error: 'Bu işlemi gerçekleştirmek için yetkiniz yok' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Request body'yi oku
    const body = await request.json();
    const { refundRequestId } = body;

    if (!refundRequestId) {
      return new NextResponse(JSON.stringify({ error: 'İade talebi ID\'si gereklidir' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // İade talebini bul
    const refundRequest = await prisma.refundRequest.findUnique({
      where: { id: refundRequestId },
      include: {
        order: {
          include: {
            payments: true
          }
        }
      }
    });

    if (!refundRequest) {
      return new NextResponse(JSON.stringify({ error: 'İade talebi bulunamadı' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Yetki kontrolü (sadece ilgili işletme veya admin)
    if (decoded.role === Role.BUSINESS) {
      const business = await prisma.business.findFirst({
        where: { userId: decoded.userId }
      });

      if (!business || business.id !== refundRequest.businessId) {
        return new NextResponse(JSON.stringify({ error: 'Bu talep üzerinde işlem yapma yetkiniz yok' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Talebin durumunu kontrol et
    if (refundRequest.status !== REFUND_STATUS.APPROVED && refundRequest.status !== REFUND_STATUS.PARTIAL_APPROVED) {
      return new NextResponse(JSON.stringify({ error: 'Sadece onaylanmış iade talepleri işleme alınabilir' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // İade miktarı belirleme
    const refundAmount = refundRequest.approvedAmount || refundRequest.refundAmount || 0;
    
    if (refundAmount <= 0) {
      return new NextResponse(JSON.stringify({ error: 'Geçerli bir iade tutarı bulunamadı' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Orijinal ödeme bilgilerini al
    const originalPayment = refundRequest.order.payments[0];

    // Ödeme iadesi oluştur
    const refundPayment = await prisma.payment.create({
      data: {
        amount: -refundAmount, // Negatif değer (iade)
        status: 'REFUNDED',
        method: originalPayment?.method || 'CREDIT_CARD',
        orderId: refundRequest.orderId,
        description: `İade talebi #${refundRequest.id} için ödeme iadesi`,
      }
    });

    // İade talebini güncelle
    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: {
        refundedAt: new Date(),
        // Not: Bu noktada gerçek bir ödeme sağlayıcısı ile işlem yapılabilir
      }
    });

    // Sipariş durumunu güncelle (kısmi veya tam iade)
    await prisma.order.update({
      where: { id: refundRequest.orderId },
      data: {
        status: refundRequest.status === REFUND_STATUS.PARTIAL_APPROVED 
          ? ORDER_STATUS.PARTIALLY_REFUNDED 
          : ORDER_STATUS.REFUNDED,
      }
    });

    // Muhasebe entegrasyonu (gerçek bir muhasebe sistemi ile entegrasyon burada yapılır)
    // Örneğin: await accountingService.recordRefund(refundPayment, refundRequest);

    return new NextResponse(JSON.stringify({ 
      success: true, 
      message: 'İade ödemesi başarıyla işlendi',
      refundPayment
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('İade işleme hatası:', error);
    return new NextResponse(JSON.stringify({ error: 'İade işlenirken bir hata oluştu' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 