import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

// JWP payload için tip tanımı
interface JWTPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'BUSINESS' | 'CUSTOMER' | 'COURIER';
  iat?: number;
  exp?: number;
}

// Varsayılan JWT anahtarı (sadece geliştirme ortamında kullanılmalı)
const DEFAULT_JWT_SECRET = '3a82c5a4c69f45b3a3fb62e6ebdc6ea4982c5a4c69f45b3a3fb62e6ebdc6ea4';

// Korunacak rotalar - bunlar için kimlik doğrulama gerekiyor
const protectedRoutes = [
  '/admin',
  '/api/admin',
  '/business',
  '/api/business',
  '/courier',
  '/api/courier',
  '/customer',
  '/api/customer',
  '/profile'
];

// Public rotalar - herkes erişebilir
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/reset-password',
  '/auth/verify-email',
  '/api/auth'
];

// Rol bazlı erişim kontrolleri
const roleBasedAccess: Record<string, string[]> = {
  'ADMIN': ['/admin', '/api/admin'],
  'BUSINESS': ['/business', '/api/business'],
  'COURIER': ['/courier', '/api/courier'],
  'CUSTOMER': ['/customer', '/api/customer'],
};

// JWT token doğrulama
const verifyJwtToken = async (token: string): Promise<JWTPayload | null> => {
  // JWT_SECRET veya varsayılan anahtarı kullan
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  
  if (!secret) {
    console.error("JWT_SECRET is not available (neither environment variable nor default)");
    return null;
  }

  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, secretKey);
    
    // Type check the payload before returning
    if (typeof payload.userId !== 'string' || 
        typeof payload.email !== 'string' || 
        !['ADMIN', 'BUSINESS', 'CUSTOMER', 'COURIER'].includes(payload.role as string)) {
      console.error("JWT payload has invalid structure:", payload);
      return null;
    }
    
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as 'ADMIN' | 'BUSINESS' | 'CUSTOMER' | 'COURIER',
      iat: payload.iat,
      exp: payload.exp
    };
  } catch (error) {
    console.error("Error verifying JWT:", error);
    return null;
  }
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  console.log(`Middleware checking path: ${path}`);
  
  // API route için auth header kontrolü veya cookie kontrolü
  let token: string | undefined;
  
  // Try to get token from header (API routes)
  if (path.startsWith('/api')) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  // If no token in header, try cookie (always check cookies as fallback)
  if (!token) {
    token = request.cookies.get('token')?.value;
  }

  // Path public ise kontrol etmeden geçiş izni ver
  if (publicRoutes.some(route => path.startsWith(route))) {
    console.log(`Access granted to public route: ${path}`);
    return NextResponse.next();
  }

  // Path korunmuyor ise izin ver
  if (!protectedRoutes.some(route => path.startsWith(route))) {
    console.log(`Access granted to unprotected route: ${path}`);
    return NextResponse.next();
  }

  // Token yoksa login'e yönlendir
  if (!token) {
    console.log(`No token found for protected route: ${path}`);
    if (path.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekiyor' }, 
        { status: 401 }
      );
    }
    
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(url);
  }

  // Token doğrula
  const payload = await verifyJwtToken(token);
  if (!payload) {
    console.log(`Invalid token for protected route: ${path}`);
    if (path.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş token' }, 
        { status: 401 }
      );
    }
    
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(url);
  }

  // Rol bazlı erişim kontrolü
  const userRole = payload.role;
  const allowedPaths = roleBasedAccess[userRole] || [];
  
  // Admin her yere erişebilir
  if (userRole === 'ADMIN') {
    console.log(`Admin access granted to: ${path}`);
    return NextResponse.next();
  }
  
  // Kullanıcı rolüne uygun olmayan bir rotaya erişmeye çalışıyorsa
  if (!allowedPaths.some(route => path.startsWith(route)) && !path.startsWith('/profile')) {
    console.log(`Role-based access denied for ${userRole} to ${path}`);
    if (path.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Bu kaynağa erişim yetkiniz yok' }, 
        { status: 403 }
      );
    }

    // Kullanıcıyı kendi rolüne uygun ana sayfaya yönlendir
    let redirectPath = '/auth/login';
    if (userRole === 'BUSINESS') redirectPath = '/business/dashboard';
    else if (userRole === 'COURIER') redirectPath = '/courier/dashboard';
    else if (userRole === 'CUSTOMER') redirectPath = '/customer/dashboard';
    
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  console.log(`Access granted for ${userRole} to ${path}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Tüm sayfalar (statik dosyalar ve favicon hariç)
    '/((?!_next/static|_next/image|favicon.ico|public/|assets/).*)',
  ],
}; 