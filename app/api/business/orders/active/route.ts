import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Token doğrulama - Headers veya cookie'den token al
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
    
    // Aktif siparişleri ve teslimatları getir (tamamlanmamış veya iptal edilmemiş)
    const activeOrders = await prisma.order.findMany({
      where: {
        businessId: businessId,
        status: {
          notIn: ['DELIVERED', 'CANCELLED']
        }
      },
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
        delivery: {
          include: {
            courier: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5 // Son 5 aktif siparişi getir
    });
    
    // API yanıtı için verileri formatlama
    const deliveries = activeOrders.map(order => {
      return {
        id: order.id,
        customer: order.customer?.user?.name || 'Müşteri Adı Yok',
        address: order.address || 'Adres Belirtilmemiş',
        status: order.status,
        courierName: order.delivery?.courier?.user?.name || 'Kurye Atanmamış',
        estimatedDelivery: order.createdAt 
          ? new Date(new Date(order.createdAt).getTime() + 60*60*1000).toLocaleString('tr-TR') // 1 saat sonra
          : 'Belirtilmemiş'
      };
    });
    
    return NextResponse.json({
      success: true,
      deliveries
    });
  } catch (error) {
    console.error('Aktif teslimatlar alınırken hata:', error);
    return NextResponse.json(
      { error: 'Aktif teslimatlar alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
} 