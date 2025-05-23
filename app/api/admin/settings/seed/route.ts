import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/app/lib/admin/permissions';

// Varsayılan sistem ayarları
const defaultSettings = [
  // Genel Ayarlar
  {
    key: 'site.title',
    value: 'SepetTakip',
    category: 'general',
    description: 'Site başlığı',
    dataType: 'string'
  },
  {
    key: 'site.description',
    value: 'Teslimat Yönetim Sistemi',
    category: 'general',
    description: 'Site açıklaması',
    dataType: 'string'
  },
  {
    key: 'site.theme',
    value: 'light',
    category: 'general',
    description: 'Varsayılan tema',
    dataType: 'select'
  },
  {
    key: 'site.language',
    value: 'tr',
    category: 'general',
    description: 'Varsayılan dil',
    dataType: 'string'
  },
  {
    key: 'site.logo',
    value: '/images/logo.svg',
    category: 'general',
    description: 'Site logosu',
    dataType: 'string'
  },
  
  // Geliştirici Ayarları
  {
    key: 'developer.debug_mode',
    value: 'false',
    category: 'developer',
    description: 'Hata ayıklama modu',
    dataType: 'boolean'
  },
  {
    key: 'developer.log_level',
    value: 'error',
    category: 'developer',
    description: 'Günlük kaydı seviyesi',
    dataType: 'select'
  },
  {
    key: 'developer.api_throttle',
    value: '60',
    category: 'developer',
    description: 'API istek limiti (dakikada)',
    dataType: 'number'
  },
  {
    key: 'developer.show_errors',
    value: 'false',
    category: 'developer',
    description: 'Hata detaylarını göster',
    dataType: 'boolean'
  },
  
  // Erişim Ayarları
  {
    key: 'access.registration_enabled',
    value: 'true',
    category: 'access',
    description: 'Yeni kullanıcı kaydı',
    dataType: 'boolean'
  },
  {
    key: 'access.login_enabled',
    value: 'true',
    category: 'access',
    description: 'Kullanıcı girişi',
    dataType: 'boolean'
  },
  {
    key: 'maintenance.enabled',
    value: 'false',
    category: 'access',
    description: 'Bakım modu durumu',
    dataType: 'boolean'
  },
  {
    key: 'maintenance.reason',
    value: 'Sistemde bakım çalışması yapılmaktadır.',
    category: 'access',
    description: 'Bakım modu açıklama metni',
    dataType: 'string'
  }
];

/**
 * POST /api/admin/settings/seed - Varsayılan sistem ayarlarını oluşturur
 */
export async function POST(request: NextRequest) {
  try {
    // Yetki kontrolü
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }
    
    // İzin kontrolü 
    const hasAccess = await hasPermission('settings:edit');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }
    
    // Mevcut ayarları kontrol et
    const existingSettings = await prisma.systemSettings.findMany();
    
    if (existingSettings.length > 0) {
      // Seed zorlanmadıysa hata döndür
      const { force } = await request.json();
      
      if (!force) {
        return NextResponse.json(
          { error: 'Sistem ayarları zaten mevcut. Varsayılan ayarları uygulamak için force=true parametresi gerekli.' },
          { status: 400 }
        );
      }
    }
    
    // Tüm ayarları ekle
    const createdSettings = await Promise.all(
      defaultSettings.map(async (setting) => {
        return prisma.systemSettings.upsert({
          where: { key: setting.key },
          update: {
            ...setting,
            lastUpdated: new Date(),
            updatedBy: session.user.id
          },
          create: {
            ...setting,
            lastUpdated: new Date(),
            updatedBy: session.user.id
          }
        });
      })
    );
    
    // Etkinlik günlüğüne ekle
    await prisma.activityLog.create({
      data: {
        action: 'SEED_SYSTEM_SETTINGS',
        description: `${session.user.name} tarafından varsayılan sistem ayarları oluşturuldu`,
        userId: session.user.id,
        adminId: session.user.id,
        metadata: { settingsCount: createdSettings.length },
        category: 'SYSTEM'
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `${createdSettings.length} varsayılan sistem ayarı başarıyla oluşturuldu.`,
      settings: createdSettings
    });
  } catch (error) {
    console.error('Varsayılan ayarları oluşturma hatası:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 