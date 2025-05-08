import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Bu rotaları herkes erişebilir (kamuya açık)
const publicRoutes = ['/auth/login', '/auth/register', '/auth/reset-password', '/auth/verify-email'];

// Rol bazlı sayfa erişim tanımları
const roleBasedRoutes: Record<string, string[]> = {
  admin: ['/admin'],
  business: ['/business'],
  courier: ['/courier'],
  customer: ['/customer'],
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Eğer public bir rota ise, doğruca erişime izin ver
  if (publicRoutes.some(route => path.startsWith(route))) {
    return NextResponse.next();
  }
  
  // JWT token al (eğer varsa)
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  // Oturum yoksa login sayfasına yönlendir
  if (!token) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }
  
  // Kullanıcı rolü
  const userRole = token.role as string;
  
  // Ana sayfa kontrolü - rol tanımlı ana sayfaya yönlendir
  if (path === '/') {
    let redirectPath = '/auth/login';
    if (userRole === 'admin') redirectPath = '/admin/dashboard';
    else if (userRole === 'business') redirectPath = '/business/dashboard';
    else if (userRole === 'courier') redirectPath = '/courier/dashboard';
    else if (userRole === 'customer') redirectPath = '/customer/track-order';
    
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }
  
  // Eğer kullanıcı kendi rolüne ait olmayan bir sayfaya erişmeye çalışıyorsa
  const isAccessAllowed = Object.keys(roleBasedRoutes).some(role => {
    if (role !== userRole && roleBasedRoutes[role].some((route: string) => path.startsWith(route))) {
      return false; // Başka bir role ait sayfaya erişim engellendi
    }
    return true; // Kendi rolüne ait sayfaya erişim izni var
  });
  
  if (!isAccessAllowed) {
    // Yetkisiz erişim durumunda kullanıcının kendi dashboard'una yönlendir
    let redirectPath = '/auth/login';
    if (userRole === 'admin') redirectPath = '/admin/dashboard';
    else if (userRole === 'business') redirectPath = '/business/dashboard';
    else if (userRole === 'courier') redirectPath = '/courier/dashboard';
    else if (userRole === 'customer') redirectPath = '/customer/track-order';
    
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }
  
  return NextResponse.next();
}

// Bu middleware hangi sayfalara uygulanacak
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets|.*\\.ico).*)',
  ],
}; 