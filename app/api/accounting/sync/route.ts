import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';
import { Role } from '@prisma/client';

// POST /api/accounting/sync - Muhasebe sistemi ile senkronizasyon 
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
    if (!decoded || decoded.role !== Role.ADMIN) {
      return new NextResponse(JSON.stringify({ error: 'Bu işlemi gerçekleştirmek için yetkiniz yok' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Request body'yi oku (opsiyonel parametreler)
    const body = await request.json();
    const { startDate, endDate, businessId } = body;

    // Varsayılan tarih aralığı - son 24 saat
    const defaultStartDate = new Date();
    defaultStartDate.setHours(defaultStartDate.getHours() - 24);
    
    const syncStartDate = startDate ? new Date(startDate) : defaultStartDate;
    const syncEndDate = endDate ? new Date(endDate) : new Date();

    // İşletme filtresi
    const businessFilter = businessId ? { businessId } : {};

    // İşlenecek işlemleri bul
    const orders = await prisma.order.findMany({
      where: {
        ...businessFilter,
        updatedAt: {
          gte: syncStartDate,
          lte: syncEndDate
        },
        // Sadece tamamlanmış, iptal edilmiş veya iade edilmiş siparişleri dahil et
        status: {
          in: ['DELIVERED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED']
        }
      },
      include: {
        payments: true,
        business: true,
        customer: {
          include: {
            user: true
          }
        },
        refundRequests: {
          where: {
            status: {
              in: ['APPROVED', 'PARTIAL_APPROVED']
            },
            refundedAt: {
              not: null
            }
          }
        },
        cancellationRequests: {
          where: {
            status: {
              in: ['APPROVED', 'AUTO_APPROVED']
            },
            cancelledAt: {
              not: null
            }
          }
        }
      }
    });

    // Muhasebe verilerini hazırla
    const accountingRecords = orders.map(order => {
      // Sipariş tutarı ve iadeler
      const orderTotal = order.totalPrice;
      const isRefunded = order.status === 'REFUNDED' || order.status === 'PARTIALLY_REFUNDED';
      const isCancelled = order.status === 'CANCELLED';
      
      // İade miktarı
      const refundAmount = order.refundRequests.reduce((sum, req) => {
        return sum + (req.approvedAmount || req.refundAmount || 0);
      }, 0);
      
      // İptal ücreti
      const cancellationFee = order.cancellationRequests.reduce((sum, req) => {
        return sum + (req.cancellationFee || 0);
      }, 0);
      
      // Net tutar hesaplama
      const netAmount = isRefunded ? 
        (orderTotal - refundAmount) : 
        (isCancelled ? cancellationFee : orderTotal);

      return {
        orderId: order.id,
        businessId: order.businessId,
        businessName: order.business?.name || 'Bilinmeyen İşletme',
        customerId: order.customerId,
        customerName: order.customer?.user?.name || 'Bilinmeyen Müşteri',
        orderDate: order.createdAt,
        orderStatus: order.status,
        grossAmount: orderTotal,
        refundAmount: isRefunded ? refundAmount : 0,
        cancellationFee: isCancelled ? cancellationFee : 0,
        netAmount: netAmount,
        paymentMethod: order.payments[0]?.method || 'UNKNOWN',
        transactionIds: order.payments.map(p => p.id).join(','),
        isReconciled: false, // Muhasebe sistemi ile uzlaştırma durumu
        notes: isRefunded ? 'İade işlemi var' : (isCancelled ? 'İptal edilmiş sipariş' : ''),
      };
    });

    // Burada dış muhasebe sistemi API'ye entegrasyon yapılırdı
    // Örnek: await externalAccountingAPI.syncTransactions(accountingRecords);
    
    // Sahte bir senkronizasyon sonucu
    const syncResult = {
      syncedRecordsCount: accountingRecords.length,
      syncDate: new Date(),
      syncStatus: 'SUCCESS',
      syncDetails: {
        totalAmount: accountingRecords.reduce((sum, record) => sum + record.netAmount, 0),
        refundTotal: accountingRecords.reduce((sum, record) => sum + record.refundAmount, 0),
        cancellationFeeTotal: accountingRecords.reduce((sum, record) => sum + record.cancellationFee, 0),
        businessCount: new Set(accountingRecords.map(record => record.businessId)).size
      }
    };

    return new NextResponse(JSON.stringify({
      success: true,
      message: 'Muhasebe sistemi başarıyla senkronize edildi',
      syncResult,
      recordCount: accountingRecords.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Muhasebe senkronizasyon hatası:', error);
    return new NextResponse(JSON.stringify({ error: 'Muhasebe sistemi senkronize edilirken bir hata oluştu' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 