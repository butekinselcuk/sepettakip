import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { cache } from '@/lib/cache';
import { CacheKeys } from '@/lib/cacheKeys';

// Çalışma saatleri doğrulama şeması
const businessHoursSchema = z.array(
  z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Geçerli bir saat formatı girin (HH:MM)'),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Geçerli bir saat formatı girin (HH:MM)'),
    isOpen: z.boolean().default(true),
  })
);

// İşletmenin çalışma saatlerini almak için varsayılan değerler oluştur
function getDefaultHours() {
  const defaultHours = [];
  for (let i = 0; i < 7; i++) {
    defaultHours.push({
      dayOfWeek: i,
      startTime: "09:00",
      endTime: "18:00",
      isOpen: i < 5, // Hafta içi açık, hafta sonu kapalı
    });
  }
  return defaultHours;
}

// GET /api/business/settings/hours - İşletme çalışma saatlerini getirir
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
    const cacheKey = `${CacheKeys.BUSINESS_SETTINGS(decoded.userId)}:hours`;
    const cachedHours = await cache.get(cacheKey);
    
    if (cachedHours) {
      return NextResponse.json({ hours: cachedHours });
    }

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

    // Çalışma saatlerini getir
    const hours = await prisma.schedule.findMany({
      where: {
        // BusinessHours modeli olmadığı için ilişki kurmak zor
        // Burada işletme ID'sini çalışma saatlerine bağlayan bir field eklememiz gerekebilir
        OR: [
          {
            reports: {
              some: {
                userId: decoded.userId,
              },
            },
          },
          // Eğer Schedule tablosunda işletme ID'si eklenerek ilişki kurulursa
          // {
          //   businessId: business.id,
          // }
        ],
      },
      orderBy: {
        dayOfWeek: 'asc',
      },
    });

    // Eğer kayıtlı saat yoksa varsayılan değerleri döndür
    let businessHours = hours.length > 0 
      ? hours.map(h => ({
          dayOfWeek: h.dayOfWeek,
          startTime: h.startTime,
          endTime: h.endTime,
          isOpen: true, // TODO: Gerçek isOpen durumunu saklamak için özel bir alan eklenebilir
        }))
      : getDefaultHours();

    // Cache'e kaydet
    await cache.set(cacheKey, businessHours, 60 * 60); // 1 saat cache

    return NextResponse.json({ hours: businessHours });
  } catch (error) {
    logger.error('Error fetching business hours:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PUT /api/business/settings/hours - İşletme çalışma saatlerini günceller
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

    // Request body'den çalışma saatlerini al
    const body = await request.json();
    
    // Veri doğrulama
    const validation = businessHoursSchema.safeParse(body.hours);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const hoursData = validation.data;

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

    // Mevcut çalışma saatlerini sil ve yenilerini oluştur
    // NOT: Bu işlemi daha verimli hale getirmek için güncelleme yapılabilir
    // Şu anda Schedule tablosunda BusinessId olmadığı için tam uygulama yapmak zor
    // İdealde aşağıdaki gibi bir işlem yapılmalı:
    
    // await prisma.businessHour.deleteMany({
    //   where: {
    //     businessId: business.id,
    //   },
    // });
    
    // const createdHours = await prisma.$transaction(
    //   hoursData.map(hour => 
    //     prisma.businessHour.create({
    //       data: {
    //         ...hour,
    //         businessId: business.id,
    //       },
    //     })
    //   )
    // );

    // Şimdilik basit bir yaklaşım:
    // İşletme açılış ve kapanış saatlerini güncelle
    const updatedBusiness = await prisma.business.update({
      where: { id: business.id },
      data: {
        // Pazartesi (0) çalışma saatini ana saat olarak al
        openingTime: hoursData.find(h => h.dayOfWeek === 0)?.startTime || "09:00",
        closingTime: hoursData.find(h => h.dayOfWeek === 0)?.endTime || "18:00",
      },
    });

    // Cache'i temizle
    const cacheKey = `${CacheKeys.BUSINESS_SETTINGS(decoded.userId)}:hours`;
    await cache.del(cacheKey);
    await cache.del(CacheKeys.BUSINESS_SETTINGS(decoded.userId));

    return NextResponse.json({ hours: hoursData, updated: true });
  } catch (error) {
    logger.error('Error updating business hours:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 