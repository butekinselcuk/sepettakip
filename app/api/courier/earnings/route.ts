import { NextResponse } from "next/server";
import { verifyJwtToken } from "@/lib/auth";
import prisma from "@/app/lib/prisma";

// Tip tanımları
interface WeeklyStat {
  day: string;
  amount: number;
}

interface Payment {
  id: number;
  date: string;
  amount: number;
  status: string;
}

interface EarningsResponse {
  totalEarnings: number;
  pendingPayments: number;
  weeklyStats: WeeklyStat[];
  monthlyTotal: number;
  deliveryCount: number;
  bonuses: number;
  lastPayments: Payment[];
}

export async function GET(request: Request) {
  try {
    // Token doğrulama işlemi
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz token' },
        { status: 401 }
      );
    }

    // Kullanıcının rolünü kontrol et
    if (decoded.role !== "COURIER") {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok" },
        { status: 403 }
      );
    }

    const courierId = decoded.userId;

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

    // Örnek veri - gerçek uygulamada veritabanından çekilecek
    const mockEarnings: EarningsResponse = {
      totalEarnings: totalEarnings,
      pendingPayments: totalEarnings - payments.reduce((total, payment) => total + payment.amount, 0),
      weeklyStats: [
        { day: 'Pazartesi', amount: weeklyEarnings },
        { day: 'Salı', amount: weeklyEarnings },
        { day: 'Çarşamba', amount: weeklyEarnings },
        { day: 'Perşembe', amount: weeklyEarnings },
        { day: 'Cuma', amount: weeklyEarnings },
        { day: 'Cumartesi', amount: weeklyEarnings },
        { day: 'Pazar', amount: weeklyEarnings }
      ],
      monthlyTotal: monthlyEarnings,
      deliveryCount: allDeliveries.length,
      bonuses: 0,
      lastPayments: payments.map(payment => ({
        id: payment.id,
        date: payment.createdAt.toISOString().split('T')[0],
        amount: payment.amount,
        status: payment.status,
      })),
    };

    return NextResponse.json({ success: true, data: mockEarnings });
  } catch (error) {
    console.error('Kazanç bilgileri alınamadı:', error);
    return NextResponse.json(
      { success: false, error: 'Kazanç bilgileri alınamadı' },
      { status: 500 }
    );
  }
} 