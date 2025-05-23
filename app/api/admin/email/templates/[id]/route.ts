import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/app/lib/admin/permissions';

/**
 * GET /api/admin/email/templates/[id] - Tek bir e-posta şablonunu getirir
 */
export async function GET(
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
    const hasAccess = await hasPermission('email:view');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }
    
    // Şablonu getir
    const template = await prisma.emailTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            sentEmails: true
          }
        }
      }
    });
    
    if (!template) {
      return NextResponse.json({ error: 'Şablon bulunamadı' }, { status: 404 });
    }
    
    return NextResponse.json({
      template: {
        ...template,
        usageCount: template._count.sentEmails
      }
    });
  } catch (error) {
    console.error('Şablon getirme hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/email/templates/[id] - Bir e-posta şablonunu günceller
 */
export async function PATCH(
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
    const hasAccess = await hasPermission('email:edit');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }
    
    // Mevcut şablonun varlığını kontrol et
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id }
    });
    
    if (!existingTemplate) {
      return NextResponse.json({ error: 'Şablon bulunamadı' }, { status: 404 });
    }
    
    const body = await request.json();
    const { name, subject, body: templateBody, category, description, isActive, variables } = body;
    
    if (!name || !subject) {
      return NextResponse.json(
        { error: 'Şablon adı ve konu alanları zorunludur' },
        { status: 400 }
      );
    }
    
    // Şablonu güncelle
    const updatedTemplate = await prisma.emailTemplate.update({
      where: { id },
      data: {
        name,
        subject,
        body: templateBody,
        category,
        description,
        isActive,
        variables,
        updatedAt: new Date(),
        updatedBy: session.user.id
      },
      include: {
        _count: {
          select: {
            sentEmails: true
          }
        }
      }
    });
    
    // Etkinlik günlüğüne ekle
    await prisma.activityLog.create({
      data: {
        action: 'UPDATE_EMAIL_TEMPLATE',
        description: `${session.user.name} tarafından "${name}" e-posta şablonu güncellendi`,
        userId: session.user.id,
        adminId: session.user.id,
        metadata: { templateId: id, category },
        category: 'EMAIL'
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'E-posta şablonu başarıyla güncellendi',
      template: {
        ...updatedTemplate,
        usageCount: updatedTemplate._count.sentEmails
      }
    });
  } catch (error) {
    console.error('Şablon güncelleme hatası:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/email/templates/[id] - Bir e-posta şablonunu siler
 */
export async function DELETE(
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
    const hasAccess = await hasPermission('email:delete');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }
    
    // Silme öncesi şablonu getir (kayıt tutmak için)
    const template = await prisma.emailTemplate.findUnique({
      where: { id },
      select: { name: true, category: true }
    });
    
    if (!template) {
      return NextResponse.json({ error: 'Şablon bulunamadı' }, { status: 404 });
    }
    
    // Kullanım durumunu kontrol et
    const usageCount = await prisma.sentEmail.count({
      where: { templateId: id }
    });
    
    if (usageCount > 0) {
      // Tam silme yerine pasifleştirme yap
      await prisma.emailTemplate.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
          updatedBy: session.user.id
        }
      });
    } else {
      // Hiç kullanılmamışsa tamamen sil
      await prisma.emailTemplate.delete({
        where: { id }
      });
    }
    
    // Etkinlik günlüğüne ekle
    await prisma.activityLog.create({
      data: {
        action: 'DELETE_EMAIL_TEMPLATE',
        description: `${session.user.name} tarafından "${template.name}" e-posta şablonu silindi`,
        userId: session.user.id,
        adminId: session.user.id,
        metadata: { templateId: id, category: template.category, wasUsed: usageCount > 0 },
        category: 'EMAIL'
      }
    });
    
    return NextResponse.json({
      success: true,
      message: usageCount > 0 
        ? 'Şablon kullanıldığı için pasif duruma alındı' 
        : 'E-posta şablonu başarıyla silindi',
      wasDeactivated: usageCount > 0
    });
  } catch (error) {
    console.error('Şablon silme hatası:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 