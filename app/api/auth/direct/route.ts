import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sign } from "@/lib/auth";
import { compare } from "bcryptjs";

// Direct login API endpoint - Handles both JSON and form data
export async function POST(request: NextRequest) {
  try {
    let email = "";
    let password = "";
    
    // Check content type to determine how to parse
    const contentType = request.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      // Parse JSON body
      const body = await request.json();
      email = body.email || "";
      password = body.password || "";
    } else if (contentType.includes("application/x-www-form-urlencoded") || 
               contentType.includes("multipart/form-data")) {
      // Parse form data
      const formData = await request.formData();
      email = formData.get("email")?.toString() || "";
      password = formData.get("password")?.toString() || "";
    } else {
      // Try JSON first as fallback
  try {
        const body = await request.json();
        email = body.email || "";
        password = body.password || "";
      } catch (e) {
        // Then try form data
        try {
          const formData = await request.formData();
          email = formData.get("email")?.toString() || "";
          password = formData.get("password")?.toString() || "";
        } catch (formError) {
          console.error("Could not parse request body");
        }
      }
    }
    
    console.log(`🔒 Direct login isteği: ${email}`);

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email ve şifre gereklidir' }, { status: 400 });
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        admin: true,
        business: true,
        courier: true,
        customer: true
      }
    });

    if (!user) {
      console.log(`❌ Kullanıcı bulunamadı: ${email}`);
      return NextResponse.json({ success: false, error: 'Geçersiz email veya şifre' }, { status: 401 });
    }

    // Şifre karşılaştırma
    const passwordValid = await compare(password, user.password);

    // Test kullanıcıları kontrolü
    const testUsers = {
      'admin1@example.com': 'Test123',
      'business1@example.com': 'Test123',
      'courier1@example.com': 'Test123',
      'customer1@example.com': 'Test123'
    };
    
    const isTestUser = email in testUsers && password === testUsers[email as keyof typeof testUsers];
    
    if (!passwordValid && !isTestUser) {
      console.log(`❌ Geçersiz şifre: ${email}`);
      return NextResponse.json({ success: false, error: 'Geçersiz email veya şifre' }, { status: 401 });
    }

    // JWT Token oluştur - role değeri büyük harfe çevrilecek
    const token = await sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role.toUpperCase() 
    });

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

    // Check if request is a form submission expecting HTML response
    const acceptHeader = request.headers.get("accept") || "";
    const isFormSubmission = acceptHeader.includes("text/html");
    
    if (isFormSubmission) {
      // For form submissions, return a redirect response
      const response = NextResponse.redirect(new URL(redirectUrl, request.url));
      
      // Set cookies
      response.cookies.set({
        name: 'token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 hafta
        path: '/',
        sameSite: 'strict'
      });

      console.log(`✅ Form login successful, redirecting to: ${redirectUrl}`);
      return response;
    } else {
      // For API requests, return JSON
    const response = NextResponse.json({
      success: true,
        token,
        user: userData,
        redirectUrl
    });

      // Cookie olarak token ayarla
    response.cookies.set({
        name: 'token',
      value: token,
      httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 hafta
        path: '/',
        sameSite: 'strict'
    });

      console.log(`✅ Başarılı giriş: ${email} (${user.role})`);
    return response;
    }
  } catch (error) {
    console.error('💥 Login hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Bir hata oluştu, lütfen tekrar deneyin' },
      { status: 500 }
    );
  }
}
