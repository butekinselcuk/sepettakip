import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';
import { hasPermission } from '@/app/lib/admin/permissions';
import bcrypt from 'bcryptjs';

// Kullanıcı detayını getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  try {
    // Token doğrulama
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz erişim: Token bulunamadı' }, { status: 401 });
    }
    
    // JWT token içindeki bilgileri al
    const decodedToken = await verifyJwtToken(token);
    
    if (!decodedToken || decodedToken.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim: Admin yetkisi gerekli' }, { status: 401 });
    }

    console.log(`Kullanıcı detayı getiriliyor: ${id}`);

    // Kullanıcıyı getir
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            phone: true
          }
        },
        admin: true,
        courier: {
          select: {
            phone: true,
            status: true
          }
        },
        business: {
          select: {
            phone: true,
            name: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }
    
    // Telefon numarasını rol tipine göre al
    let phone = '';
    if (user.customer && user.customer.phone) {
      phone = user.customer.phone;
    } else if (user.courier && user.courier.phone) {
      phone = user.courier.phone;
    } else if (user.business && user.business.phone) {
      phone = user.business.phone;
    }
    
    // Status'u rol tipine göre al
    let status = 'ACTIVE'; // Varsayılan olarak aktif kabul et
    if (user.courier && user.courier.status) {
      status = user.courier.status;
    }
    
    // Frontend'e uygun format
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: phone,
      role: user.role,
      status: status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      _count: {
        orders: 0
      }
    };
    
    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error('Admin get user API error:', error);
    return NextResponse.json({ 
      error: 'Kullanıcı bilgileri alınırken bir hata oluştu', 
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Kullanıcı bilgilerini güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  try {
    // Token doğrulama
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz erişim: Token bulunamadı' }, { status: 401 });
    }
    
    // JWT token içindeki bilgileri al
    const decodedToken = await verifyJwtToken(token);
    
    if (!decodedToken || decodedToken.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim: Admin yetkisi gerekli' }, { status: 401 });
    }
    
    const body = await request.json();
    console.log("Kullanıcı güncelleme isteği:", body);

    const { name, email, phone, role, status, password } = body;
    
    // Kullanıcının varlığını kontrol et
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!existingUser) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }
    
    // Sistem hesaplarını koruma kontrolü
    if (existingUser.email === 'admin@sepettakip.com' && existingUser.role !== role) {
      return NextResponse.json({ error: 'Sistem yönetici hesabının rolü değiştirilemez' }, { status: 403 });
    }
    
    // Email değiştiyse benzersizlik kontrolü
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });
      
      if (emailExists) {
        return NextResponse.json({ error: 'Bu email adresi başka bir kullanıcı tarafından kullanılıyor' }, { status: 400 });
      }
    }
    
    console.log("Kullanıcı güncelleniyor:", { name, email, role, status });

    try {
      // User modelini güncelle
      const updateData: any = {
        name,
        email,
        role
      };
      
      // Şifre değiştiyse hash'leyerek ekle
      if (password) {
        // Hash the password with bcrypt before storing it
        const hashedPassword = await bcrypt.hash(password, 10);
        updateData.password = hashedPassword;
      }
      
      // Kullanıcıyı güncelle
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData
      });
      console.log("Ana kullanıcı güncellendi");
      
      // Rol bazlı profili güncelle
      try {
        // Önce rol değişimi olup olmadığını kontrol et
        if (role !== existingUser.role) {
          console.log("Rol değişimi tespit edildi, rol modelini güncelleme");
          
          // Eski rol modelini sil
          if (existingUser.role === 'CUSTOMER') {
            await prisma.customer.delete({ where: { userId: id } });
          } else if (existingUser.role === 'ADMIN') {
            await prisma.admin.delete({ where: { userId: id } });
          } else if (existingUser.role === 'COURIER') {
            await prisma.courier.delete({ where: { userId: id } });
          } else if (existingUser.role === 'BUSINESS') {
            await prisma.business.delete({ where: { userId: id } });
          }
          
          // Yeni rol modeli oluştur
          if (role === 'CUSTOMER') {
            await prisma.customer.create({
              data: {
                userId: id,
                phone: phone || null
              }
            });
          } else if (role === 'ADMIN') {
            await prisma.admin.create({
              data: {
                userId: id,
                phone: phone || null
              }
            });
          } else if (role === 'COURIER') {
            await prisma.courier.create({
              data: {
                userId: id,
                phone: phone || null,
                status: status || 'ACTIVE'
              }
            });
          } else if (role === 'BUSINESS') {
            await prisma.business.create({
              data: {
                userId: id,
                name: name,
                email: email,
                phone: phone || null,
                status: status || 'ACTIVE'
              }
            });
          }
        } else {
          // Rol değişmedi, sadece rol bazlı model verilerini güncelle
          console.log("Aynı rol içinde güncelleme yapılıyor");
          
          if (role === 'CUSTOMER' && phone !== undefined) {
            await prisma.customer.update({
              where: { userId: id },
              data: { phone }
            });
          } else if (role === 'ADMIN' && phone !== undefined) {
            await prisma.admin.update({
              where: { userId: id },
              data: { phone }
            });
          } else if (role === 'COURIER') {
            await prisma.courier.update({
              where: { userId: id },
              data: { 
                phone: phone !== undefined ? phone : undefined,
                status: status !== undefined ? status : undefined
              }
            });
          } else if (role === 'BUSINESS') {
            await prisma.business.update({
              where: { userId: id },
              data: { 
                phone: phone !== undefined ? phone : undefined,
                status: status !== undefined ? status : undefined
              }
            });
          }
        }
        
        console.log("Rol bazlı model güncellendi");
      } catch (roleError) {
        console.error("Rol bazlı model güncellenirken hata:", roleError);
        // Hata mesajını ilet
        return NextResponse.json({ 
          error: 'Rol bazlı profil güncellenirken hata oluştu',
          message: (roleError as Error).message
        }, { status: 500 });
      }
      
      // Aktivite kaydı oluştur
      try {
        await prisma.activityLog.create({
          data: {
            action: 'UPDATE_USER',
            description: `${decodedToken.email} tarafından kullanıcı güncellendi: ${name}`,
            userId: decodedToken.userId,
            targetId: id,
            targetType: 'USER'
          }
        });
      } catch (logError) {
        // Aktivite kaydı oluşturamazsa, işleme devam et, bu kritik değil
        console.error("Aktivite kaydı oluşturulurken hata:", logError);
      }
      
      // Kullanıcı bilgilerini yeniden getir ve formatla
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              phone: true
            }
          },
          admin: {
            select: {
              phone: true
            }
          },
          courier: {
            select: {
              phone: true,
              status: true
            }
          },
          business: {
            select: {
              phone: true,
              status: true
            }
          }
        }
      });
      
      if (!user) {
        return NextResponse.json({ error: 'Kullanıcı bilgileri alınamadı' }, { status: 500 });
      }
      
      // Telefon numarasını rol tipine göre al
      let updatedPhone = '';
      if (user.customer && user.customer.phone) {
        updatedPhone = user.customer.phone;
      } else if (user.admin && user.admin.phone) {
        updatedPhone = user.admin.phone;
      } else if (user.courier && user.courier.phone) {
        updatedPhone = user.courier.phone;
      } else if (user.business && user.business.phone) {
        updatedPhone = user.business.phone;
      }
      
      // Status'u rol tipine göre al
      let updatedStatus = 'ACTIVE';
      if (user.courier && user.courier.status) {
        updatedStatus = user.courier.status;
      } else if (user.business && user.business.status) {
        updatedStatus = user.business.status;
      }
      
      // Frontend'e uygun format
      const formattedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: updatedPhone,
        role: user.role,
        status: updatedStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        _count: {
          orders: 0
        }
      };
      
      console.log("Kullanıcı başarıyla güncellendi");
      return NextResponse.json(formattedUser);
    } catch (dbError) {
      console.error("Veritabanı işlemi sırasında hata:", dbError);
      return NextResponse.json({ 
        error: 'Kullanıcı güncellenirken bir hata oluştu', 
        message: (dbError as Error).message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Admin update user API error:', error);
    return NextResponse.json({ 
      error: 'Sunucu hatası', 
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Kullanıcıyı sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  try {
    // Token doğrulama
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz erişim: Token bulunamadı' }, { status: 401 });
    }
    
    // JWT token içindeki bilgileri al
    const decodedToken = await verifyJwtToken(token);
    
    if (!decodedToken || decodedToken.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim: Admin yetkisi gerekli' }, { status: 401 });
    }
    
    // Kendi hesabını silmeyi önle
    if (decodedToken.userId === id) {
      return NextResponse.json({ error: 'Kendi hesabınızı silemezsiniz' }, { status: 400 });
    }
    
    // Sistem hesaplarını koruma kontrolü
    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true }
    });
    
    if (user?.email === 'admin@sepettakip.com') {
      return NextResponse.json({ error: 'Sistem yönetici hesabı silinemez' }, { status: 403 });
    }
    
    try {
      // Kullanıcıyı sil - cascade ilişkisi sayesinde diğer tablolardaki ilişkili kayıtlar da silinecek
      await prisma.user.delete({
        where: { id }
      });
      
      // Aktivite kaydı oluştur
      try {
        await prisma.activityLog.create({
          data: {
            action: 'DELETE_USER',
            description: `${decodedToken.email} tarafından kullanıcı silindi. ID: ${id}`,
            userId: decodedToken.userId,
            targetId: id,
            targetType: 'USER'
          }
        });
      } catch (logError) {
        // Aktivite kaydı oluşturamazsa, işleme devam et, bu kritik değil
        console.error("Aktivite kaydı oluşturulurken hata:", logError);
      }
      
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error("Kullanıcı silinirken veritabanı hatası:", dbError);
      return NextResponse.json({ 
        error: 'Kullanıcı silinirken bir hata oluştu', 
        message: (dbError as Error).message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Admin delete user API error:', error);
    return NextResponse.json({ 
      error: 'Sunucu hatası', 
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 