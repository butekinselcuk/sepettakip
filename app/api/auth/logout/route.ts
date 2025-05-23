import { NextRequest, NextResponse } from 'next/server';
import { signOut } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Çıkış isteği alındı');
    
    // Çıkış işlemi - token cookie'sini temizle
    const response = NextResponse.json({ 
      success: true, 
      message: 'Başarıyla çıkış yapıldı' 
    });
    
    // Token cookie'sini temizle
    signOut(response);
    
    // Tüm auth ile ilgili cookie'leri temizle
    const cookiesToClear = [
      "token",
      "next-auth.session-token",
      "next-auth.callback-url",
      "next-auth.csrf-token",
      "__Secure-next-auth.session-token",
      "__Secure-next-auth.callback-url",
      "__Secure-next-auth.csrf-token",
      ".next-auth.session-token",
      ".next-auth.callback-url",
      ".next-auth.csrf-token",
      "next-auth.session-token.0",
      "next-auth.session-token.1",
      "user-token",
      "auth-state",
      "sid"
    ];
    
    for (const cookie of cookiesToClear) {
      response.cookies.set({
        name: cookie,
        value: "",
        expires: new Date(0),
        path: "/",
      });
    }
    
    // Headers'da CORS ve cache control ayarlamaları
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    console.log('🔐 Çıkış işlemi tamamlandı, tüm cookie\'ler temizlendi');
    
    return response;
  } catch (error) {
    console.error('Çıkış yaparken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Çıkış işlemi sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('🔐 GET isteği ile çıkış yapılıyor');
  
  // POST işlemiyle aynı işlevselliği sağla
  const response = NextResponse.redirect(new URL('/auth/login', request.url));
  
  // Token cookie'sini temizle
  signOut(response);
  
  // Tüm auth ile ilgili cookie'leri temizle
  const cookiesToClear = [
    "token",
    "next-auth.session-token",
    "next-auth.callback-url",
    "next-auth.csrf-token",
    "__Secure-next-auth.session-token",
    "__Secure-next-auth.callback-url",
    "__Secure-next-auth.csrf-token",
    ".next-auth.session-token",
    ".next-auth.callback-url",
    ".next-auth.csrf-token",
    "next-auth.session-token.0",
    "next-auth.session-token.1",
    "user-token",
    "auth-state",
    "sid"
  ];
  
  for (const cookie of cookiesToClear) {
    response.cookies.set({
      name: cookie,
      value: "",
      expires: new Date(0),
      path: "/",
    });
  }
  
  // Headers'da cache control ayarlamaları
  response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  console.log('🔐 Çıkış işlemi tamamlandı ve login sayfasına yönlendiriliyor');
  
  return response;
} 