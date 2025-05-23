/**
 * Email Template Manager
 * 
 * Bu modül, veritabanından e-posta şablonlarını yönetir. Şablonlar kaydetme, düzenleme,
 * silme ve belirli bir şablonu alıp değişkenlerle doldurmak için fonksiyonlar içerir.
 */

import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

// Şablon kategorileri
export enum EmailTemplateCategory {
  NOTIFICATION = 'notification',
  MARKETING = 'marketing',
  TRANSACTIONAL = 'transactional',
  REPORT = 'report',
  SYSTEM = 'system'
}

// Veritabanından bir e-posta şablonu almak için
export async function getEmailTemplate(name: string) {
  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { name, isActive: true }
    });
    
    if (!template) {
      logger.warn(`E-posta şablonu bulunamadı: ${name}`, {
        module: 'emailTemplates'
      });
      return null;
    }
    
    return template;
  } catch (error) {
    logger.error('E-posta şablonu getirme hatası', error as Error, {
      module: 'emailTemplates',
      context: { templateName: name }
    });
    return null;
  }
}

// Veritabanından tüm e-posta şablonlarını almak için
export async function getAllEmailTemplates(category?: EmailTemplateCategory) {
  try {
    const where = category ? { category, isActive: true } : { isActive: true };
    
    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: { name: 'asc' }
    });
    
    return templates;
  } catch (error) {
    logger.error('E-posta şablonları getirme hatası', error as Error, {
      module: 'emailTemplates',
      context: { category }
    });
    return [];
  }
}

// Yeni bir e-posta şablonu oluşturmak için
export async function createEmailTemplate(data: {
  name: string;
  subject: string;
  body: string;
  category: string;
  description?: string;
  variables: string[];
  createdBy: string;
}) {
  try {
    // Şablon adının benzersiz olduğunu kontrol et
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { name: data.name }
    });
    
    if (existingTemplate) {
      throw new Error(`Bu isimde bir şablon zaten mevcut: ${data.name}`);
    }
    
    const template = await prisma.emailTemplate.create({
      data: {
        name: data.name,
        subject: data.subject,
        body: data.body,
        category: data.category,
        description: data.description || '',
        variables: data.variables as any, // JSON olarak kaydedilecek
        createdBy: data.createdBy,
        updatedBy: data.createdBy
      }
    });
    
    logger.info(`E-posta şablonu oluşturuldu: ${data.name}`, {
      module: 'emailTemplates',
      context: { 
        templateId: template.id,
        category: data.category
      }
    });
    
    return template;
  } catch (error) {
    logger.error('E-posta şablonu oluşturma hatası', error as Error, {
      module: 'emailTemplates',
      context: { templateName: data.name }
    });
    throw error;
  }
}

// Mevcut bir e-posta şablonunu güncellemek için
export async function updateEmailTemplate(
  name: string,
  data: {
    subject?: string;
    body?: string;
    category?: string;
    description?: string;
    variables?: string[];
    isActive?: boolean;
    updatedBy: string;
  }
) {
  try {
    const template = await prisma.emailTemplate.update({
      where: { name },
      data: {
        ...(data.subject && { subject: data.subject }),
        ...(data.body && { body: data.body }),
        ...(data.category && { category: data.category }),
        ...(data.description && { description: data.description }),
        ...(data.variables && { variables: data.variables as any }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedBy: data.updatedBy,
        updatedAt: new Date()
      }
    });
    
    logger.info(`E-posta şablonu güncellendi: ${name}`, {
      module: 'emailTemplates',
      context: { 
        templateId: template.id,
        updatedBy: data.updatedBy
      }
    });
    
    return template;
  } catch (error) {
    logger.error('E-posta şablonu güncelleme hatası', error as Error, {
      module: 'emailTemplates',
      context: { templateName: name }
    });
    throw error;
  }
}

// Bir e-posta şablonunu silmek için
export async function deleteEmailTemplate(name: string, deletedBy: string) {
  try {
    // Şablonun kullanılıp kullanılmadığını kontrol et
    const usageCount = await prisma.sentEmail.count({
      where: { 
        template: { name } 
      }
    });
    
    if (usageCount > 0) {
      // Şablon kullanıldıysa silme yerine deaktive et
      return await updateEmailTemplate(name, {
        isActive: false,
        updatedBy: deletedBy
      });
    }
    
    // Şablon kullanılmadıysa tamamen sil
    const template = await prisma.emailTemplate.delete({
      where: { name }
    });
    
    logger.info(`E-posta şablonu silindi: ${name}`, {
      module: 'emailTemplates',
      context: { 
        templateId: template.id,
        deletedBy
      }
    });
    
    return template;
  } catch (error) {
    logger.error('E-posta şablonu silme hatası', error as Error, {
      module: 'emailTemplates',
      context: { templateName: name }
    });
    throw error;
  }
}

// Bir şablonu değişkenlerle doldurmak için
export function renderEmailTemplate(template: {
  subject: string;
  body: string;
}, variables: Record<string, any>): { subject: string; body: string } {
  try {
    let subject = template.subject;
    let body = template.body;
    
    // Değişkenleri değiştir
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      subject = subject.replace(placeholder, String(value));
      body = body.replace(placeholder, String(value));
    });
    
    return { subject, body };
  } catch (error) {
    logger.error('E-posta şablonu render hatası', error as Error, {
      module: 'emailTemplates'
    });
    
    // Hata durumunda orijinal şablonu dön
    return {
      subject: template.subject,
      body: template.body
    };
  }
}

// Veritabanından şablonu alıp değişkenlerle doldur
export async function getRenderedEmailTemplate(
  templateName: string,
  variables: Record<string, any>
): Promise<{ subject: string; body: string } | null> {
  try {
    const template = await getEmailTemplate(templateName);
    
    if (!template) {
      return null;
    }
    
    return renderEmailTemplate(template, variables);
  } catch (error) {
    logger.error('Render edilmiş e-posta şablonu hatası', error as Error, {
      module: 'emailTemplates',
      context: { templateName }
    });
    return null;
  }
} 