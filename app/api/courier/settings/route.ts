import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';

// GET - Kullanıcı ayarlarını al
export async function GET(request: Request) {
  try {
    // Token doğrulama
    const token = request.headers.get('Authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' },
        { status: 401 }
      );
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Geçersiz oturum. Lütfen tekrar giriş yapın.' },
        { status: 401 }
      );
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { settings: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı.' },
        { status: 404 }
      );
    }

    // Sadece kuryelerin erişimine izin ver
    if (user.role !== 'COURIER') {
      return NextResponse.json(
        { error: 'Bu işlem için yetkiniz bulunmamaktadır.' },
        { status: 403 }
      );
    }

    // Eğer ayarlar yoksa yeni oluştur
    if (!user.settings) {
      const newSettings = await prisma.userSettings.create({
        data: {
          userId: user.id,
          receiveNotifications: true,
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          newDeliveryAlert: true,
          deliveryStatusAlert: true,
          theme: 'light',
          language: 'tr'
        }
      });

      return NextResponse.json({ settings: newSettings });
    }

    return NextResponse.json({ settings: user.settings });
  } catch (error) {
    console.error('Ayarlar alınırken hata oluştu:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' },
      { status: 500 }
    );
  }
}

// PATCH - Kullanıcı ayarlarını güncelle
export async function PATCH(request: Request) {
  try {
    // Token doğrulama
    const token = request.headers.get('Authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' },
        { status: 401 }
      );
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Geçersiz oturum. Lütfen tekrar giriş yapın.' },
        { status: 401 }
      );
    }

    // Request body'den ayarları al
    const data = await request.json();
    
    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { settings: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı.' },
        { status: 404 }
      );
    }

    // Sadece kuryelerin erişimine izin ver
    if (user.role !== 'COURIER') {
      return NextResponse.json(
        { error: 'Bu işlem için yetkiniz bulunmamaktadır.' },
        { status: 403 }
      );
    }

    // Güncellenecek alanları belirle
    const updateData: Record<string, any> = {};
    
    // Bildirim ayarları
    if (data.receiveNotifications !== undefined) updateData.receiveNotifications = data.receiveNotifications;
    if (data.emailNotifications !== undefined) updateData.emailNotifications = data.emailNotifications;
    if (data.pushNotifications !== undefined) updateData.pushNotifications = data.pushNotifications;
    if (data.smsNotifications !== undefined) updateData.smsNotifications = data.smsNotifications;
    
    // Kurye-spesifik bildirim ayarları
    if (data.newDeliveryAlert !== undefined) updateData.newDeliveryAlert = data.newDeliveryAlert;
    if (data.deliveryStatusAlert !== undefined) updateData.deliveryStatusAlert = data.deliveryStatusAlert;
    
    // Sistem ayarları
    if (data.theme !== undefined) updateData.theme = data.theme;
    if (data.language !== undefined) updateData.language = data.language;

    // Ayarları güncelle veya oluştur
    let updatedSettings;

    if (user.settings) {
      // Mevcut ayarları güncelle
      updatedSettings = await prisma.userSettings.update({
        where: { userId: user.id },
        data: updateData
      });
    } else {
      // Yeni ayarlar oluştur
      updatedSettings = await prisma.userSettings.create({
        data: {
          userId: user.id,
          ...updateData,
          // Varsayılan değerleri ayarla (update data'da yoksa)
          receiveNotifications: updateData.receiveNotifications ?? true,
          emailNotifications: updateData.emailNotifications ?? true,
          pushNotifications: updateData.pushNotifications ?? true,
          smsNotifications: updateData.smsNotifications ?? false,
          newDeliveryAlert: updateData.newDeliveryAlert ?? true,
          deliveryStatusAlert: updateData.deliveryStatusAlert ?? true,
          theme: updateData.theme ?? 'light',
          language: updateData.language ?? 'tr'
        }
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Ayarlar başarıyla güncellendi',
      settings: updatedSettings 
    });
  } catch (error) {
    console.error('Ayarlar güncellenirken hata oluştu:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' },
      { status: 500 }
    );
  }
} 