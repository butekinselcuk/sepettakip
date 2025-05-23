import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '../prisma';

// Kullanılabilir izinlerin listesi - API kullanımı için
export type PermissionName =
  // Kullanıcı yönetimi izinleri
  | 'users:view'
  | 'users:create'
  | 'users:edit'
  | 'users:delete'
  | 'users:export'
  | 'users:import'
  | 'users:approve'
  | 'users:reject'
  
  // Sipariş yönetimi izinleri
  | 'orders:view'
  | 'orders:create'
  | 'orders:edit'
  | 'orders:delete'
  | 'orders:cancel'
  | 'orders:export'
  | 'orders:import'
  | 'orders:approve'
  | 'orders:reject'
  
  // İşletme yönetimi izinleri
  | 'businesses:view'
  | 'businesses:create'
  | 'businesses:edit'
  | 'businesses:delete'
  | 'businesses:export'
  | 'businesses:import'
  | 'businesses:approve'
  | 'businesses:reject'
  
  // Teslimat yönetimi izinleri
  | 'deliveries:view'
  | 'deliveries:create'
  | 'deliveries:edit'
  | 'deliveries:delete'
  | 'deliveries:assign'
  | 'deliveries:export'
  | 'deliveries:import'
  | 'deliveries:approve'
  | 'deliveries:reject'
  
  // Kurye yönetimi izinleri
  | 'couriers:view'
  | 'couriers:create'
  | 'couriers:edit'
  | 'couriers:delete'
  | 'couriers:export'
  | 'couriers:import'
  | 'couriers:approve'
  | 'couriers:reject'
  
  // Raporlama izinleri
  | 'reports:view'
  | 'reports:create'
  | 'reports:edit'
  | 'reports:delete'
  | 'reports:export'
  | 'reports:import'
  | 'reports:approve'
  | 'reports:reject'
  
  // Sistem ayarları izinleri
  | 'settings:view'
  | 'settings:edit'
  
  // Rol yönetimi izinleri
  | 'roles:view'
  | 'roles:create'
  | 'roles:edit'
  | 'roles:delete'
  
  // Dashboard izinleri
  | 'dashboard:view'
  | 'dashboard:create'
  | 'dashboard:edit'
  | 'dashboard:delete'
  | 'dashboard:export'
  | 'dashboard:import'
  | 'dashboard:approve'
  | 'dashboard:reject'
  // Gerekli yeni izinler eklenebilir
  | string; // Ekstra güvenlik için string de kabul edelim

// Prisma modeli henüz implement edilmeyen durumlar için "any" tipi kullanımı
const prismaAny = prisma as any;

/**
 * Kullanıcının belirli bir izne sahip olup olmadığını kontrol eder.
 * 
 * @param permissionName - Kontrol edilecek izin adı
 * @param userId - (Opsiyonel) Kontrol edilecek kullanıcı ID'si. Belirtilmezse mevcut oturum kullanılır.
 * @returns İzin var ise true, yoksa false döner.
 */
export async function hasPermission(
  permissionName: string, // Tip güvenliği için bir string alan kabul edelim
  userId?: string
): Promise<boolean> {
  try {
    // Geliştirme ortamındaki otomatik izni kaldırıyoruz
    // Gerçek izin kontrolüne geçiyoruz
    
    let currentUserId: string | undefined = userId;
    
    // Kullanıcı ID'si belirtilmemişse mevcut oturumdaki kullanıcıyı kullan
    if (!currentUserId) {
      const session = await getServerSession(authOptions);
      
      if (!session || !session.user) {
        return false;
      }
      
      // Admin olmayanlar için izinler kontrol edilmez, direkt false döner
      if (session.user.role !== 'ADMIN') {
        return false;
      }
      
      currentUserId = session.user.id;
    }
    
    // Super Admin kontrolü - User modelinde isSuperAdmin henüz tanımlı olmadığı için
    // geçici olarak email kontrolü ile yapıyoruz
    try {
      const user = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { email: true, role: true }
      });
      
      // Veritabanında isSuperAdmin alanını kullan
      const adminProfile = await prisma.admin.findUnique({
        where: { userId: currentUserId },
        select: { isSuperAdmin: true }
      });

      // Sadece isSuperAdmin=true olan kullanıcılara süper admin izinleri verilir
      if (adminProfile && adminProfile.isSuperAdmin === true) {
        return true;
      }
    } catch (error) {
      console.error('Admin kontrolü hatası:', error);
      // İşlemi devam ettirmek için hatayı yutuyoruz
    }
    
    // Veritabanı tablosu oluşturulduysa izinleri kontrol et
    try {
      // Kullanıcının rollerini ve izinlerini getir
      const adminUser = await prismaAny.adminUser.findUnique({
        where: { userId: currentUserId },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: true
                }
              }
            }
          }
        }
      });
      
      if (!adminUser) {
        return false;
      }
      
      // Kullanıcının tüm rollerindeki tüm izinleri toplayalım
      const userPermissions = new Set<string>();
      
      adminUser.roles.forEach((roleMapping: any) => {
        roleMapping.role.permissions.forEach((permission: any) => {
          userPermissions.add(permission.name);
        });
      });
      
      // İstenilen izin mevcut mu kontrol et
      return userPermissions.has(permissionName);
    } catch (error) {
      console.log('İzin kontrolü hatası (tablo henüz oluşturulmamış olabilir):', error);
      
      // Hiçbir şey bulunamadıysa ve tablo henüz oluşturulmadıysa
      // Üretim ortamında varsayılan izin yok
      if (process.env.NODE_ENV === 'production') {
        return false;
      }
      
      // Sadece geliştirme ortamında temel izinler
      if (process.env.NODE_ENV === 'development') {
        return [
          'users:view', 'users:create', 'users:edit', 'users:delete',
          'orders:view', 'orders:edit',
          'businesses:view',
          'deliveries:view',
          'couriers:view',
          'reports:view',
          'settings:view',
          'roles:view',
          'dashboard:view'
        ].includes(permissionName);
      }
      
      return false;
    }
  } catch (error) {
    console.error('İzin kontrolü sırasında hata oluştu:', error);
    return false;
  }
}

