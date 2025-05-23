import { NextRequest, NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sign } from "@/lib/auth";
import type { JWTPayload } from "@/lib/auth";

// POST: Kullanıcı girişi için endpoint
export async function POST(request: NextRequest) {
  try {
    // İstek gövdesinden email ve şifreyi al
    const { email, password } = await request.json();

    if (!email || !password) {
      console.log(`❌ [Auth] Eksik kimlik bilgileri: email=${email}, password=${password ? 'provided' : 'missing'}`);
      return NextResponse.json({ success: false, error: 'Email ve şifre gereklidir' }, { status: 400 });
    }
    
    console.log(`🔒 [Auth] Login isteği: ${email}`);

    // Genişletilmiş test kullanıcıları listesi
    const testUsers = {
      'admin@example.com': 'Test123',
      'business@example.com': 'Test123',
      'courier@example.com': 'Test123',
      'customer@example.com': 'Test123',
      'admin1@example.com': 'Test123',
      'business1@example.com': 'Test123',
      'courier1@example.com': 'Test123',
      'customer1@example.com': 'Test123'
    };

    // Doğrudan test kullanıcısı kontrolü
    let isTestUser = false;
    let testUserRole = null;
    
    if (Object.keys(testUsers).includes(email) && testUsers[email as keyof typeof testUsers] === password) {
      isTestUser = true;
      console.log(`✅ [Auth] Test kullanıcısı eşleşti: ${email}`);
      
      // Test kullanıcısı rolünü belirle
      if (email.includes('admin')) {
        testUserRole = 'ADMIN';
      } else if (email.includes('business')) {
        testUserRole = 'BUSINESS';
      } else if (email.includes('courier')) {
        testUserRole = 'COURIER';
      } else if (email.includes('customer')) {
        testUserRole = 'CUSTOMER';
      }
    }

    // Normal veritabanı kullanıcısı kontrolü (test kullanıcısı değilse)
    let user = null;
    if (!isTestUser) {
      // Kullanıcıyı bul
        user = await prisma.user.findUnique({
        where: { email },
        include: {
          admin: true,
          business: true,
          courier: true,
          customer: true
        }
      });

      if (!user) {
        console.log(`❌ [Auth] Kullanıcı bulunamadı: ${email}`);
        return NextResponse.json({ success: false, error: 'Geçersiz email veya şifre' }, { status: 401 });
        }
        
      // Şifre karşılaştırma
      const passwordValid = await compare(password, user.password);
      
      if (!passwordValid) {
        console.log(`❌ [Auth] Geçersiz şifre: ${email}`);
        return NextResponse.json({ success: false, error: 'Geçersiz email veya şifre' }, { status: 401 });
      }
    } else {
      // Test kullanıcısı için veritabanından bilgileri çekmeye çalış, yoksa oluştur
        user = await prisma.user.findUnique({
        where: { email },
        include: {
          admin: true,
          business: true,
          courier: true,
          customer: true
        }
      });
      
      // Test kullanıcısı veritabanında bulunamadı, manuel bilgiler oluştur
      if (!user) {
        console.log(`ℹ️ [Auth] Test kullanıcısı veritabanında bulunamadı, manuel bilgiler kullanılıyor: ${email}`);
        user = {
          id: `test-${Date.now()}`,
          email: email,
          name: email.split('@')[0],
          password: 'hashed-test-password',  // gerçek bir hash değil
          role: testUserRole || 'CUSTOMER',
          createdAt: new Date(),
          updatedAt: new Date(),
          admin: null,
          business: null,
          courier: null,
          customer: null
        };
      }
    }

    // JWT Token oluştur - role değeri büyük harfe çevrilecek
    const token = await sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role.toUpperCase() 
    });

    console.log(`🔑 [Auth] Token oluşturuldu: ${token.substring(0, 15)}...`);

    // Rol bazlı yönlendirme URL'i
    let redirectUrl = '/dashboard';
    if (user.role === 'ADMIN') {
          redirectUrl = '/admin/dashboard';
    } else if (user.role === 'BUSINESS') {
          redirectUrl = '/business/dashboard';
    } else if (user.role === 'COURIER') {
          redirectUrl = '/courier/dashboard';
    } else if (user.role === 'CUSTOMER') {
          redirectUrl = '/customer/dashboard';
      }

    // Kullanıcı verilerini temizle
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    };

    // Başarılı yanıt
      const response = NextResponse.json({
        success: true,
        token,
      user: userData,
        redirectUrl
    });

    // Cookie olarak token ayarla - daha güvenli ayarlar
    try {
      response.cookies.set({
        name: 'token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 hafta
        path: '/',
        sameSite: 'lax'  // 'strict' yerine 'lax' kullan
      });
      console.log(`🍪 [Auth] Cookie ayarlandı: token=${token.substring(0, 15)}...`);
    } catch (cookieError) {
      console.error(`❌ [Auth] Cookie ayarlama hatası:`, cookieError);
    }

    console.log(`✅ [Auth] Başarılı giriş: ${email} (${user.role}), yönlendiriliyor: ${redirectUrl}`);
    return response;
  } catch (error) {
    console.error('💥 [Auth] Login hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Bir hata oluştu, lütfen tekrar deneyin' },
      { status: 500 }
    );
  }
} 