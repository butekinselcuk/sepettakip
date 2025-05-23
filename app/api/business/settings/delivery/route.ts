import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { cache } from '@/lib/cache';
import { CacheKeys } from '@/lib/cacheKeys';

// Teslimat ayarları doğrulama şeması
const deliverySettingsSchema = z.object({
  deliveryRadius: z.number().min(0.1, 'Teslimat mesafesi 0.1 km\'den büyük olmalıdır').max(30, 'Teslimat mesafesi maksimum 30 km olabilir'),
  deliveryFee: z.number().min(0, 'Teslimat ücreti negatif olamaz'),
  minimumOrderAmount: z.number().min(0, 'Minimum sipariş tutarı negatif olamaz'),
  freeDeliveryThreshold: z.number().min(0, 'Ücretsiz teslimat eşiği negatif olamaz').optional(),
  estimatedDeliveryTime: z.number().min(5, 'Tahmini teslimat süresi en az 5 dakika olmalıdır').max(120, 'Tahmini teslimat süresi maksimum 120 dakika olabilir').optional(),
  deliveryNotes: z.string().max(500, 'Teslimat notları en fazla 500 karakter olabilir').optional(),
  deliveryOptions: z.array(z.string()).optional(), // Teslimat seçenekleri: ["STANDARD", "EXPRESS", "SCHEDULED"]
});

// GET /api/business/settings/delivery - İşletme teslimat ayarlarını getirir
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
    const cacheKey = `${CacheKeys.BUSINESS_SETTINGS(decoded.userId)}:delivery`;
    const cachedSettings = await cache.get(cacheKey);
    
    if (cachedSettings) {
      return NextResponse.json({ deliverySettings: cachedSettings });
    }

    // İşletmeyi bul
    const business = await prisma.business.findFirst({
      where: {
        userId: decoded.userId,
      },
      select: { 
        id: true,
        deliveryRadius: true,
        deliveryFee: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Teslimat ayarlarını getir
    // NOT: Şu anda sistemde minimumOrderAmount ve freeDeliveryThreshold alanları yok
    // İleri bir aşamada bu alanlar prisma şemasına eklenebilir
    const deliverySettings = {
      deliveryRadius: business.deliveryRadius || 5, // varsayılan 5km
      deliveryFee: business.deliveryFee || 0, // varsayılan ücretsiz
      minimumOrderAmount: 0, // varsayılan 0 TL
      freeDeliveryThreshold: 100, // varsayılan 100 TL
      estimatedDeliveryTime: 30, // varsayılan 30 dakika
      deliveryNotes: "",
      deliveryOptions: ["STANDARD"],
    };

    // Cache'e kaydet
    await cache.set(cacheKey, deliverySettings, 60 * 30); // 30 dakika cache

    return NextResponse.json({ deliverySettings });
  } catch (error) {
    logger.error('Error fetching delivery settings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PUT /api/business/settings/delivery - İşletme teslimat ayarlarını günceller
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

    // Request body'den teslimat ayarlarını al
    const body = await request.json();
    
    // Veri doğrulama
    const validation = deliverySettingsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const deliveryData = validation.data;

    // İşletmeyi bul
    const business = await prisma.business.findFirst({
      where: {
        userId: decoded.userId,
      },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // İşletme teslimat ayarlarını güncelle
    const updatedBusiness = await prisma.business.update({
      where: { id: business.id },
      data: {
        deliveryRadius: deliveryData.deliveryRadius,
        deliveryFee: deliveryData.deliveryFee,
        // İleri bir aşamada diğer alanlar da prisma şemasına eklenebilir
        // minimumOrderAmount: deliveryData.minimumOrderAmount,
        // freeDeliveryThreshold: deliveryData.freeDeliveryThreshold,
        // estimatedDeliveryTime: deliveryData.estimatedDeliveryTime,
        // deliveryNotes: deliveryData.deliveryNotes,
        // deliveryOptions: deliveryData.deliveryOptions,
      },
    });

    // Tüm ayarları içeren yanıt hazırla (veritabanında olmayan alanları da dahil et)
    const fullDeliverySettings = {
      deliveryRadius: updatedBusiness.deliveryRadius,
      deliveryFee: updatedBusiness.deliveryFee,
      minimumOrderAmount: deliveryData.minimumOrderAmount,
      freeDeliveryThreshold: deliveryData.freeDeliveryThreshold,
      estimatedDeliveryTime: deliveryData.estimatedDeliveryTime,
      deliveryNotes: deliveryData.deliveryNotes,
      deliveryOptions: deliveryData.deliveryOptions,
    };

    // Cache'i temizle
    const cacheKey = `${CacheKeys.BUSINESS_SETTINGS(decoded.userId)}:delivery`;
    await cache.del(cacheKey);
    await cache.del(CacheKeys.BUSINESS_SETTINGS(decoded.userId));

    // Cache'e yeni veriyi kaydet
    await cache.set(cacheKey, fullDeliverySettings, 60 * 30); // 30 dakika cache

    return NextResponse.json({ deliverySettings: fullDeliverySettings });
  } catch (error) {
    logger.error('Error updating delivery settings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 