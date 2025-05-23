import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/admin/permissions';

// Bir workaround olarak Prisma modellerini tiplendirelim
// Bu kısım migration sonrası kaldırılabilir 
const prismaAny = prisma as any;

/**
 * GET - Admin rollerini listeler
 */
export async function GET(request: Request) {
  try {
    // Yetki kontrolü
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    // Şu aşamada rol tablosu oluşturulmadığı için veri yoksa
    // örnek veriler gösterelim
    // Bu bir migration sonrası kaldırılabilir
    let roles = [];
    
    try {
      roles = await prismaAny.adminRole.findMany({
        include: {
          permissions: true,
        },
      });
    } catch (e) {
      console.log('Admin role tablosu henüz oluşturulmamış olabilir:', e);
    }

    // Eğer hiç veri yoksa (tablo oluşturulmamış) örnek veriler gösterelim
    if (!roles || roles.length === 0) {
      // Örnek veriler
      roles = [
        {
          id: '1',
          name: 'Super Admin',
          description: 'Tüm yetkilere sahip rol',
          createdAt: new Date(),
          updatedAt: new Date(),
          permissions: [
            { id: '1', name: 'users:view', description: 'Kullanıcıları görüntüleyebilir' },
            { id: '2', name: 'users:create', description: 'Yeni kullanıcı oluşturabilir' },
            { id: '3', name: 'users:edit', description: 'Kullanıcıları düzenleyebilir' },
            { id: '4', name: 'users:delete', description: 'Kullanıcıları silebilir' },
            // Diğer izinler...
          ]
        },
        {
          id: '2',
          name: 'Admin',
          description: 'Yönetici hakları',
          createdAt: new Date(),
          updatedAt: new Date(),
          permissions: [
            { id: '1', name: 'users:view', description: 'Kullanıcıları görüntüleyebilir' },
            { id: '2', name: 'users:create', description: 'Yeni kullanıcı oluşturabilir' },
            // Diğer izinler...
          ]
        },
        {
          id: '3',
          name: 'Editor',
          description: 'Düzenleme hakları',
          createdAt: new Date(),
          updatedAt: new Date(),
          permissions: [
            { id: '1', name: 'users:view', description: 'Kullanıcıları görüntüleyebilir' },
            // Diğer izinler...
          ]
        }
      ];
    }

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Admin roles API error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * POST - Yeni rol oluşturur
 */
export async function POST(request: Request) {
  try {
    // Yetki kontrolü
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    // İzin kontrolü
    const hasAccess = await hasPermission('users:create');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    // İsteği parse et
    const body = await request.json();
    const { name, description, permissions } = body;

    // Gerekli alanların kontrolü
    if (!name || !description) {
      return NextResponse.json(
        { error: 'Ad ve açıklama zorunludur' },
        { status: 400 }
      );
    }

    // Rol zaten var mı kontrolü
    let existingRole = null;
    try {
      existingRole = await prismaAny.adminRole.findUnique({
        where: { name }
      });
    } catch (e) {
      console.log('AdminRole tablosu henüz oluşturulmamış olabilir:', e);
    }

    if (existingRole) {
      return NextResponse.json(
        { error: 'Bu isimde bir rol zaten mevcut' },
        { status: 409 }
      );
    }

    // Yeni rol oluştur
    try {
      const newRole = await prismaAny.adminRole.create({
        data: {
          name,
          description,
          permissions: {
            connect: Array.isArray(permissions) ? permissions.map((id: string) => ({ id })) : []
          }
        },
        include: {
          permissions: true
        }
      });

      return NextResponse.json(newRole, { status: 201 });
    } catch (error) {
      console.error('Rol oluşturma hatası:', error);
      return NextResponse.json(
        { error: 'Rol oluşturulurken hata oluştu, veritabanı migration işlemi tamamlanmalı' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Admin create role API error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * PUT - Rol günceller
 */
export async function PUT(request: Request) {
  try {
    // Yetki kontrolü
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    // İzin kontrolü
    const hasAccess = await hasPermission('users:edit');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    // İsteği parse et
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Rol ID\'si belirtilmedi' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { name, description, permissions } = body;

    // En az bir alanın güncellendiğini kontrol et
    if (!name && !description && !permissions) {
      return NextResponse.json(
        { error: 'Güncellenecek en az bir alan gerekli' },
        { status: 400 }
      );
    }

    // Rol mevcut mu kontrol et
    let existingRole = null;
    try {
      existingRole = await prismaAny.adminRole.findUnique({
        where: { id }
      });
    } catch (e) {
      console.log('AdminRole tablosu henüz oluşturulmamış olabilir:', e);
    }

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Rol bulunamadı' },
        { status: 404 }
      );
    }

    // Güncellenecek verileri hazırla
    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (description) updateData.description = description;

    // Rol güncelle
    try {
      const updatedRole = await prismaAny.adminRole.update({
        where: { id },
        data: updateData,
      });

      // İzinleri güncelle (eğer belirtildiyse)
      if (permissions && Array.isArray(permissions)) {
        // Önce mevcut tüm izinleri kaldır
        await prismaAny.adminRole.update({
          where: { id },
          data: {
            permissions: {
              set: []
            }
          }
        });

        // Sonra yeni izinleri ekle
        await prismaAny.adminRole.update({
          where: { id },
          data: {
            permissions: {
              connect: permissions.map((permId: string) => ({ id: permId }))
            }
          }
        });
      }

      // Güncellenmiş rolü izinlerle birlikte getir
      const roleWithPermissions = await prismaAny.adminRole.findUnique({
        where: { id },
        include: {
          permissions: true
        }
      });

      return NextResponse.json(roleWithPermissions);
    } catch (error) {
      console.error('Rol güncelleme hatası:', error);
      return NextResponse.json(
        { error: 'Rol güncellenirken hata oluştu, veritabanı migration işlemi tamamlanmalı' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Admin update role API error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * DELETE - Rol siler
 */
export async function DELETE(request: Request) {
  try {
    // Yetki kontrolü
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    // İzin kontrolü
    const hasAccess = await hasPermission('users:delete');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    // İsteği parse et
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Rol ID\'si belirtilmedi' },
        { status: 400 }
      );
    }

    // Rol mevcut mu kontrol et
    let existingRole = null;
    try {
      existingRole = await prismaAny.adminRole.findUnique({
        where: { id }
      });
    } catch (e) {
      console.log('AdminRole tablosu henüz oluşturulmamış olabilir:', e);
    }

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Rol bulunamadı' },
        { status: 404 }
      );
    }

    // Super Admin rolünü silmeye izin verme
    if (existingRole.name === 'Super Admin') {
      return NextResponse.json(
        { error: 'Super Admin rolü silinemez' },
        { status: 403 }
      );
    }

    // Rol ile ilişkili tüm atanmış rolleri kaldır
    try {
      await prismaAny.adminRoleMapping.deleteMany({
        where: { roleId: id }
      });
    } catch (error) {
      console.error('Rol eşleştirmelerini silme hatası:', error);
      // Hata olsa da devam et, tablo henüz oluşturulmamış olabilir
    }

    // Rolü sil
    try {
      await prismaAny.adminRole.delete({
        where: { id }
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Rol silme hatası:', error);
      return NextResponse.json(
        { error: 'Rol silinirken hata oluştu, veritabanı migration işlemi tamamlanmalı' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Admin delete role API error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
} 