import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import logger from '@/lib/logger';
import prisma from '@/lib/prisma';
import { getRenderedEmailTemplate } from './templates';

interface EmailAttachment {
  filename: string;
  path: string;
  contentType?: string;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
  templateId?: string;
  templateVariables?: Record<string, any>;
}

// Email gönderme fonksiyonu
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // SMTP ayarlarını çevresel değişkenlerden al
    const transportOptions: SMTPTransport.Options = {
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
      secure: process.env.EMAIL_SERVER_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    };

    // Transporter oluştur
    const transporter = nodemailer.createTransport(transportOptions);

    // Email gönderici adresi
    const from = process.env.EMAIL_FROM || 'noreply@sepettakip.com';

    // Şablon kullanılıyorsa, şablonu getir ve render et
    let subject = options.subject;
    let html = options.html;
    let templateId = options.templateId;

    if (templateId && options.templateVariables) {
      const renderedTemplate = await getRenderedEmailTemplate(
        templateId,
        options.templateVariables
      );

      if (renderedTemplate) {
        subject = renderedTemplate.subject;
        html = renderedTemplate.body;
      } else {
        logger.warn(`E-posta şablonu bulunamadı: ${templateId}`, {
          module: 'email'
        });
      }
    }

    // Email gönderme seçenekleri
    const mailOptions = {
      from,
      to: Array.isArray(options.to) ? options.to.join(',') : options.to,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(',') : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(',') : options.bcc) : undefined,
      subject,
      html,
      text: options.text || html.replace(/<[^>]*>/g, ''), // HTML tags'leri kaldır
      attachments: options.attachments,
    };

    // Email gönder
    const info = await transporter.sendMail(mailOptions);
    
    // SentEmail tablosuna kaydet
    if (process.env.NODE_ENV !== 'test') {
      try {
        await saveSentEmail({
          templateId,
          recipient: mailOptions.to,
          subject,
          variables: JSON.stringify(options.templateVariables || {}),
          messageId: info.messageId,
          sentBy: 'system',
        });
      } catch (dbError) {
        logger.error('Email kaydı veritabanına eklenirken hata', dbError as Error, {
          module: 'email'
        });
        // Veritabanı hatası e-posta gönderimini etkilememeli
      }
    }
    
    return true;
  } catch (error) {
    // Hata logunu yapılandırılmış logger ile kaydedelim
    logger.error('Error sending email', error as Error, {
      module: 'email',
      context: {
        to: Array.isArray(options.to) ? options.to.join(',') : options.to,
        subject: options.subject
      }
    });
    return false;
  }
}

// Gönderilen e-postayı veritabanına kaydet
async function saveSentEmail(data: {
  templateId?: string;
  recipient: string;
  subject: string;
  variables: string;
  messageId?: string;
  sentBy: string;
  category?: string;
}) {
  try {
    await prisma.sentEmail.create({
      data: {
        templateId: data.templateId || '',
        recipient: data.recipient,
        subject: data.subject,
        variables: data.variables,
        messageId: data.messageId,
        sentBy: data.sentBy,
        category: data.category || 'SYSTEM',
        status: 'SENT'
      },
    });
    return true;
  } catch (error) {
    logger.error('Email kaydı oluşturma hatası', error as Error, {
      module: 'email'
    });
    return false;
  }
}

// Şablondan email gönderme
export async function sendTemplatedEmail(
  templateId: string, 
  to: string | string[], 
  variables: Record<string, any>,
  options?: Partial<Omit<EmailOptions, 'templateId' | 'templateVariables' | 'html' | 'subject'>>
): Promise<boolean> {
  try {
    // Şablonu kontrol et
    const renderedTemplate = await getRenderedEmailTemplate(templateId, variables);
    
    if (!renderedTemplate) {
      logger.error('Email şablonu bulunamadı', null, {
        module: 'email',
        context: { templateId }
      });
      return false;
    }
    
    // E-posta gönder
    return await sendEmail({
      to,
      subject: renderedTemplate.subject,
      html: renderedTemplate.body,
      templateId,
      templateVariables: variables,
      ...options
    });
    
  } catch (error) {
    logger.error('Error sending templated email', error as Error, {
      module: 'email',
      context: {
        templateId,
        to: Array.isArray(to) ? to.join(',') : to
      }
    });
    return false;
  }
} 