/**
 * Kullanıcının izinlerini listeler
 * @param userId - (Opsiyonel) Kontrol edilecek kullanıcı ID'si. Belirtilmezse mevcut oturum kullanılır.
 * @returns İzin listesi
 */
export async function getUserPermissions(userId?: string): Promise<string[]> {
  try {
    let currentUserId: string | undefined = userId;
    
    // Kullanıcı ID'si belirtilmemişse mevcut oturumdaki kullanıcıyı kullan
    if (!currentUserId) {
      const session = await getServerSession(authOptions);
      
      if (!session || !session.user) {
        return [];
      }
      
      // Admin olmayanlar için izinler dönmez
      if (session.user.role !== 'ADMIN') {
        return [];
      }
      
      currentUserId = session.user.id;
    }
    
    // Super Admin kontrolü - veritabanındaki isSuperAdmin alanını kullan
    try {
      const adminProfile = await prisma.admin.findUnique({
        where: { userId: currentUserId },
        select: { isSuperAdmin: true }
      });
      
      // Süper admin izinleri
      if (adminProfile && adminProfile.isSuperAdmin === true) {
        // Super admin için örnek olarak tüm izinleri dön
        // Normalde burada veritabanından tüm izinleri çekerdik
        const allPermissions = [
          'users:view', 'users:create', 'users:edit', 'users:delete',
          'orders:view', 'orders:create', 'orders:edit', 'orders:delete',
          'businesses:view', 'businesses:create', 'businesses:edit', 'businesses:delete',
          'deliveries:view', 'deliveries:create', 'deliveries:edit', 'deliveries:delete',
          'couriers:view', 'couriers:create', 'couriers:edit', 'couriers:delete',
          'reports:view', 'reports:create', 'reports:edit', 'reports:delete',
          'settings:view', 'settings:edit',
          'roles:view', 'roles:create', 'roles:edit', 'roles:delete',
          'dashboard:view'
        ];
        return allPermissions;
      }
    } catch (error) {
      console.error('Admin kontrolü hatası:', error);
    }
    
    // Veritabanı tablosu oluşturulduysa izinleri getir
    try {
      // Kullanıcının rollerini ve izinlerini getir
      const adminUser = await prismaAny.adminUser.findUnique({
        where: { userId: currentUserId },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: true
                }
              }
            }
          }
        }
      });
      
      if (!adminUser) {
        return [];
      }
      
      // Kullanıcının tüm rollerindeki tüm izinleri toplayalım
      const userPermissions = new Set<string>();
      
      adminUser.roles.forEach((roleMapping: any) => {
        roleMapping.role.permissions.forEach((permission: any) => {
          userPermissions.add(permission.name);
        });
      });
      
      return Array.from(userPermissions);
    } catch (error) {
      console.log('İzin listesi hatası (tablo henüz oluşturulmamış olabilir):', error);
      
      // Hiçbir şey bulunamadıysa ve tablo henüz oluşturulmadıysa
      // Üretim ortamında varsayılan izin yok
      if (process.env.NODE_ENV === 'production') {
        return [];
      }
      
      // Sadece geliştirme ortamında temel izinler
      if (process.env.NODE_ENV === 'development') {
        return [
          'users:view', 'users:create', 'users:edit', 'users:delete',
          'orders:view', 'orders:edit',
          'businesses:view',
          'deliveries:view',
          'couriers:view',
          'reports:view',
          'settings:view',
          'roles:view',
          'dashboard:view'
        ];
      }
      
      return [];
    }
  } catch (error) {
    console.error('İzin listesi alınırken hata oluştu:', error);
    return [];
  }
} 