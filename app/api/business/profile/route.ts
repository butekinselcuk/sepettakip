import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { JWTPayload } from '@/lib/validations/auth';
import { z } from 'zod';

// İşletme profil şeması
const businessProfileSchema = z.object({
  name: z.string().min(2, "İşletme adı en az 2 karakter olmalıdır"),
  description: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  tax_id: z.string().optional().nullable(),
  bank_iban: z.string().optional().nullable(),
  openingTime: z.string().optional().nullable(),
  closingTime: z.string().optional().nullable(),
  deliveryRadius: z.number().min(0).optional().nullable(),
  deliveryFee: z.number().min(0).optional().nullable(),
  facebook: z.string().url().optional().nullable(),
  instagram: z.string().url().optional().nullable(),
  twitter: z.string().url().optional().nullable(),
  type: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  features: z.array(z.string()).optional().nullable()
});

// GET: İşletme profilini getir
export async function GET(request: NextRequest) {
  try {
    // Token doğrulama
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Yetkilendirme token\'ı eksik' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyJWT(token) as JWTPayload;

    if (!decoded || decoded.role !== 'BUSINESS') {
      return NextResponse.json(
        { error: 'Bu işlem için yetkiniz yok' },
        { status: 403 }
      );
    }

    const businessId = decoded.businessId;
    if (!businessId) {
      return NextResponse.json(
        { error: 'İşletme ID\'si bulunamadı' },
        { status: 400 }
      );
    }

    // İşletme profilini getir
    const businessProfile = await prisma.business.findUnique({
      where: {
        id: businessId,
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    if (!businessProfile) {
      return NextResponse.json(
        { error: 'İşletme profili bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(businessProfile);
  } catch (error) {
    console.error('İşletme profili getirme hatası:', error);
    return NextResponse.json(
      { error: 'İşletme profili alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT: İşletme profilini güncelle
export async function PUT(request: NextRequest) {
  try {
    // Token doğrulama
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Yetkilendirme token\'ı eksik' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyJWT(token) as JWTPayload;

    if (!decoded || decoded.role !== 'BUSINESS') {
      return NextResponse.json(
        { error: 'Bu işlem için yetkiniz yok' },
        { status: 403 }
      );
    }

    const businessId = decoded.businessId;
    if (!businessId) {
      return NextResponse.json(
        { error: 'İşletme ID\'si bulunamadı' },
        { status: 400 }
      );
    }

    // Request body'den veri al
    const body = await request.json();
    
    // Veriyi doğrula
    try {
      const validatedData = businessProfileSchema.parse(body);
      
      // İşletme profili güncelleme
      const updatedProfile = await prisma.business.update({
        where: {
          id: businessId
        },
        data: {
          ...validatedData
        }
      });

      return NextResponse.json(updatedProfile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Geçersiz veri formatı", details: error.format() },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('İşletme profili güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'İşletme profili güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PATCH: Belirli alanları güncelle (kısmi güncelleme)
export async function PATCH(request: NextRequest) {
  try {
    // Token doğrulama
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Yetkilendirme token\'ı eksik' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyJWT(token) as JWTPayload;

    if (!decoded || decoded.role !== 'BUSINESS') {
      return NextResponse.json(
        { error: 'Bu işlem için yetkiniz yok' },
        { status: 403 }
      );
    }

    const businessId = decoded.businessId;
    if (!businessId) {
      return NextResponse.json(
        { error: 'İşletme ID\'si bulunamadı' },
        { status: 400 }
      );
    }

    // URL parametresinden güncelleme türünü al
    const url = new URL(request.url);
    const updateType = url.searchParams.get('type');

    // Request body'den veri al
    const body = await request.json();

    // İşletmeyi bul
    const business = await prisma.business.findUnique({
      where: {
        id: businessId
      }
    });

    if (!business) {
      return NextResponse.json(
        { error: 'İşletme profili bulunamadı' },
        { status: 404 }
      );
    }

    // Güncelleme türüne göre işlem yap
    let updateData = {};
    
    switch (updateType) {
      case 'contact':
        // İletişim bilgileri güncelleme
        updateData = {
          phone: body.phone,
          email: body.email,
          website: body.website,
          address: body.address
        };
        break;
      
      case 'location':
        // Konum bilgileri güncelleme
        updateData = {
          latitude: body.latitude,
          longitude: body.longitude,
          deliveryRadius: body.deliveryRadius
        };
        break;
      
      case 'business-hours':
        // Çalışma saatleri güncelleme
        updateData = {
          openingTime: body.openingTime,
          closingTime: body.closingTime
        };
        break;
      
      case 'social-media':
        // Sosyal medya linkleri güncelleme
        updateData = {
          facebook: body.facebook,
          instagram: body.instagram,
          twitter: body.twitter
        };
        break;
      
      case 'images':
        // Logo ve kapak görseli güncelleme
        updateData = {
          logoUrl: body.logoUrl,
          coverUrl: body.coverUrl
        };
        break;
      
      default:
        return NextResponse.json(
          { error: 'Geçersiz güncelleme türü' },
          { status: 400 }
        );
    }

    // Veriyi güncelle
    const updatedProfile = await prisma.business.update({
      where: {
        id: businessId
      },
      data: updateData
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('İşletme profili güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'İşletme profili güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 