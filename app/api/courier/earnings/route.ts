import { NextResponse } from "next/server";
import { verifyJwtToken } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";

export async function GET(request: Request) {
  try {
    // JWT token'ı doğrula
    const token = request.headers.get("authorization")?.split(" ")[1];
    
    if (!token) {
      return NextResponse.json(
        { error: "Yetkilendirme token'ı eksik" },
        { status: 401 }
      );
    }

    const decodedToken = await verifyJwtToken(token);
    
    if (!decodedToken) {
      return NextResponse.json(
        { error: "Geçersiz token" },
        { status: 401 }
      );
    }

    // Kullanıcının rolünü kontrol et
    if (decodedToken.role !== "COURIER") {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok" },
        { status: 403 }
      );
    }

    const courierId = decodedToken.userId;

    // Kuryenin profil bilgilerini getir
    const courier = await prisma.user.findUnique({
      where: {
        id: courierId,
        role: "COURIER",
      },
      include: {
        courier: true,
      },
    });

    if (!courier) {
      return NextResponse.json(
        { error: "Kurye bulunamadı" },
        { status: 404 }
      );
    }

    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Bugünkü teslimatlar ve kazanç
    const todayDeliveries = await prisma.delivery.findMany({
      where: {
        courierId: courierId,
        deliveredAt: {
          gte: startOfToday,
        },
        status: "DELIVERED",
      },
    });

    const todayEarnings = todayDeliveries.reduce(
      (total, delivery) => total + (delivery.courierFee || 0),
      0
    );

    // Haftalık teslimatlar ve kazanç
    const weeklyDeliveries = await prisma.delivery.findMany({
      where: {
        courierId: courierId,
        deliveredAt: {
          gte: startOfWeek,
        },
        status: "DELIVERED",
      },
    });

    const weeklyEarnings = weeklyDeliveries.reduce(
      (total, delivery) => total + (delivery.courierFee || 0),
      0
    );

    // Aylık teslimatlar ve kazanç
    const monthlyDeliveries = await prisma.delivery.findMany({
      where: {
        courierId: courierId,
        deliveredAt: {
          gte: startOfMonth,
        },
        status: "DELIVERED",
      },
    });

    const monthlyEarnings = monthlyDeliveries.reduce(
      (total, delivery) => total + (delivery.courierFee || 0),
      0
    );

    // Tüm kazanç
    const allDeliveries = await prisma.delivery.findMany({
      where: {
        courierId: courierId,
        status: "DELIVERED",
      },
    });

    const totalEarnings = allDeliveries.reduce(
      (total, delivery) => total + (delivery.courierFee || 0),
      0
    );

    // Ödeme geçmişi
    const payments = await prisma.payment.findMany({
      where: {
        recipientId: courierId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    // Son ödeme bilgisi
    const lastPayment = payments.length > 0 ? payments[0] : null;

    // API yanıtı
    return NextResponse.json({
      summary: {
        totalEarnings,
        todayEarnings,
        weeklyEarnings,
        monthlyEarnings,
        pendingPayment: totalEarnings - payments.reduce((total, payment) => total + payment.amount, 0),
        lastPaymentDate: lastPayment ? lastPayment.createdAt : null,
        lastPaymentAmount: lastPayment ? lastPayment.amount : 0,
      },
      payments: payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        date: payment.createdAt,
        method: payment.method,
        reference: payment.reference,
      })),
    });
  } catch (error) {
    console.error("Kurye kazanç bilgileri getirme hatası:", error);
    return NextResponse.json(
      { error: "Kazanç bilgileri alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
} 