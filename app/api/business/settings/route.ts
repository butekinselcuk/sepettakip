import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { cache } from '@/lib/cache';
import { CacheKeys } from '@/lib/cacheKeys';

// İşletme ayarları doğrulama şeması
const businessSettingsSchema = z.object({
  name: z.string().min(2, 'İşletme adı en az 2 karakter olmalıdır'),
  description: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url('Geçerli bir URL giriniz').optional().nullable(),
  email: z.string().email('Geçerli bir e-posta adresi giriniz').optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  coverUrl: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  zoneId: z.string().optional().nullable(),
  tax_id: z.string().optional().nullable(),
  bank_iban: z.string().optional().nullable(),
  openingTime: z.string().optional().nullable(),
  closingTime: z.string().optional().nullable(),
  deliveryRadius: z.number().optional().nullable(),
  deliveryFee: z.number().optional().nullable(),
  facebook: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  features: z.array(z.string()).optional().nullable(),
});

// GET /api/business/settings - İşletme ayarlarını getirir
export async function GET(request: NextRequest) {
  try {
    // JWT kontrolü
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || !decoded.userId || decoded.role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Cache kontrolü
    const cacheKey = CacheKeys.BUSINESS_SETTINGS(decoded.userId);
    const cachedSettings = await cache.get(cacheKey);
    
    if (cachedSettings) {
      return NextResponse.json({ settings: cachedSettings });
    }

    // İşletme bilgilerini getir
    const business = await prisma.business.findFirst({
      where: {
        userId: decoded.userId,
      },
      include: {
        zone: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Cache'e kaydet
    await cache.set(cacheKey, business, 60 * 5); // 5 dakika cache

    return NextResponse.json({ settings: business });
  } catch (error) {
    logger.error('Error fetching business settings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PUT /api/business/settings - İşletme ayarlarını günceller
export async function PUT(request: NextRequest) {
  try {
    // JWT kontrolü
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || !decoded.userId || decoded.role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Request body'den işletme bilgilerini al
    const body = await request.json();
    
    // Veri doğrulama
    const validation = businessSettingsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const settingsData = validation.data;

    // İşletmeyi bul
    const existingBusiness = await prisma.business.findFirst({
      where: {
        userId: decoded.userId,
      },
      select: { id: true },
    });

    if (!existingBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Prisma'nın beklediği formata dönüştür
    // Tip güvenliği için her bir alanı kontrol ederek güncellenecek verileri hazırlayalım
    const updateData: Record<string, any> = {
      name: settingsData.name,
    };
    
    // Nullable string fields
    if (settingsData.description !== undefined) updateData.description = settingsData.description;
    if (settingsData.address !== undefined) updateData.address = settingsData.address;
    if (settingsData.phone !== undefined) updateData.phone = settingsData.phone;
    if (settingsData.website !== undefined) updateData.website = settingsData.website;
    if (settingsData.email !== undefined) updateData.email = settingsData.email;
    if (settingsData.logoUrl !== undefined) updateData.logoUrl = settingsData.logoUrl;
    if (settingsData.coverUrl !== undefined) updateData.coverUrl = settingsData.coverUrl;
    if (settingsData.tax_id !== undefined) updateData.tax_id = settingsData.tax_id;
    if (settingsData.bank_iban !== undefined) updateData.bank_iban = settingsData.bank_iban;
    if (settingsData.openingTime !== undefined) updateData.openingTime = settingsData.openingTime;
    if (settingsData.closingTime !== undefined) updateData.closingTime = settingsData.closingTime;
    if (settingsData.facebook !== undefined) updateData.facebook = settingsData.facebook;
    if (settingsData.instagram !== undefined) updateData.instagram = settingsData.instagram;
    if (settingsData.twitter !== undefined) updateData.twitter = settingsData.twitter;
    if (settingsData.type !== undefined) updateData.type = settingsData.type;
    
    // Nullable number fields
    if (settingsData.latitude !== undefined) updateData.latitude = settingsData.latitude;
    if (settingsData.longitude !== undefined) updateData.longitude = settingsData.longitude;
    if (settingsData.deliveryRadius !== undefined) updateData.deliveryRadius = settingsData.deliveryRadius;
    if (settingsData.deliveryFee !== undefined) updateData.deliveryFee = settingsData.deliveryFee;
    
    // zoneId özel işleme (string | null)
    if (settingsData.zoneId !== undefined) {
      updateData.zoneId = settingsData.zoneId === null ? null : settingsData.zoneId;
    }
    
    // Array fields
    if (settingsData.tags !== undefined) updateData.tags = settingsData.tags;
    if (settingsData.features !== undefined) updateData.features = settingsData.features;

    // İşletme bilgilerini güncelle
    const updatedBusiness = await prisma.business.update({
      where: { id: existingBusiness.id },
      data: updateData as any, // Tip uyumsuzluklarını çözmek için 'as any' kullanıyoruz
      include: {
        zone: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    // Cache'i temizle
    const cacheKey = CacheKeys.BUSINESS_SETTINGS(decoded.userId);
    await cache.del(cacheKey);

    // İşletme bilgilerini cache'e kaydet
    await cache.set(cacheKey, updatedBusiness, 60 * 5); // 5 dakika cache

    return NextResponse.json({ settings: updatedBusiness });
  } catch (error) {
    logger.error('Error updating business settings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 