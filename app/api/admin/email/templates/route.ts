import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/app/lib/admin/permissions';

/**
 * GET /api/admin/email/templates - E-posta şablonlarını listeler
 */
export async function GET(request: NextRequest) {
  try {
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
    
    // Kategori ve arama filtresi için query parametrelerini al
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    
    // Filtreleri oluştur
    const where: any = {};
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Tüm şablonları getir
    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { updatedAt: 'desc' }
      ],
      select: {
        id: true,
        name: true,
        subject: true,
        category: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sentEmails: true
          }
        }
      }
    });
    
    // Kullanım sayısını ekle
    const templatesWithUsage = templates.map(template => ({
      id: template.id,
      name: template.name,
      subject: template.subject,
      category: template.category,
      description: template.description,
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      usageCount: template._count.sentEmails
    }));
    
    return NextResponse.json({ 
      templates: templatesWithUsage
    });
  } catch (error) {
    console.error('Şablonları getirme hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * POST /api/admin/email/templates - Yeni bir e-posta şablonu oluşturur
 */
export async function POST(request: NextRequest) {
  try {
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
    
    const body = await request.json();
    const { name, subject, category, description } = body;
    
    if (!name || !subject || !category) {
      return NextResponse.json(
        { error: 'Şablon adı, konu ve kategori alanları zorunludur' },
        { status: 400 }
      );
    }
    
    // Varsayılan HTML içeriği
    const defaultHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; }
    .header { border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <div class="header">
    <h2>${subject}</h2>
  </div>
  
  <p>Bu bir e-posta şablonudur. İçeriği buradan düzenleyebilirsiniz.</p>
  
  <div class="footer">
    <p>SepetTakip platformu tarafından gönderilmiştir.</p>
  </div>
</body>
</html>`;
    
    // Şablonu oluştur
    const template = await prisma.emailTemplate.create({
      data: {
        name,
        subject,
        body: defaultHtml,
        category,
        description: description || null,
        isActive: true,
        variables: [],
        createdBy: session.user.id
      }
    });
    
    // Etkinlik günlüğüne ekle
    await prisma.activityLog.create({
      data: {
        action: 'CREATE_EMAIL_TEMPLATE',
        description: `${session.user.name} tarafından "${name}" e-posta şablonu oluşturuldu`,
        userId: session.user.id,
        adminId: session.user.id,
        metadata: { templateId: template.id, category },
        category: 'EMAIL'
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'E-posta şablonu başarıyla oluşturuldu',
      template: {
        id: template.id,
        name: template.name,
        subject: template.subject,
        category: template.category,
        description: template.description,
        isActive: template.isActive,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        variables: template.variables,
        usageCount: 0
      }
    });
  } catch (error) {
    console.error('Şablon oluşturma hatası:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 