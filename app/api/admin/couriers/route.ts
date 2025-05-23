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
    
    // Sayfalama için hesaplamalar
    const skip = (page - 1) * limit;
    
    // Filtreleme için arama koşulları
    let where: any = {};
    
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    // Kuryeleri getir
    const couriers = await prisma.courier.findMany({
      skip,
      take: limit,
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        },
        deliveries: {
          take: 5,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            order: {
              select: {
                id: true,
                status: true,
                totalPrice: true,
                createdAt: true
              }
            }
          }
        },
        _count: {
          select: {
            deliveries: true
          }
        }
      },
      orderBy: {
        user: {
          createdAt: 'desc'
        }
      }
    });
    
    // Toplam kurye sayısını getir (sayfalama için)
    const total = await prisma.courier.count({ where });
    
    // Formatlı cevap döndür
    return NextResponse.json({
      couriers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin couriers API error:', error);
    return NextResponse.json(
      { error: 'Kuryeler alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Kurye güncelleme
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
    const { id, status, isActive, phone, note } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Kurye ID gereklidir' },
        { status: 400 }
      );
    }
    
    // Kurye var mı kontrol et
    const existingCourier = await prisma.courier.findUnique({
      where: { id }
    });
    
    if (!existingCourier) {
      return NextResponse.json(
        { error: 'Kurye bulunamadı' },
        { status: 404 }
      );
    }
    
    // Güncellenecek alanları belirle
    const updateData: any = {};
    
    if (status !== undefined) {
      updateData.status = status;
    }
    
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }
    
    if (phone) {
      updateData.phone = phone;
    }
    
    if (note !== undefined) {
      updateData.notes = note;
    }
    
    // Kurye güncelle
    const updatedCourier = await prisma.courier.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      courier: updatedCourier
    });
  } catch (error) {
    console.error('Kurye güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Kurye güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 