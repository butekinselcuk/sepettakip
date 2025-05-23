import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { cache } from '@/lib/cache';
import { CacheKeys } from '@/lib/cacheKeys';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// POST /api/business/settings/media - İşletme logo veya kapak fotoğrafı yükler
export async function POST(request: NextRequest) {
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

    // Form verilerini al
    const formData = await request.formData();
    const mediaType = formData.get('type') as string; // 'logo' veya 'cover'
    const file = formData.get('file') as File;
    
    if (!mediaType || (mediaType !== 'logo' && mediaType !== 'cover')) {
      return NextResponse.json(
        { error: 'Invalid media type. Must be "logo" or "cover"' },
        { status: 400 }
      );
    }
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    // Dosya türünü kontrol et
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WEBP and GIF images are allowed' },
        { status: 400 }
      );
    }
    
    // Dosya boyutunu kontrol et (5MB'tan küçük olmalı)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
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

    // Dosyayı kaydet
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${mediaType}_${business.id}_${uuidv4()}.${fileExt}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'business');
    const filePath = path.join(uploadDir, fileName);
    
    try {
      await writeFile(filePath, buffer);
    } catch (error) {
      logger.error('Error saving file:', error);
      return NextResponse.json(
        { error: 'Failed to save file' },
        { status: 500 }
      );
    }
    
    // Dosya URL'ini hazırla
    const fileUrl = `/uploads/business/${fileName}`;
    
    // İşletme bilgilerini güncelle
    const updateData: Record<string, any> = {};
    if (mediaType === 'logo') {
      updateData.logoUrl = fileUrl;
    } else {
      updateData.coverUrl = fileUrl;
    }
    
    const updatedBusiness = await prisma.business.update({
      where: { id: business.id },
      data: updateData,
    });

    // Cache'i temizle
    await cache.del(CacheKeys.BUSINESS_SETTINGS(decoded.userId));

    return NextResponse.json({
      success: true,
      url: fileUrl,
      type: mediaType,
    });
  } catch (error) {
    logger.error('Error uploading media:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE /api/business/settings/media - İşletme logo veya kapak fotoğrafını siler
export async function DELETE(request: NextRequest) {
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

    // URL parametrelerinden silme tipini al
    const url = new URL(request.url);
    const mediaType = url.searchParams.get('type');
    
    if (!mediaType || (mediaType !== 'logo' && mediaType !== 'cover')) {
      return NextResponse.json(
        { error: 'Invalid media type. Must be "logo" or "cover"' },
        { status: 400 }
      );
    }

    // İşletmeyi bul
    const business = await prisma.business.findFirst({
      where: {
        userId: decoded.userId,
      },
      select: { 
        id: true,
        logoUrl: true,
        coverUrl: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // İşletme bilgilerini güncelle
    const updateData: Record<string, any> = {};
    if (mediaType === 'logo') {
      updateData.logoUrl = null;
    } else {
      updateData.coverUrl = null;
    }
    
    // NOT: Dosya sisteminden silme işlemi burada yapılmıyor
    // Bu işlem için bir background job veya admin tarafından periyodik olarak silinebilir
    
    const updatedBusiness = await prisma.business.update({
      where: { id: business.id },
      data: updateData,
    });

    // Cache'i temizle
    await cache.del(CacheKeys.BUSINESS_SETTINGS(decoded.userId));

    return NextResponse.json({
      success: true,
      type: mediaType,
    });
  } catch (error) {
    logger.error('Error deleting media:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 