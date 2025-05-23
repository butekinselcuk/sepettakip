import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// Kullanıcıları listele
export async function GET(request: NextRequest) {
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

    // URL'den sorgu parametrelerini al
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || undefined;
    const status = searchParams.get('status') || undefined;
    
    // Sayfalama için hesaplamalar
    const skip = (page - 1) * limit;
    
    // Filtreleme için arama koşulları
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (role) {
      where.role = role;
    }
    
    // Status filtresi şimdilik kaldırıldı (User modelinde bu alan yok)
    // if (status) {
    //   where.status = status;
    // }
    
    console.log("Kullanıcılar getiriliyor:", { where, skip, limit });
    
    // Kullanıcıları getir
    const users = await prisma.user.findMany({
      skip,
      take: limit,
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            phone: true,
            orders: {
              select: {
                id: true
              }
            }
          }
        },
        admin: true,
        courier: {
          select: {
            phone: true,
            status: true,
            deliveries: {
              select: {
                id: true
              }
            }
          }
        },
        business: {
          select: {
            phone: true,
            products: {
              select: {
                id: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`${users.length} kullanıcı bulundu.`);
    
    // Kullanıcı verilerini formatla ve order sayılarını ekle
    const formattedUsers = users.map(user => {
      // Telefon numarasını role göre al
      let phone = '';
      let status = 'ACTIVE';
      let orderCount = 0;
      
      if (user.role === 'CUSTOMER' && user.customer) {
        phone = user.customer.phone || '';
        orderCount = user.customer.orders?.length || 0;
      } else if (user.role === 'COURIER' && user.courier) {
        phone = user.courier.phone || '';
        status = user.courier.status || 'ACTIVE';
        orderCount = user.courier.deliveries?.length || 0;
      } else if (user.role === 'BUSINESS' && user.business) {
        phone = user.business.phone || '';
        orderCount = user.business.products?.length || 0;
      }
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone,
        role: user.role,
        status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        _count: {
          orders: orderCount
        }
      };
    });
    
    // Toplam kayıt sayısını getir (sayfalama için)
    const total = await prisma.user.count({ where });
    
    // Formatlı cevap döndür
    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: 'Kullanıcılar alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Yeni kullanıcı oluştur
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
    
    const body = await request.json();
    console.log("Yeni kullanıcı oluşturma isteği:", body);
    
    const { name, email, phone, password, role } = body;
    
    // Gerekli alanların kontrolü
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'İsim, email ve şifre zorunludur' },
        { status: 400 }
      );
    }
    
    // Email formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Geçerli bir email adresi giriniz' },
        { status: 400 }
      );
    }
    
    console.log("Email ve gerekli alan kontrolü başarılı");
    
    // Kullanıcı zaten var mı kontrolü
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu email adresi zaten kullanımda' },
        { status: 409 }
      );
    }
    
    console.log("Kullanıcı benzersizlik kontrolü başarılı");
    
      // Şifreyi hash'le
      const hashedPassword = await bcrypt.hash(password, 10);
      
    // Kullanıcı rolleri
    const validRoles = ['ADMIN', 'BUSINESS', 'COURIER', 'CUSTOMER'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Geçersiz kullanıcı rolü. Geçerli roller: ' + validRoles.join(', ') },
        { status: 400 }
      );
    }
    
    // Prisma transaction ile kullanıcı ve rol bilgilerini oluştur
    const user = await prisma.$transaction(async (prisma) => {
      // Ana kullanıcı kaydını oluştur
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role
        }
      });
      
      // Role göre ilişkili tabloya kayıt ekle
      if (role === 'ADMIN') {
          await prisma.admin.create({
            data: {
            userId: user.id
            }
          });
        } else if (role === 'BUSINESS') {
          await prisma.business.create({
            data: {
            userId: user.id,
              name: name,
            phone: phone || '',
            address: body.address || ''
            }
          });
      } else if (role === 'COURIER') {
        await prisma.courier.create({
          data: {
            userId: user.id,
            phone: phone || '',
            status: 'AVAILABLE',
            isActive: true
          }
        });
      } else if (role === 'CUSTOMER') {
        await prisma.customer.create({
          data: {
            userId: user.id,
            phone: phone || '',
            address: body.address || ''
          }
        });
      }
      
      // Kullanıcı ayarlarını oluştur
      await prisma.userSettings.create({
        data: {
          userId: user.id,
          theme: 'light',
          language: 'tr'
        }
      });
      
      return user;
    });
    
      return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Admin create user API error:', error);
    return NextResponse.json(
      { error: 'Kullanıcı oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
} 