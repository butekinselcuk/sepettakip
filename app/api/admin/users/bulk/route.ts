import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';

// Rol ve durum sabitleri
const Role = {
  ADMIN: 'ADMIN',
  CUSTOMER: 'CUSTOMER',
  BUSINESS: 'BUSINESS',
  COURIER: 'COURIER'
};

const Status = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  INACTIVE: 'INACTIVE'
};

interface BulkActionRequest {
  userIds: string[];
  action: string;
  role?: string;
}

// İşlem geçmişi saklamak için basit bir in-memory depo
// Not: Gerçek bir uygulamada bu veritabanında saklanmalıdır
const actionHistory: {
  id: string;
  userIds: string[];
  action: string;
  data: any;
  timestamp: Date;
  adminId: string;
}[] = [];

/**
 * Toplu kullanıcı işlemleri için API endpoint
 * @route POST /api/admin/users/bulk
 */
export async function POST(request: NextRequest) {
  try {
    // Token'ı alıp doğrulama
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz erişim: Token bulunamadı' }, { status: 401 });
    }
    
    // JWT token içindeki bilgileri al
    const decodedToken = await verifyJwtToken(token);
    
    if (!decodedToken || decodedToken.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim: Admin yetkisi gerekli' }, { status: 401 });
    }
    
    const body = await request.json() as BulkActionRequest;
    const { userIds, action } = body;
    
    // Gerekli alanların kontrolü
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'En az bir kullanıcı ID\'si gereklidir' },
        { status: 400 }
      );
    }
    
    if (!action) {
      return NextResponse.json(
        { error: 'İşlem tipi gereklidir' },
        { status: 400 }
      );
    }
    
    // Sistem yöneticisini koruma
    const adminUser = await prisma.user.findFirst({
      where: { 
        email: 'admin@sepettakip.com',
        id: { in: userIds }
      }
    });
    
    if (adminUser) {
      return NextResponse.json(
        { error: 'Sistem yöneticisi bu işlemden etkilenmeyecektir' },
        { status: 403 }
      );
    }
    
    // İşleme geçmişi için veri hazırla
    const historyEntry = {
      id: Date.now().toString(),
      userIds: [...userIds],
      action,
      data: { ...body },
      timestamp: new Date(),
      adminId: decodedToken.userId
    };
    
    let result;
    
    // İşlem tipine göre farklı işlemler yap
    switch (action) {
      case 'ACTIVATE':
        // Kullanıcı türüne göre durum güncelleme
        for (const userId of userIds) {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
          });
          
          if (user) {
            if (user.role === 'COURIER') {
              await prisma.courier.updateMany({
                where: { userId: userId },
                data: { status: 'ACTIVE' }
              });
            } else if (user.role === 'BUSINESS') {
              await prisma.business.updateMany({
                where: { userId: userId },
                data: { status: 'ACTIVE' }
              });
            }
            // CUSTOMER ve ADMIN için özel durum alanı yok
          }
        }
        
        result = { count: userIds.length };
        
        // Etkinlik günlüğüne ekle
        await prisma.activityLog.create({
          data: {
            action: 'BULK_ACTIVATE_USERS',
            description: `${decodedToken.email} tarafından ${userIds.length} kullanıcı aktifleştirildi`,
            userId: decodedToken.userId,
            targetType: 'USER'
          }
        });
        break;
        
      case 'SUSPEND':
        // Kullanıcı türüne göre durum güncelleme
        for (const userId of userIds) {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
          });
          
          if (user) {
            if (user.role === 'COURIER') {
              await prisma.courier.updateMany({
                where: { userId: userId },
                data: { status: 'SUSPENDED' }
              });
            } else if (user.role === 'BUSINESS') {
              await prisma.business.updateMany({
                where: { userId: userId },
                data: { status: 'SUSPENDED' }
              });
            }
            // CUSTOMER ve ADMIN için özel durum alanı yok
          }
        }
        
        result = { count: userIds.length };
        
        // Etkinlik günlüğüne ekle
        await prisma.activityLog.create({
          data: {
            action: 'BULK_SUSPEND_USERS',
            description: `${decodedToken.email} tarafından ${userIds.length} kullanıcı askıya alındı`,
            userId: decodedToken.userId,
            targetType: 'USER'
          }
        });
        break;
        
      case 'DELETE':
        // Veritabanı ilişkilerini korumak için cascade delete kullanıyoruz
        result = await prisma.user.deleteMany({
          where: { id: { in: userIds } }
        });
        
        // Etkinlik günlüğüne ekle
        await prisma.activityLog.create({
          data: {
            action: 'BULK_DELETE_USERS',
            description: `${decodedToken.email} tarafından ${userIds.length} kullanıcı silindi`,
            userId: decodedToken.userId,
            targetType: 'USER'
          }
        });
        break;
        
      case 'CHANGE_ROLE':
        const { role } = body;
        
        if (!role) {
          return NextResponse.json(
            { error: 'Rol değiştirme işlemi için rol belirtilmelidir' },
            { status: 400 }
          );
        }
        
        const validRoles = ['ADMIN', 'CUSTOMER', 'BUSINESS', 'COURIER'];
        if (!validRoles.includes(role)) {
          return NextResponse.json(
            { error: 'Geçersiz rol' },
            { status: 400 }
          );
        }
        
        // Kullanıcıların rolünü değiştir ve ilgili rol tablosundaki kayıtları güncelle
        for (const userId of userIds) {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, name: true, email: true }
          });
          
          if (user && user.role !== role) {
            // Kullanıcının rolünü güncelle
            await prisma.user.update({
              where: { id: userId },
              data: { role: role as any }
            });
            
            // Eski rol tablosundaki kaydı sil
            if (user.role === 'CUSTOMER') {
              await prisma.customer.deleteMany({ where: { userId } });
            } else if (user.role === 'ADMIN') {
              await prisma.admin.deleteMany({ where: { userId } });
            } else if (user.role === 'COURIER') {
              await prisma.courier.deleteMany({ where: { userId } });
            } else if (user.role === 'BUSINESS') {
              await prisma.business.deleteMany({ where: { userId } });
            }
            
            // Yeni rol tablosuna kayıt ekle
            if (role === 'CUSTOMER') {
              await prisma.customer.create({
                data: { userId }
              });
            } else if (role === 'ADMIN') {
              await prisma.admin.create({
                data: { userId }
              });
            } else if (role === 'COURIER') {
              await prisma.courier.create({
                data: { 
                  userId, 
                  status: 'ACTIVE'
                }
              });
            } else if (role === 'BUSINESS') {
              await prisma.business.create({
                data: { 
                  userId, 
                  status: 'ACTIVE',
                  name: user.name,
                  email: user.email
                }
              });
            }
          }
        }
        
        result = { count: userIds.length };
        
        // Etkinlik günlüğüne ekle
        await prisma.activityLog.create({
          data: {
            action: 'BULK_CHANGE_ROLE',
            description: `${decodedToken.email} tarafından ${userIds.length} kullanıcının rolü "${role}" olarak değiştirildi`,
            userId: decodedToken.userId,
            targetType: 'USER'
          }
        });
        break;
        
      default:
        return NextResponse.json(
          { error: 'Geçersiz işlem tipi' },
          { status: 400 }
        );
    }
    
    // İşlem geçmişine ekle
    actionHistory.push(historyEntry);
    
    // Geçmişi 100 kayıtla sınırla
    if (actionHistory.length > 100) {
      actionHistory.shift();
    }
    
    return NextResponse.json({
      success: true,
      message: `${userIds.length} kullanıcı üzerinde ${action} işlemi başarıyla uygulandı`,
      affected: result?.count || 0,
      actionId: historyEntry.id
    });
  } catch (error) {
    console.error('Toplu kullanıcı işlemi hatası:', error);
    return NextResponse.json({ 
      error: 'Sunucu hatası',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 