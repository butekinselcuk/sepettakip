import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';
import { cache } from '@/lib/cache';
import { CacheKeys } from '@/lib/cacheKeys';

// Define types based on Prisma schema to avoid type errors
type OrderWithRelations = {
  id: string;
  status: string;
  totalPrice: number;
  address: string;
  notes: string | null;
  estimatedDelivery: Date | null;
  actualDelivery: Date | null;
  createdAt: Date;
  updatedAt: Date;
  customerId: string;
  businessId: string;
  courierId: string | null;
  items: any;
  business: {
    id: string;
    businessName: string;
    // Add other relevant business fields
  } | null;
  customer: {
    id: string;
    // Add other relevant customer fields
  } | null;
  courier: {
    id: string;
    status: string;
    user: {
      name: string;
      email: string;
    };
    // Add other relevant courier fields
  } | null;
};

// GET /api/orders
export async function GET(request: NextRequest) {
  try {
    // Token doğrulama
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz erişim: Token bulunamadı' }, { status: 401 });
    }
    
    // JWT token içindeki bilgileri al
    const decodedToken = await verifyJwtToken(token);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Yetkisiz erişim: Geçersiz token' }, { status: 401 });
    }

    // URL'den sorgu parametrelerini al
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || '';
    
    // Sayfalama için hesaplamalar
    const skip = (page - 1) * limit;
    
    // Filtreleme için arama koşulları
    const where: any = {};
    
    // Durum filtreleme
    if (status && status !== 'all') {
      where.status = status;
    }
    
    // Arama filtresi
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { business: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    
    // Siparişleri getir
    const orders = await prisma.order.findMany({
      skip,
      take: limit,
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        business: {
          select: {
            id: true,
            name: true,
          }
        },
        courier: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Toplam sipariş sayısını hesapla
    const totalOrders = await prisma.order.count({ where });
    
    // Toplam sayfa sayısını hesapla
    const totalPages = Math.ceil(totalOrders / limit);
    
    return NextResponse.json({
      orders,
      pagination: {
        total: totalOrders,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Siparişler getirilirken hata:', error);
    return NextResponse.json({ 
      error: 'Siparişler getirilirken bir hata oluştu', 
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// POST /api/orders
export async function POST(request: NextRequest) {
  try {
    // Token doğrulama
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz erişim: Token bulunamadı' }, { status: 401 });
    }
    
    // JWT token içindeki bilgileri al
    const decodedToken = await verifyJwtToken(token);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Yetkisiz erişim: Geçersiz token' }, { status: 401 });
    }
    
    // Sadece işletme ve admin kullanıcıları sipariş oluşturabilir
    if (decodedToken.role !== 'ADMIN' && decodedToken.role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Yetkisiz erişim: Sipariş oluşturmak için yetkiniz yok' }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Şimdilik test amaçlı başarılı yanıt
    return NextResponse.json({ success: true, message: 'Sipariş başarıyla oluşturuldu' }, { status: 201 });
    
    /* Gerçek uygulamada yeni sipariş oluşturma kodu burada olur
    
    // Yeni sipariş oluştur
    const newOrder = await prisma.order.create({
      data: {
        ...body,
        status: 'PENDING',
        businessId: decodedToken.role === 'BUSINESS' ? decodedToken.businessId : body.businessId,
      }
    });
    
    return NextResponse.json(newOrder, { status: 201 });
    */
  } catch (error) {
    console.error('Sipariş oluşturma hatası:', error);
    return NextResponse.json({ 
      error: 'Sipariş oluşturulurken bir hata oluştu', 
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 