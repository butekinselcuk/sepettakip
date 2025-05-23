import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { verifyJwtToken, withAuth } from '@/lib/auth';
import { hasPermission } from '@/app/lib/admin/permissions';

// Define SystemSettings type to match the Prisma schema
type SystemSettingsType = {
  id?: string;
  maintenance: boolean;
  maintenanceMessage: string;
  theme: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  lastUpdated?: Date;
  updatedBy?: string;
};

/**
 * GET /api/admin/settings - Retrieves system settings
 */
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    // Admin ID ile ayarları getir
    const userId = user.userId;
    
    // Admin kullanıcısını kontrol et
    const admin = await prisma.admin.findFirst({
      where: { userId },
      include: {
        user: {
          include: {
            settings: true
          }
        }
      }
    });
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin bulunamadı' },
        { status: 404 }
      );
    }
    
    // Sistem genelindeki ayarları al
    let systemSettings: SystemSettingsType | null = null;
        try {
      // SystemSettings modelini sorgula
      systemSettings = await prisma.systemSettings.findFirst();
      
      // Eğer ayarlar yoksa, oluştur
      if (!systemSettings) {
        systemSettings = await prisma.systemSettings.create({
          data: {
            maintenance: false,
            maintenanceMessage: '',
            theme: 'light',
            language: 'tr',
            dateFormat: 'DD.MM.YYYY',
            timeFormat: '24h'
          }
        });
          }
        } catch (error) {
      console.warn('SystemSettings modeli bulunamadı veya erişilemedi:', error);
      // Varsayılan değerlerle devam et
      systemSettings = {
        maintenance: false,
        maintenanceMessage: '',
        theme: 'light',
        language: 'tr',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h'
      };
    }
    
    return NextResponse.json({
      success: true,
      userSettings: admin.user.settings || {},
      systemSettings: systemSettings
    });
  } catch (error) {
    console.error('Admin settings API error:', error);
    return NextResponse.json(
      { error: 'Ayarlar alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}, ['ADMIN']);

/**
 * PUT /api/admin/settings - Updates system settings
 */
export const PUT = withAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { userSettings, systemSettings } = body;
    
    // Admin ID ile admin kullanıcısını bul
    const userId = user.userId;
    
    // Admin kullanıcısını kontrol et
    const admin = await prisma.admin.findFirst({
      where: { userId },
      include: {
        user: true
      }
    });
            
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin bulunamadı' },
        { status: 404 }
      );
            }
            
    // İşlemleri transaction içinde yap
    await prisma.$transaction(async (tx) => {
      // Kullanıcı ayarlarını güncelle
      if (userSettings) {
        const existingSettings = await tx.userSettings.findUnique({
          where: { userId }
        });
        
        if (existingSettings) {
          await tx.userSettings.update({
            where: { userId },
            data: userSettings
          });
        } else {
          await tx.userSettings.create({
            data: {
              ...userSettings,
              userId
            }
          });
        }
      }
      
      // Sistem ayarlarını güncelle
      if (systemSettings) {
        try {
          const existingSystemSettings = await tx.systemSettings.findFirst();
          
          if (existingSystemSettings) {
            await tx.systemSettings.update({
              where: { id: existingSystemSettings.id },
              data: systemSettings
            });
          } else {
            await tx.systemSettings.create({
              data: systemSettings
            });
          }
        } catch (error) {
          console.warn('SystemSettings modelinde güncelleme yapılamadı:', error);
    }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Ayarlar başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Admin settings update error:', error);
    return NextResponse.json(
      { error: 'Ayarlar güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}, ['ADMIN']);

/**
 * POST /api/admin/settings - Yeni sistem ayarı ekler
 */
export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    
    // Yeni sistem ayarı oluştur/güncelle
    try {
      const existingSystemSettings = await prisma.systemSettings.findFirst();
    
      if (existingSystemSettings) {
        await prisma.systemSettings.update({
          where: { id: existingSystemSettings.id },
      data: {
            ...body,
        lastUpdated: new Date(),
            updatedBy: user.email || 'system'
      }
    });
      } else {
        await prisma.systemSettings.create({
        data: {
            ...body,
            lastUpdated: new Date(),
            updatedBy: user.email || 'system'
        }
      });
    }
    
    return NextResponse.json({
      success: true,
        message: 'Sistem ayarları başarıyla güncellendi'
      });
    } catch (error) {
      console.error('Sistem ayarları oluşturma/güncelleme hatası:', error);
      return NextResponse.json(
        { error: 'Sistem ayarları güncellenirken bir hata oluştu' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}, ['ADMIN']); 