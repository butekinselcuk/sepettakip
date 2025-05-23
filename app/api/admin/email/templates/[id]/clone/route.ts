import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/app/lib/admin/permissions';

/**
 * POST /api/admin/email/templates/[id]/clone - E-posta şablonunu klonlar
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
    const hasAccess = await hasPermission('email:edit');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }
    
    // Klonlanacak şablonu getir
    const sourceTemplate = await prisma.emailTemplate.findUnique({
      where: { id }
    });
    
    if (!sourceTemplate) {
      return NextResponse.json({ error: 'Şablon bulunamadı' }, { status: 404 });
    }
    
    // Yeni şablonun adını oluştur (Kopya eki)
    const newName = `${sourceTemplate.name} (Kopya)`;
    
    // Şablonu klonla
    const clonedTemplate = await prisma.emailTemplate.create({
      data: {
        name: newName,
        subject: sourceTemplate.subject,
        body: sourceTemplate.body,
        category: sourceTemplate.category,
        description: sourceTemplate.description,
        variables: sourceTemplate.variables,
        isActive: true, // Klon aktif olarak başlar
        createdBy: session.user.id
      }
    });
    
    // Etkinlik günlüğüne ekle
    await prisma.activityLog.create({
      data: {
        action: 'CLONE_EMAIL_TEMPLATE',
        description: `${session.user.name} tarafından "${sourceTemplate.name}" e-posta şablonu klonlandı`,
        userId: session.user.id,
        adminId: session.user.id,
        metadata: { 
          sourceTemplateId: id, 
          newTemplateId: clonedTemplate.id,
          category: sourceTemplate.category 
        },
        category: 'EMAIL'
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'E-posta şablonu başarıyla klonlandı',
      template: {
        id: clonedTemplate.id,
        name: clonedTemplate.name,
        subject: clonedTemplate.subject,
        category: clonedTemplate.category,
        description: clonedTemplate.description,
        isActive: clonedTemplate.isActive,
        createdAt: clonedTemplate.createdAt,
        updatedAt: clonedTemplate.updatedAt,
        variables: clonedTemplate.variables,
        usageCount: 0
      }
    });
  } catch (error) {
    console.error('Şablon klonlama hatası:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 