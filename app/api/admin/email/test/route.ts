import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/app/lib/admin/permissions';
import { decrypt } from '@/lib/encryption';
import nodemailer from 'nodemailer';

/**
 * POST /api/admin/email/test - Test e-postası gönderir
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
    
    const body = await request.json();
    const { to, subject, text } = body;
    
    // Temel doğrulama
    if (!to || !subject) {
      return NextResponse.json(
        { error: 'Alıcı e-posta adresi ve konu gereklidir' },
        { status: 400 }
      );
    }
    
    // SMTP ayarlarını getir
    const smtpSettings = await getSmtpSettingsFromDb();
    
    // SMTP ayarlarını kontrol et
    if (!smtpSettings.host || !smtpSettings.port || !smtpSettings.from || 
        !smtpSettings.auth.user || !smtpSettings.auth.pass) {
      return NextResponse.json(
        { error: 'SMTP ayarları eksik. Lütfen önce e-posta ayarlarını tamamlayın.' },
        { status: 400 }
      );
    }
    
    // Transporter oluştur
    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.secure,
      auth: {
        user: smtpSettings.auth.user,
        pass: smtpSettings.auth.pass
      }
    });
    
    // Test e-postası gönder
    const mailOptions = {
      from: smtpSettings.from,
      to,
      subject,
      text,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
               <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">${subject}</h2>
               <p style="line-height: 1.6;">${text}</p>
               <p style="margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
                 Bu e-posta, SepetTakip platformu SMTP ayarlarını test etmek için gönderilmiştir.
               </p>
             </div>`,
      replyTo: smtpSettings.replyTo || undefined
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    // Etkinlik günlüğüne ekle
    await prisma.activityLog.create({
      data: {
        action: 'SEND_TEST_EMAIL',
        description: `${session.user.name} tarafından test e-postası gönderildi: ${to}`,
        userId: session.user.id,
        adminId: session.user.id,
        metadata: { 
          recipient: to,
          messageId: info.messageId,
          timestamp: new Date().toISOString()
        },
        category: 'SYSTEM'
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Test e-postası başarıyla gönderildi',
      info: {
        messageId: info.messageId,
        recipient: to
      }
    });
  } catch (error) {
    console.error('Test e-postası gönderme hatası:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

/**
 * Veri tabanından SMTP ayarlarını alır
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
        value = '';
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
      if (value === 'true') {
        acc[settingKey] = true;
      } else if (value === 'false') {
        acc[settingKey] = false;
      } else if (!isNaN(Number(value)) && settingKey === 'port') {
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