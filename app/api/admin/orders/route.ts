import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
    
    // JWT token doğrulama
    const decodedToken = await verifyJwtToken(token);
    
    if (!decodedToken || decodedToken.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Admin yetkisi gerekli' },
        { status: 401 }
      );
    }
    
    // URL'den sorgu parametrelerini al
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Sayfalama için hesaplamalar
    const skip = (page - 1) * limit;
    
    // Filtreleme için arama koşulları
    let where: any = {};
    
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { customer: { user: { name: { contains: search, mode: 'insensitive' } } } },
        { business: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    // Sıralama için
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;
    
    // Siparişleri getir
    const orders = await prisma.order.findMany({
      skip,
      take: limit,
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
        business: {
          select: {
            name: true,
            address: true,
            phone: true
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                price: true
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
      orderBy
    });
    
    // Toplam sipariş sayısını getir (sayfalama için)
    const total = await prisma.order.count({ where });
    
    // Formatlı cevap döndür
    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin orders API error:', error);
    return NextResponse.json(
      { error: 'Siparişler alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Sipariş güncelleme
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
    
    // JWT token doğrulama
    const decodedToken = await verifyJwtToken(token);
    
    if (!decodedToken || decodedToken.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Admin yetkisi gerekli' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { id, status, note } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Sipariş ID gereklidir' },
        { status: 400 }
      );
    }
    
    // Sipariş var mı kontrol et
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    });
    
    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Sipariş bulunamadı' },
        { status: 404 }
      );
    }
    
    // Güncellenecek alanları belirle
    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
    }
    
    if (note !== undefined) {
      updateData.adminNote = note;
    }
    
    // Siparişi güncelle
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
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
        business: {
          select: {
            name: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Sipariş güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Sipariş güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 