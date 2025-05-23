import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/admin/permissions';

// Prisma modellerini tiplendirelim
// Bu geçici bir çözüm, migration tamamlandıktan sonra kaldırılabilir
const prismaAny = prisma as any;

/**
 * GET - İzinleri listeler
 */
export async function GET(request: Request) {
  try {
    // Yetki kontrolü
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    // Şu aşamada izin tablosu oluşturulmadığı için veri yoksa 
    // örnek veriler gösterelim
    let permissions = [];
    
    try {
      permissions = await prismaAny.permission.findMany({
        orderBy: { name: 'asc' }
      });
    } catch (e) {
      console.log('Permission tablosu henüz oluşturulmamış olabilir:', e);
    }

    // Eğer hiç veri yoksa (tablo oluşturulmamış) örnek veriler gösterelim
    if (!permissions || permissions.length === 0) {
      // Örnek izinler
      permissions = [
        // Kullanıcı yönetimi izinleri
        { id: '1', name: 'users:view', description: 'Kullanıcıları görüntüleyebilir' },
        { id: '2', name: 'users:create', description: 'Yeni kullanıcı oluşturabilir' },
        { id: '3', name: 'users:edit', description: 'Kullanıcıları düzenleyebilir' },
        { id: '4', name: 'users:delete', description: 'Kullanıcıları silebilir' },
        
        // Sipariş yönetimi izinleri
        { id: '5', name: 'orders:view', description: 'Siparişleri görüntüleyebilir' },
        { id: '6', name: 'orders:edit', description: 'Siparişleri düzenleyebilir' },
        { id: '7', name: 'orders:cancel', description: 'Siparişleri iptal edebilir' },
        
        // İşletme yönetimi izinleri
        { id: '8', name: 'businesses:view', description: 'İşletmeleri görüntüleyebilir' },
        { id: '9', name: 'businesses:create', description: 'Yeni işletme oluşturabilir' },
        { id: '10', name: 'businesses:edit', description: 'İşletmeleri düzenleyebilir' },
        { id: '11', name: 'businesses:delete', description: 'İşletmeleri silebilir' },
        
        // Teslimat yönetimi izinleri
        { id: '12', name: 'deliveries:view', description: 'Teslimatları görüntüleyebilir' },
        { id: '13', name: 'deliveries:assign', description: 'Teslimatları atayabilir' },
        { id: '14', name: 'deliveries:edit', description: 'Teslimatları düzenleyebilir' },
        
        // Kurye yönetimi izinleri
        { id: '15', name: 'couriers:view', description: 'Kuryeleri görüntüleyebilir' },
        { id: '16', name: 'couriers:create', description: 'Yeni kurye oluşturabilir' },
        { id: '17', name: 'couriers:edit', description: 'Kuryeleri düzenleyebilir' },
        { id: '18', name: 'couriers:delete', description: 'Kuryeleri silebilir' },
        
        // Raporlama izinleri
        { id: '19', name: 'reports:view', description: 'Raporları görüntüleyebilir' },
        { id: '20', name: 'reports:export', description: 'Raporları dışa aktarabilir' },
        
        // Sistem yönetimi izinleri
        { id: '21', name: 'settings:view', description: 'Sistem ayarlarını görüntüleyebilir' },
        { id: '22', name: 'settings:edit', description: 'Sistem ayarlarını düzenleyebilir' },
        
        // Rol yönetimi izinleri
        { id: '23', name: 'roles:view', description: 'Rolleri görüntüleyebilir' },
        { id: '24', name: 'roles:create', description: 'Yeni rol oluşturabilir' },
        { id: '25', name: 'roles:edit', description: 'Rolleri düzenleyebilir' },
        { id: '26', name: 'roles:delete', description: 'Rolleri silebilir' },
      ];
    }

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Admin permissions API error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * POST - Yeni izin oluşturur
 */
export async function POST(request: Request) {
  try {
    // Yetki kontrolü
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    // Sadece super admin özel izin oluşturabilir
    const hasSuperAccess = await hasPermission('roles:create');
    if (!hasSuperAccess) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    // İsteği parse et
    const body = await request.json();
    const { name, description } = body;

    // Gerekli alanların kontrolü
    if (!name || !description) {
      return NextResponse.json(
        { error: 'İzin adı ve açıklaması zorunludur' },
        { status: 400 }
      );
    }

    // İzin formatını doğrula (resource:action)
    const permissionFormat = /^[a-z]+:[a-z]+$/;
    if (!permissionFormat.test(name)) {
      return NextResponse.json(
        { error: 'İzin adı geçerli bir formatta olmalıdır (örn: resource:action)' },
        { status: 400 }
      );
    }

    // İzin zaten var mı kontrolü
    let existingPermission = null;
    try {
      existingPermission = await prismaAny.permission.findUnique({
        where: { name }
      });
    } catch (e) {
      console.log('Permission tablosu henüz oluşturulmamış olabilir:', e);
    }

    if (existingPermission) {
      return NextResponse.json(
        { error: 'Bu isimde bir izin zaten mevcut' },
        { status: 409 }
      );
    }

    // Yeni izin oluştur
    try {
      const newPermission = await prismaAny.permission.create({
        data: {
          name,
          description
        }
      });

      return NextResponse.json(newPermission, { status: 201 });
    } catch (error) {
      console.error('İzin oluşturma hatası:', error);
      return NextResponse.json(
        { error: 'İzin oluşturulurken hata oluştu, veritabanı migration işlemi tamamlanmalı' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Admin create permission API error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * PUT - İzin günceller
 */
export async function PUT(request: Request) {
  try {
    // Yetki kontrolü
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    // Sadece super admin izinleri düzenleyebilir
    const hasSuperAccess = await hasPermission('roles:edit');
    if (!hasSuperAccess) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    // İsteği parse et
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'İzin ID\'si belirtilmedi' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { name, description } = body;

    // En az bir alanın güncellendiğini kontrol et
    if (!description) {
      return NextResponse.json(
        { error: 'İzin açıklaması zorunludur' },
        { status: 400 }
      );
    }

    // İzin mevcut mu kontrol et
    let existingPermission = null;
    try {
      existingPermission = await prismaAny.permission.findUnique({
        where: { id }
      });
    } catch (e) {
      console.log('Permission tablosu henüz oluşturulmamış olabilir:', e);
    }

    if (!existingPermission) {
      return NextResponse.json(
        { error: 'İzin bulunamadı' },
        { status: 404 }
      );
    }

    // İzin adı değiştiriliyorsa, yeni isim kullanılabilir mi kontrol et
    if (name && name !== existingPermission.name) {
      // İzin formatını doğrula (resource:action)
      const permissionFormat = /^[a-z]+:[a-z]+$/;
      if (!permissionFormat.test(name)) {
        return NextResponse.json(
          { error: 'İzin adı geçerli bir formatta olmalıdır (örn: resource:action)' },
          { status: 400 }
        );
      }

      // İsim zaten kullanılıyor mu kontrol et
      let nameExists = null;
      try {
        nameExists = await prismaAny.permission.findUnique({
          where: { name }
        });
      } catch (e) {
        console.log('Permission tablosu henüz oluşturulmamış olabilir:', e);
      }

      if (nameExists && nameExists.id !== id) {
        return NextResponse.json(
          { error: 'Bu isimde bir izin zaten mevcut' },
          { status: 409 }
        );
      }
    }

    // Güncellenecek verileri hazırla
    const updateData: any = { description };
    if (name) updateData.name = name;

    // İzin güncelle
    try {
      const updatedPermission = await prismaAny.permission.update({
        where: { id },
        data: updateData
      });

      return NextResponse.json(updatedPermission);
    } catch (error) {
      console.error('İzin güncelleme hatası:', error);
      return NextResponse.json(
        { error: 'İzin güncellenirken hata oluştu, veritabanı migration işlemi tamamlanmalı' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Admin update permission API error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * DELETE - İzin siler
 */
export async function DELETE(request: Request) {
  try {
    // Yetki kontrolü
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    // Sadece super admin izinleri silebilir
    const hasSuperAccess = await hasPermission('roles:delete');
    if (!hasSuperAccess) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    // İsteği parse et
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'İzin ID\'si belirtilmedi' },
        { status: 400 }
      );
    }

    // İzin mevcut mu kontrol et
    let existingPermission = null;
    try {
      existingPermission = await prismaAny.permission.findUnique({
        where: { id }
      });
    } catch (e) {
      console.log('Permission tablosu henüz oluşturulmamış olabilir:', e);
    }

    if (!existingPermission) {
      return NextResponse.json(
        { error: 'İzin bulunamadı' },
        { status: 404 }
      );
    }

    // Temel izinleri silmeyi engelle
    const corePermissions = [
      'users:view', 'users:create', 'users:edit', 'users:delete',
      'roles:view', 'roles:create', 'roles:edit', 'roles:delete'
    ];
    
    if (corePermissions.includes(existingPermission.name)) {
      return NextResponse.json(
        { error: 'Temel sistem izinleri silinemez' },
        { status: 403 }
      );
    }

    // İzni sil
    try {
      // Öncelikle rol-izin ilişkilerini kaldır
      await prismaAny.$executeRaw`
        DELETE FROM "_AdminRoleToPermission" 
        WHERE "B" = ${id}
      `.catch((error: unknown) => {
        console.log('Role-Permission ilişki tablosu henüz oluşturulmamış olabilir:', error);
      });

      // İzni sil
      await prismaAny.permission.delete({
        where: { id }
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('İzin silme hatası:', error);
      return NextResponse.json(
        { error: 'İzin silinirken hata oluştu, veritabanı migration işlemi tamamlanmalı' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Admin delete permission API error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
} 