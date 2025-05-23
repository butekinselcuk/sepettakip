import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken, getTokenData } from "@/lib/auth";

// GET /api/users/me - Giriş yapmış kullanıcının bilgilerini getirir
export async function GET(request: NextRequest) {
  try {
    // JWT kontrolü - authorization header veya cookie'den token al
    let tokenPayload = await getTokenData(request);
    
    if (!tokenPayload) {
      // Alternatif olarak manuel token kontrolü
      const authHeader = request.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ") 
        ? authHeader.substring(7) 
        : request.cookies.get('token')?.value;
      
      if (token) {
        tokenPayload = await verifyJwtToken(token);
      }
    }

    if (!tokenPayload) {
      return NextResponse.json({ error: "Yetkisiz erişim", message: "Token bulunamadı" }, { status: 401 });
    }

    // userId değerini al (token formatında userId veya id olabilir)
    const userId = tokenPayload.userId || tokenPayload.id;
    
    if (!userId) {
      return NextResponse.json({ error: "Geçersiz token", message: "Token içinde kullanıcı ID'si bulunamadı" }, { status: 401 });
    }

    // Kullanıcı bilgilerini getir
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        admin: tokenPayload.role === "ADMIN",
        business: tokenPayload.role === "BUSINESS",
        courier: tokenPayload.role === "COURIER",
        customer: tokenPayload.role === "CUSTOMER"
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı", message: `ID: ${userId} ile kullanıcı bulunamadı` }, { status: 404 });
    }

    // Şifreyi kesinlikle gönderme
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Kullanıcı bilgileri alınırken hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası", message: error instanceof Error ? error.message : "Bilinmeyen hata" },
      { status: 500 }
    );
  }
} 