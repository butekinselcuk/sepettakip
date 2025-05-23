import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/app/lib/admin/permissions';

/**
 * POST /api/admin/settings/maintenance - Bakım modunu açıp kapatır
 */
export async function POST(request: NextRequest) {
  try {
    // Yetki kontrolü
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }
    
    // İzin kontrolü - Sadece yöneticiler bakım modunu değiştirebilir
    const hasAccess = await hasPermission('settings:edit');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }
    
    // Request body'den bakım modu durumunu al
    const body = await request.json();
    const { enabled } = body;
    
    if (enabled === undefined) {
      return NextResponse.json(
        { error: 'enabled parametresi gereklidir' },
        { status: 400 }
      );
    }
    
    // Bakım modu ayarını güncelle veya oluştur
    await prisma.systemSettings.upsert({
      where: { key: 'maintenance.enabled' },
      update: {
        value: enabled.toString(),
        lastUpdated: new Date(),
        updatedBy: session.user.id
      },
      create: {
        key: 'maintenance.enabled',
        value: enabled.toString(),
        category: 'access',
        description: 'Bakım modu durumu',
        dataType: 'boolean',
        lastUpdated: new Date(),
        updatedBy: session.user.id
      }
    });
    
    // Bakım nedeni varsa güncelle
    if (body.reason) {
      await prisma.systemSettings.upsert({
        where: { key: 'maintenance.reason' },
        update: {
          value: body.reason,
          lastUpdated: new Date(),
          updatedBy: session.user.id
        },
        create: {
          key: 'maintenance.reason',
          value: body.reason,
          category: 'access',
          description: 'Bakım modu açıklama metni',
          dataType: 'string',
          lastUpdated: new Date(),
          updatedBy: session.user.id
        }
      });
    }
    
    // Etkinlik günlüğüne kaydet
    await prisma.activityLog.create({
      data: {
        action: enabled ? 'ENABLE_MAINTENANCE_MODE' : 'DISABLE_MAINTENANCE_MODE',
        description: `${session.user.name} tarafından bakım modu ${enabled ? 'etkinleştirildi' : 'devre dışı bırakıldı'}`,
        userId: session.user.id,
        adminId: session.user.id,
        metadata: { enabled, reason: body.reason },
        category: 'SYSTEM',
        severity: 'WARNING'
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `Bakım modu ${enabled ? 'etkinleştirildi' : 'devre dışı bırakıldı'}`
    });
  } catch (error) {
    console.error('Bakım modu güncelleme hatası:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 