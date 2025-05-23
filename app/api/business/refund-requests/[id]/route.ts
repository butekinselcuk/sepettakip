import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJwtToken } from '@/lib/auth';
import { Role } from '@prisma/client';

// Enum değerleri
enum RefundRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

// GET /api/business/refund-requests/[id] - İade talebi detayını görüntüle
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Token doğrulama
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({
        error: 'Yetkisiz erişim'
      }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || decoded.role !== Role.BUSINESS) {
      return NextResponse.json({
        error: 'Bu işlemi gerçekleştirmek için yetkiniz yok'
      }, { status: 403 });
    }

    // İşletmeyi bul
    const business = await prisma.business.findFirst({
      where: { userId: decoded.userId }
    });

    if (!business) {
      return NextResponse.json({
        error: 'İşletme bulunamadı'
      }, { status: 404 });
    }

    // İade talebini bul
    const refundRequest = await prisma.refundRequest.findUnique({
      where: {
        id: params.id,
        businessId: business.id
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        order: {
          include: {
            orderItems: {
              include: {
                product: true
              }
            },
            delivery: true
          }
        },
        refundItems: {
          include: {
            orderItem: {
              include: {
                product: true
              }
            }
          }
        },
        refundEvidence: true
      }
    });

    if (!refundRequest) {
      return NextResponse.json({
        error: 'İade talebi bulunamadı'
      }, { status: 404 });
    }

    return NextResponse.json(refundRequest);
  } catch (error) {
    console.error('İade talebi detayı görüntüleme hatası:', error);
    return NextResponse.json({
      error: 'İade talebi detayı görüntülenirken bir hata oluştu'
    }, { status: 500 });
  }
}

// PATCH /api/business/refund-requests/[id] - İade talebini güncelle (onay, ret, vb.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Token doğrulama
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({
        error: 'Yetkisiz erişim'
      }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || decoded.role !== Role.BUSINESS) {
      return NextResponse.json({
        error: 'Bu işlemi gerçekleştirmek için yetkiniz yok'
      }, { status: 403 });
    }

    // İşletmeyi bul
    const business = await prisma.business.findFirst({
      where: { userId: decoded.userId }
    });

    if (!business) {
      return NextResponse.json({
        error: 'İşletme bulunamadı'
      }, { status: 404 });
    }

    // İade talebi veritabanından al
    const refundRequest = await prisma.refundRequest.findUnique({
      where: {
        id: params.id,
        businessId: business.id
      },
      include: {
        order: true
      }
    });

    if (!refundRequest) {
      return NextResponse.json({
        error: 'İade talebi bulunamadı'
      }, { status: 404 });
    }

    // Talep zaten sonuçlandırılmış mı kontrol et
    if (
      refundRequest.status === RefundRequestStatus.APPROVED ||
      refundRequest.status === RefundRequestStatus.REJECTED
    ) {
      return NextResponse.json({
        error: 'Bu talep zaten sonuçlandırılmış, durumu değiştirilemez'
      }, { status: 400 });
    }

    // İstek gövdesinden verileri al
    const body = await request.json();
    const { status, notes, refundAmount } = body;

    if (!status) {
      return NextResponse.json({
        error: 'Durum bilgisi zorunludur'
      }, { status: 400 });
    }

    // Eğer onaylanıyorsa, iade miktarı zorunlu
    if (status === RefundRequestStatus.APPROVED && !refundAmount) {
      return NextResponse.json({
        error: 'İade tutarı zorunludur'
      }, { status: 400 });
    }

    // İade talebini güncelle
    const updatedRefundRequest = await prisma.refundRequest.update({
      where: {
        id: params.id
      },
      data: {
        status,
        businessNotes: notes || null,
        refundAmount: status === RefundRequestStatus.APPROVED ? refundAmount : null,
        updatedAt: new Date()
      }
    });

    // Eğer onaylandıysa, ödeme işlemini yap (bu örnek için simüle ediyoruz)
    if (status === RefundRequestStatus.APPROVED) {
      // Ödeme kaydı oluştur
      await prisma.$executeRaw`
        INSERT INTO "PaymentTransaction" (
          "amount", "type", "status", "orderId", "customerId", "businessId", "description", "createdAt"
        ) VALUES (
          ${refundAmount}, 'REFUND', 'COMPLETED', ${refundRequest.orderId}, 
          ${refundRequest.customerId}, ${business.id}, 
          ${'Sipariş #' + refundRequest.orderId + ' için iade işlemi'}, NOW()
        )
      `;

      // Bildirim oluştur
      await prisma.notification.create({
        data: {
          title: 'İade Talebiniz Onaylandı',
          content: `#${refundRequest.orderId} numaralı siparişiniz için iade talebiniz onaylandı. ${refundAmount}₺ tutarındaki ödeme hesabınıza iade edildi.`,
          userId: refundRequest.order.customerId,
          type: 'ORDER_UPDATE',
          resourceId: refundRequest.id,
          resourceType: 'REFUND_REQUEST'
        }
      });
    } else if (status === RefundRequestStatus.REJECTED) {
      // Red bildirimi oluştur
      await prisma.notification.create({
        data: {
          title: 'İade Talebiniz Reddedildi',
          content: `#${refundRequest.orderId} numaralı siparişiniz için iade talebiniz reddedildi. ${notes ? `Neden: ${notes}` : ''}`,
          userId: refundRequest.order.customerId,
          type: 'ORDER_UPDATE',
          resourceId: refundRequest.id,
          resourceType: 'REFUND_REQUEST'
        }
      });
    }

    return NextResponse.json(updatedRefundRequest);
  } catch (error) {
    console.error('İade talebi güncelleme hatası:', error);
    return NextResponse.json({
      error: 'İade talebi güncellenirken bir hata oluştu'
    }, { status: 500 });
  }
} 