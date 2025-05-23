import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyJwtToken } from '@/lib/auth';
import { Role } from '@prisma/client';

// GET /api/business/refund-requests - İşletmeye ait iade taleplerini listele
export async function GET(request: NextRequest) {
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

    // URL parametrelerini al
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Filtreleme koşullarını oluştur
    const whereClause: any = {
      businessId: business.id
    };

    if (status) {
      whereClause.status = status;
    }

    if (startDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        gte: new Date(startDate)
      };
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59);
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lte: endDateTime
      };
    }

    // Toplam kayıt sayısını getir
    const totalCount = await prisma.refundRequest.count({
      where: whereClause
    });

    // İade taleplerini getir
    const requests = await prisma.refundRequest.findMany({
      where: whereClause,
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
          select: {
            id: true,
            status: true,
            totalPrice: true,
            createdAt: true,
            actualDelivery: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    return NextResponse.json({
      requests,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('İade talepleri listeleme hatası:', error);
    return NextResponse.json({
      error: 'İade talepleri listelenirken bir hata oluştu'
    }, { status: 500 });
  }
} 