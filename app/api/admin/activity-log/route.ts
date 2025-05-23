import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/app/lib/admin/permissions';

/**
 * Etkinlik günlüğü kayıtlarını getir (belirli filtrelerle)
 * @route GET /api/admin/activity-log
 */
export async function GET(request: Request) {
  try {
    // Yetki kontrolü
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }
    
    // İzin kontrolü
    const hasAccess = await hasPermission('users:view');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId') || undefined;
    const actionType = searchParams.get('action') || undefined;
    const targetType = searchParams.get('targetType') || undefined;
    const fromDate = searchParams.get('fromDate') || undefined;
    const toDate = searchParams.get('toDate') || undefined;
    const severity = searchParams.get('severity') || undefined;
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    
    // Sayfalama için hesaplamalar
    const skip = (page - 1) * limit;
    
    // Filtreleme koşulları
    const where: any = {};
    
    // Kullanıcı ID'sine göre filtreleme
    if (userId) {
      where.userId = userId;
    }
    
    // İşlem tipine göre filtreleme
    if (actionType) {
      where.action = actionType;
    }
    
    // Hedef tipine göre filtreleme
    if (targetType) {
      where.targetType = targetType;
    }
    
    // Tarih aralığına göre filtreleme
    if (fromDate || toDate) {
      where.createdAt = {};
      
      if (fromDate) {
        where.createdAt.gte = new Date(fromDate);
      }
      
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }
    
    // Önem derecesine göre filtreleme
    if (severity) {
      where.severity = severity;
    }
    
    // Kategoriye göre filtreleme
    if (category) {
      where.category = category;
    }
    
    // Metin araması
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Etkinlik kayıtlarını getir
    const activityLogs = await prisma.activityLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        admin: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      skip,
      take: limit,
    });
    
    // Toplam kayıt sayısını hesapla
    const totalLogs = await prisma.activityLog.count({ where });
    
    // Toplam sayfa sayısını hesapla
    const totalPages = Math.ceil(totalLogs / limit);
    
    // Kategori ve işlem tiplerinin listesini getir
    const categories = await prisma.activityLog.findMany({
      distinct: ['category'],
      select: { category: true },
    });
    
    const actions = await prisma.activityLog.findMany({
      distinct: ['action'],
      select: { action: true },
    });
    
    const severities = await prisma.activityLog.findMany({
      distinct: ['severity'],
      select: { severity: true },
    });
    
    return NextResponse.json({
      logs: activityLogs,
      pagination: {
        total: totalLogs,
        totalPages,
        currentPage: page,
        limit,
      },
      filters: {
        categories: categories.map(c => c.category).filter(Boolean),
        actions: actions.map(a => a.action),
        severities: severities.map(s => s.severity).filter(Boolean),
      },
    });
  } catch (error) {
    console.error('Admin activity log API error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * Kullanıcıya ait etkinlik günlüğü kayıtlarını getir
 * @route GET /api/admin/activity-log/user/:userId
 */
export async function POST(request: Request) {
  try {
    // Yetki kontrolü
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }
    
    // İzin kontrolü
    const hasAccess = await hasPermission('users:view');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }
    
    const body = await request.json();
    const { action, description, userId, targetId, targetType, severity, category, metadata } = body;
    
    // Gerekli alanların kontrolü
    if (!action || !description) {
      return NextResponse.json(
        { error: 'İşlem tipi ve açıklama zorunludur' },
        { status: 400 }
      );
    }
    
    // İstemci IP adresi ve kullanıcı ajanı bilgilerini al
    let ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    if (!ip) {
      // Örnek için localhost IP adresi
      ip = '127.0.0.1';
    }
    
    const userAgent = request.headers.get('user-agent') || '';
    
    // Etkinlik kaydı oluştur
    const activityLog = await prisma.activityLog.create({
      data: {
        action,
        description,
        userId: userId || session.user.id,
        targetId,
        targetType,
        ip,
        userAgent,
        severity: severity || 'INFO',
        category: category || 'SYSTEM',
        metadata: metadata || {},
      },
    });
    
    return NextResponse.json(activityLog, { status: 201 });
  } catch (error) {
    console.error('Admin create activity log API error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
} 