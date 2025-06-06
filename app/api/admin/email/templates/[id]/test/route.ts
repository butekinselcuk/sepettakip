import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/app/lib/admin/permissions';
import { decrypt } from '@/lib/encryption';
import nodemailer from 'nodemailer';

/**
 * POST /api/admin/email/templates/[id]/test - Şablonu test e-postası olarak gönderir
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Yetki kontrolü
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }
    
    // İzin kontrolü
    const hasAccess = await hasPermission('email:send');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }
    
    const body = await request.json();
    const { to, variables = {} } = body;
    
    // Temel doğrulama
    if (!to) {
      return NextResponse.json(
        { error: 'Alıcı e-posta adresi gereklidir' },
        { status: 400 }
      );
    }
    
    // Şablon kontrolü
    const template = await prisma.emailTemplate.findUnique({
      where: { id }
    });
    
    if (!template) {
      return NextResponse.json({ error: 'Şablon bulunamadı' }, { status: 404 });
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
    
    // Değişkenleri işle
    const processedHtml = processTemplateVariables(template.body, variables);
    const processedSubject = processTemplateVariables(template.subject, variables);
    
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
      subject: processedSubject,
      html: processedHtml,
      replyTo: smtpSettings.replyTo || undefined
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    // Test e-postası gönderimini kaydet
    await prisma.sentEmail.create({
      data: {
        templateId: id,
        recipient: to,
        subject: processedSubject,
        variables: JSON.stringify(variables),
        messageId: info.messageId,
        sentBy: session.user.id,
        sentAt: new Date(),
        status: 'SENT',
        category: 'TEST'
      }
    });
    
    // Etkinlik günlüğüne ekle
    await prisma.activityLog.create({
      data: {
        action: 'SEND_TEST_EMAIL',
        description: `${session.user.name} tarafından "${template.name}" şablonu ile test e-postası gönderildi`,
        userId: session.user.id,
        adminId: session.user.id,
        metadata: { 
          templateId: id,
          recipient: to,
          messageId: info.messageId,
          timestamp: new Date().toISOString()
        },
        category: 'EMAIL'
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Test e-postası başarıyla gönderildi',
      info: {
        messageId: info.messageId,
        recipient: to,
        templateName: template.name
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

/**
 * Şablon içerisindeki değişkenleri işler
 */
function processTemplateVariables(content: string, variables: Record<string, string>): string {
  if (!content || !variables) return content;
  
  let processedContent = content;
  
  // Tüm değişkenleri dön ve içeriği değiştir
  Object.entries(variables).forEach(([key, value]) => {
    // Değişken adı zaten {{}} içeriyorsa olduğu gibi kullan,
    // değilse {{}} ekle
    const variableName = key.startsWith('{{') && key.endsWith('}}') ? 
      key : 
      `{{${key}}}`;
    
    // Global replace işlemi
    const regex = new RegExp(escapeRegExp(variableName), 'g');
    processedContent = processedContent.replace(regex, value || '');
  });
  
  return processedContent;
}

/**
 * Regex karakterlerini escape eder
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
} 