import { NextRequest, NextResponse } from "next/server";
import { verify, JWTPayload } from './lib/auth';

// Yetkilendirme gerektiren URL modelleri
const authRequiredPathPatterns = [
  '/admin',
  '/business',
  '/courier',
  '/customer',
  '/api/admin',
  '/api/business',
  '/api/courier',
  '/api/customer',
  '/api/protected',
];

// Yetkilendirme gerektirmeyen API URL'leri
const publicApiPathPatterns = [
  '/api/auth/login',
  '/api/auth/direct',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/validate',
  '/api/auth/test-login',  // Test-Login endpoint eklendi
  '/api/public',
  '/api/health',
];

// Kullanıcılar için URL tablosu
const roleToHomeMapping = {
  'ADMIN': '/admin/dashboard',
  'BUSINESS': '/business/dashboard',
  'COURIER': '/courier/dashboard',
  'CUSTOMER': '/customer/dashboard',
};

const roleToApiPathMapping = {
  'ADMIN': ['/api/admin/', '/api/protected/'],
  'BUSINESS': ['/api/business/', '/api/protected/'],
  'COURIER': ['/api/courier/', '/api/protected/'],
  'CUSTOMER': ['/api/customer/', '/api/protected/'],
};

// Rol bazlı endpoint izinleri - daha ayrıntılı RBAC için
const rolePermissions = {
  'ADMIN': [
    '/api/admin/*',
    '/api/protected/*',
    '/api/reports/*',
    '/api/analytics/*',
  ],
  'BUSINESS': [
    '/api/business/*',
    '/api/protected/*',
    '/api/reports/business/*',
  ],
  'COURIER': [
    '/api/courier/*',
    '/api/protected/*',
    '/api/deliveries/courier/*',
  ],
  'CUSTOMER': [
    '/api/customer/*',
    '/api/protected/*',
    '/api/orders/customer/*',
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`🔒 [Middleware] Verifying access to: ${pathname}`);

  // Yetkilendirme gerektirmeyen sayfalar - doğrudan izin ver
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/auth/') ||
    pathname === '/'
  ) {
    console.log(`✅ [Middleware] Public path, allowing access: ${pathname}`);
    return NextResponse.next();
  }

  // Public API istekleri - doğrudan izin ver
  for (const pattern of publicApiPathPatterns) {
    if (pathname.startsWith(pattern)) {
      console.log(`✅ [Middleware] Public API, allowing access: ${pathname}`);
      return NextResponse.next();
    }
  }

  // Şimdi yetkilendirme gerekip gerekmediğini kontrol et
  let requiresAuth = false;
  let requiredRole = null;

  // Hangi rol için yetkilendirme gerekiyor?
  for (const pattern of authRequiredPathPatterns) {
    if (pathname.startsWith(pattern)) {
      requiresAuth = true;
      
      // URL'den rol tespiti (/admin -> ADMIN, /business -> BUSINESS)
      if (pattern === '/admin' || pattern === '/api/admin') {
        requiredRole = 'ADMIN';
      } else if (pattern === '/business' || pattern === '/api/business') {
        requiredRole = 'BUSINESS';
      } else if (pattern === '/courier' || pattern === '/api/courier') {
        requiredRole = 'COURIER';
      } else if (pattern === '/customer' || pattern === '/api/customer') {
        requiredRole = 'CUSTOMER';
      }
      
      console.log(`🔐 [Middleware] Auth required for ${pathname}, role: ${requiredRole}`);
      break;
    }
  }

  // Eğer yetkilendirme gerektiren bir sayfa değilse, devam et
  if (!requiresAuth) {
    console.log(`✅ [Middleware] No auth required, allowing access: ${pathname}`);
    return NextResponse.next();
  }

  // Token'ı al
  const token = request.cookies.get('token')?.value;
  
  // Token yoksa login sayfasına yönlendir
  if (!token) {
    console.log("❌ [Middleware] No token found, redirecting to login page");
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callback', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Token formatını kontrol et
    if (typeof token !== 'string' || token.trim() === '') {
      console.error("❌ [Middleware] Invalid token format: Empty or not a string");
      throw new Error("Invalid token format");
    }

    // Konsola token bilgisini kısaltılmış göster
    console.log(`🔑 [Middleware] Verifying token: ${token.substring(0, 15)}...`);

    // Token doğrulama
    const decodedToken = await verify(token);
    
    // Role'ü büyük harfe çevirerek standartlaştır
    const userRole = decodedToken.role ? decodedToken.role.toUpperCase() : null;
    
    console.log(`👤 [Middleware] User decoded from token:`, {
      id: decodedToken.userId,
      email: decodedToken.email,
      role: userRole
    });

    // API isteği mi?
    if (pathname.startsWith('/api/')) {
      // Rol bazlı API erişimi kontrolü
      const allowedPaths = roleToApiPathMapping[userRole as keyof typeof roleToApiPathMapping] || [];
      const hasAccess = allowedPaths.some(path => pathname.startsWith(path));
      
      if (!hasAccess) {
        console.log(`❌ [Middleware] API access denied: ${userRole} user cannot access ${pathname}`);
        return NextResponse.json(
          { error: 'Bu API\'ye erişim yetkiniz yok', status: 'forbidden' },
          { status: 403 }
        );
      }
      
      // API erişimine izin ver
      console.log(`✅ [Middleware] API access granted for ${userRole} to ${pathname}`);
      
      // Request headers'a kullanıcı bilgilerini ekle
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decodedToken.userId);
      requestHeaders.set('x-user-email', decodedToken.email);
      requestHeaders.set('x-user-role', userRole || '');
      
      // Modified request ile devam et
      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      
      // API yanıtı için header'a CORS izni ekle
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
      
      return response;
    }
    
    // Sayfa istekleri için rol kontrolü
    if (requiredRole && userRole !== requiredRole) {
      console.log(`⚠️ [Middleware] Role mismatch: User is ${userRole}, trying to access ${requiredRole} page`);
      
      // Kullanıcıyı kendi rolüne uygun ana sayfaya yönlendir
      const homeUrl = roleToHomeMapping[userRole as keyof typeof roleToHomeMapping];
      if (homeUrl) {
        console.log(`🔄 [Middleware] Redirecting to appropriate home: ${homeUrl}`);
        const redirectUrl = new URL(homeUrl, request.url);
        return NextResponse.redirect(redirectUrl);
      } else {
        console.log(`⚠️ [Middleware] No home mapping for role: ${userRole}, redirecting to root`);
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    // Bu noktada, doğru roldeki kullanıcıya izin ver
    console.log(`✅ [Middleware] Access granted: ${userRole} to ${pathname}`);
    
    // Kullanıcı bilgilerini header'a ekle
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decodedToken.userId);
    requestHeaders.set('x-user-email', decodedToken.email);
    requestHeaders.set('x-user-role', userRole || '');
    
    // Modified request ile devam et
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error("❌ [Middleware] Token verification error:", error);
    
    // Hata detaylarını logla
    try {
      if (token) {
        console.error(`❌ [Middleware] Token that failed: ${token.substring(0, 15)}...`);
        
        // JWT formatını kontrol et
        const parts = token.split('.');
        if (parts.length !== 3) {
          console.error(`❌ [Middleware] Invalid JWT format: expected 3 parts, got ${parts.length}`);
        } else {
          try {
            const header = JSON.parse(atob(parts[0]));
            console.error(`❌ [Middleware] JWT header:`, header);
          } catch (e) {
            console.error(`❌ [Middleware] Failed to parse JWT header:`, e);
          }
        }
      }
    } catch (loggingError) {
      console.error(`❌ [Middleware] Error during token error logging:`, loggingError);
    }
    
    // Token hatası, login sayfasına yönlendir
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('error', 'token_invalid');
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 