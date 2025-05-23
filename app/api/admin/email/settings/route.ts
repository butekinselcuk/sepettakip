import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/app/lib/admin/permissions';
import { encrypt, decrypt } from '@/app/lib/encryption';

/**
 * GET /api/admin/email/settings - E-posta ayarlarını getirir
 */
export async function GET(request: NextRequest) {
  try {
    // Yetki kontrolü
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }
    
    // İzin kontrolü
    const hasAccess = await hasPermission('settings:view', session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }
    
    // SMTP ayarlarını getir
    const smtpSettings = await getSmtpSettingsFromDb();
    
    return NextResponse.json({ 
      settings: smtpSettings,
      templates: [] // Şimdilik boş, ileride şablonlar eklenecek
    });
  } catch (error) {
    console.error('E-posta ayarları getirme hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/email/settings - E-posta ayarlarını günceller
 */
export async function PATCH(request: NextRequest) {
  try {
    // Yetki kontrolü
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }
    
    // İzin kontrolü
    const hasAccess = await hasPermission('settings:edit', session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }
    
    const body = await request.json();
    const { settings } = body;
    
    if (!settings) {
      return NextResponse.json(
        { error: 'Geçersiz istek formatı. settings objesi gerekli.' },
        { status: 400 }
      );
    }
    
    // SMTP ayarlarını güncelle
    await updateSmtpSettingsInDb(settings, session.user.id);
    
    // Etkinlik günlüğüne ekle
    await prisma.activityLog.create({
      data: {
        action: 'UPDATE_EMAIL_SETTINGS',
        description: `${session.user.name} tarafından e-posta ayarları güncellendi`,
        userId: session.user.id,
        adminId: session.user.id,
        metadata: { host: settings.host },
        category: 'SYSTEM'
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'E-posta ayarları başarıyla güncellendi'
    });
  } catch (error) {
    console.error('E-posta ayarları güncelleme hatası:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

/**
 * Veri tabanından SMTP ayarlarını alır ve yapılandırılmış bir nesne olarak döndürür
 */
async function getSmtpSettingsFromDb() {
  // Sistemden SMTP ayarlarını getir
  const settingsMap = await prisma.systemSettings.findMany({
    where: {
      key: {
        startsWith: 'email.'
      }
    }
  });
  
  if (settingsMap.length === 0) {
    // Henüz ayar yoksa varsayılan boş yapılandırmayı döndür
    return {
      host: '',
      port: 587,
      secure: false,
      auth: {
        user: '',
        pass: ''
      },
      from: '',
      replyTo: ''
    };
  }
  
  // Ayarları nesneye dönüştür
  const settings = settingsMap.reduce((acc, setting) => {
    const keyParts = setting.key.split('.');
    const settingKey = keyParts[keyParts.length - 1];
    
    // Parola gibi hassas bilgileri decrypt et
    let value = setting.value;
    if (setting.isEncrypted) {
      try {
        value = decrypt(value);
      } catch (error) {
        console.error('Şifre çözme hatası:', error);
        value = ''; // Şifre çözülemezse boş döndür
      }
    }
    
    // Alt kategorileri nesne olarak oluştur (örn: auth.user, auth.pass)
    if (keyParts.length > 2) {
      const category = keyParts[1];
      if (!acc[category]) {
        acc[category] = {};
      }
      acc[category][settingKey] = value;
    } else {
      // Boolean değerleri dönüştür
      if (value === 'true') {
        acc[settingKey] = true;
      } else if (value === 'false') {
        acc[settingKey] = false;
      } else if (!isNaN(Number(value)) && settingKey === 'port') {
        // Port numarasını sayıya dönüştür
        acc[settingKey] = parseInt(value);
      } else {
        acc[settingKey] = value;
      }
    }
    
    return acc;
  }, {} as any);
  
  return {
    host: settings.host || '',
    port: settings.port || 587,
    secure: settings.secure || false,
    auth: {
      user: settings.auth?.user || '',
      pass: settings.auth?.pass || ''
    },
    from: settings.from || '',
    replyTo: settings.replyTo || ''
  };
}

/**
 * SMTP ayarlarını veri tabanına kaydeder
 */
async function updateSmtpSettingsInDb(settings: any, updatedBy: string) {
  // Ana ayarlar
  await Promise.all([
    upsertSetting('email.host', settings.host, 'string', false, updatedBy),
    upsertSetting('email.port', settings.port.toString(), 'number', false, updatedBy),
    upsertSetting('email.secure', settings.secure.toString(), 'boolean', false, updatedBy),
    upsertSetting('email.from', settings.from, 'string', false, updatedBy),
  ]);
  
  // Opsiyonel ayarlar
  if (settings.replyTo !== undefined) {
    await upsertSetting('email.replyTo', settings.replyTo, 'string', false, updatedBy);
  }
  
  // Kimlik doğrulama bilgileri (şifrelenmiş)
  if (settings.auth && settings.auth.user) {
    await upsertSetting('email.auth.user', settings.auth.user, 'string', false, updatedBy);
  }
  
  if (settings.auth && settings.auth.pass) {
    const encryptedPass = encrypt(settings.auth.pass);
    await upsertSetting('email.auth.pass', encryptedPass, 'string', true, updatedBy);
  }
}

/**
 * Bir ayarı oluşturur veya günceller
 */
async function upsertSetting(
  key: string,
  value: string,
  dataType: string,
  isEncrypted: boolean,
  updatedBy: string
) {
  return prisma.systemSettings.upsert({
    where: { key },
    update: {
      value,
      lastUpdated: new Date(),
      updatedBy
    },
    create: {
      key,
      value,
      category: 'email',
      description: `E-posta ayarı: ${key.split('.').pop()}`,
      dataType,
      isEncrypted,
      lastUpdated: new Date(),
      updatedBy
    }
  });
} 