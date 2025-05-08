import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const prisma = new PrismaClient();

const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
  } catch (error) {
    return null;
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = params.id;
  
  // Authorization header kontrolü
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Yetkisiz erişim. Token bulunamadı." },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7); // "Bearer " kısmını çıkart
  const decodedToken = verifyToken(token);
  
  if (!decodedToken) {
    return NextResponse.json(
      { error: "Geçersiz token." },
      { status: 401 }
    );
  }

  try {
    // Kullanıcıyı doğrula
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      include: { customer: true },
    });

    if (!user || !user.customer || user.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Yetkisiz erişim. Müşteri hesabı gereklidir." },
        { status: 403 }
      );
    }

    // Siparişi getir
    const order = await prisma.order.findUnique({
      where: { 
        id: orderId,
        customerId: user.customer.id, // Sadece müşterinin kendi siparişlerini görmesini sağla
      },
      include: {
        items: true,
        business: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            address: true,
          },
        },
        courier: {
          select: {
            id: true,
            phone: true,
            currentLatitude: true,
            currentLongitude: true,
            lastLocationUpdate: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Sipariş bulunamadı veya erişim izniniz yok." },
        { status: 404 }
      );
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error("Sipariş detayları alınırken hata:", error);
    return NextResponse.json(
      { error: "Sipariş detayları alınırken bir hata oluştu." },
      { status: 500 }
    );
  }
} 