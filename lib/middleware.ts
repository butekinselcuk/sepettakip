import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtToken } from './auth';

// API rotaları için middleware yol kontrolü
const protectedApiPaths = [
  '/api/admin',
  '/api/business',
  '/api/courier',
  '/api/customer',
];

// Koruma gerektirmeyen API rotaları
const publicApiPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/products', // Ürünleri görmek için auth gerekmez
];

// Test sırasında gerçek auth kontrolü yapılması için özel mod
const ENABLE_TEST_AUTH = process.env.ENABLE_TEST_AUTH === 'true';

/**
 * Middleware işleyicisi
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Gelen isteğin bilgilerini logla
  console.log(`🛡️ Middleware çalışıyor: ${pathname}`, {
    cookies: request.cookies.getAll(),
    url: request.url
  });

  // Test modu kontrolü
  const isTestMode = searchParams.get('test') === 'true' || ENABLE_TEST_AUTH;

  // Development modunda middleware'i atla, ancak test modu aktifse atlama
  if (process.env.NODE_ENV === 'development' && !isTestMode) {
    console.log('🚧 DEV MODU: Tüm erişimlere izin veriliyor!');
    return NextResponse.next();
  }

  // API rotası kontrolü
  if (
    protectedApiPaths.some(apiPath => pathname.startsWith(apiPath)) &&
    !publicApiPaths.some(publicPath => pathname.startsWith(publicPath))
  ) {
    // Token kontrolü
    const token = request.cookies.get('token')?.value ||
                 request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      console.log('🔒 Token bulunamadı, erişim reddedildi');
      return NextResponse.json(
        { error: 'Unauthorized - Token required' },
        { status: 401 }
      );
    }

    try {
      const verifiedToken = await verifyJwtToken(token);
      
      if (!verifiedToken) {
        console.log('🔒 Geçersiz token, erişim reddedildi');
        return NextResponse.json(
          { error: 'Unauthorized - Invalid token' },
          { status: 401 }
        );
      }
      
      // Yetki kontrolleri burada yapılabilir
      // Örneğin admin rotasına sadece adminler erişebilir
      if (pathname.startsWith('/api/admin') && verifiedToken.role !== 'ADMIN') {
        console.log('🔒 Admin yetkisi yok, erişim reddedildi');
        return NextResponse.json(
          { error: 'Forbidden - Admin permission required' },
          { status: 403 }
        );
      }
      
      // Kurye rotasına sadece kuryeler erişebilir
      if (pathname.startsWith('/api/courier') && verifiedToken.role !== 'COURIER') {
        console.log('🔒 Kurye yetkisi yok, erişim reddedildi');
        return NextResponse.json(
          { error: 'Forbidden - Courier permission required' },
          { status: 403 }
        );
      }
      
      // İşletme rotasına sadece işletmeler erişebilir
      if (pathname.startsWith('/api/business') && verifiedToken.role !== 'BUSINESS') {
        console.log('🔒 İşletme yetkisi yok, erişim reddedildi');
        return NextResponse.json(
          { error: 'Forbidden - Business permission required' },
          { status: 403 }
        );
      }
      
      // Müşteri rotasına sadece müşteriler erişebilir
      if (pathname.startsWith('/api/customer') && verifiedToken.role !== 'CUSTOMER') {
        console.log('🔒 Müşteri yetkisi yok, erişim reddedildi');
        return NextResponse.json(
          { error: 'Forbidden - Customer permission required' },
          { status: 403 }
        );
      }
      
    } catch (error) {
      console.error('🔒 Token doğrulama hatası:', error);
      return NextResponse.json(
        { error: 'Unauthorized - Token validation error' },
        { status: 401 }
      );
    }
  }

  // Authenticated sayfalar için kontrol
  if (
    (pathname.startsWith('/admin') ||
    pathname.startsWith('/business') ||
    pathname.startsWith('/courier') ||
    pathname.startsWith('/customer')) && 
    !pathname.startsWith('/auth')
  ) {
    // Token kontrolü
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      // Login sayfasına yönlendir
      const url = new URL('/auth/login', request.url);
      return NextResponse.redirect(url);
    }
    
    try {
      const verifiedToken = await verifyJwtToken(token);
      
      if (!verifiedToken) {
        // Geçersiz token, login sayfasına yönlendir
        const url = new URL('/auth/login', request.url);
        return NextResponse.redirect(url);
      }
      
      // Role-based yönlendirmeler
      if (pathname.startsWith('/admin') && verifiedToken.role !== 'ADMIN') {
        const url = new URL('/auth/login', request.url);
        return NextResponse.redirect(url);
      }
      
      if (pathname.startsWith('/courier') && verifiedToken.role !== 'COURIER') {
        const url = new URL('/auth/login', request.url);
        return NextResponse.redirect(url);
      }
      
      if (pathname.startsWith('/business') && verifiedToken.role !== 'BUSINESS') {
        const url = new URL('/auth/login', request.url);
        return NextResponse.redirect(url);
      }
      
      if (pathname.startsWith('/customer') && verifiedToken.role !== 'CUSTOMER') {
        const url = new URL('/auth/login', request.url);
        return NextResponse.redirect(url);
      }
      
    } catch (error) {
      console.error('Sayfa token doğrulama hatası:', error);
      const url = new URL('/auth/login', request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // API rotaları
    '/api/:path*',
    // Admin, Business, Courier, Customer panel sayfaları
    '/admin/:path*',
    '/business/:path*',
    '/courier/:path*',
    '/customer/:path*',
  ],
}; 