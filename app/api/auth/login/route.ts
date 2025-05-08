import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcrypt';
import { signJwtToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// POST /api/auth/login - Kullanıcı girişi
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    console.log("Login attempt:", email);

    // Temel validasyon
    if (!email || !password) {
      return NextResponse.json({ message: 'E-posta ve şifre gereklidir' }, { status: 400 });
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log("User not found:", email);
      
      // Geliştirme için test hesapları
      if (process.env.NODE_ENV === 'development') {
        console.log("Development mode: checking test accounts");
        // Test hesapları
        if (email === 'admin@example.com' && password === 'Test123') {
          console.log("Creating mock ADMIN user");
          return createMockUserResponse('ADMIN', email);
        } else if (email === 'business@example.com' && password === 'Test123') {
          console.log("Creating mock BUSINESS user");
          return createMockUserResponse('BUSINESS', email);
        } else if (email === 'courier@example.com' && password === 'Test123') {
          console.log("Creating mock COURIER user");
          return createMockUserResponse('COURIER', email);
        } else if (email === 'customer@example.com' && password === 'Test123') {
          console.log("Creating mock CUSTOMER user");
          return createMockUserResponse('CUSTOMER', email);
        }
      }
      
      return NextResponse.json({ message: 'Geçersiz giriş bilgileri' }, { status: 401 });
    }

    // Şifre kontrolü - geliştirici modunda veya doğru şifre
    let isValidPassword = false;
    
    // Geliştirici modu için Test123 şifresini kabul et
    if (process.env.NODE_ENV === 'development' && password === 'Test123') {
      isValidPassword = true;
      console.log("Development mode password accepted");
    } else {
      // Normal şifre karşılaştırması
      isValidPassword = await bcrypt.compare(password, user.password);
    }

    if (!isValidPassword) {
      console.log("Password mismatch for:", email);
      return NextResponse.json({ message: 'Geçersiz giriş bilgileri' }, { status: 401 });
    }

    // JWT token oluştur
    const token = await signJwtToken({ 
      userId: user.id,
      email: user.email,
      role: user.role
    });
    
    console.log("Login successful:", email, "Role:", user.role);

    // Kullanıcı bilgilerini döndür (şifre hariç)
    const { password: _, ...userData } = user;
    
    // Response'a cookie ekle
    const response = NextResponse.json({
      message: 'Giriş başarılı',
      user: userData,
      token
    });
    
    // Token'ı cookie olarak ayarla
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 gün
      sameSite: 'lax'
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Giriş sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Geliştirme ortamı için test kullanıcıları
async function createMockUserResponse(role: 'ADMIN' | 'BUSINESS' | 'COURIER' | 'CUSTOMER', email: string) {
  const mockName = `Test ${role} User`;
  const userId = `mock-${role.toLowerCase()}-${Date.now()}`;
  
  console.log(`Creating mock ${role} user with ID: ${userId}`);
  
  // Test kullanıcısı için JWT token oluştur
  const token = await signJwtToken({
    userId,
    email,
    role
  });
  
  const userData = {
    id: userId,
    email,
    name: mockName,
    role,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  console.log("Mock user data:", userData);
  
  // Response hazırla
  const response = NextResponse.json({
    message: 'Giriş başarılı (test kullanıcısı)',
    user: userData,
    token
  });
  
  // Cookie ekle
  response.cookies.set({
    name: 'token',
    value: token,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 gün 
    sameSite: 'lax'
  });
  
  return response;
} 