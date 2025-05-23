import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";
import { Role } from "@prisma/client";

// GET /api/businesses/subscriptions
// İşletmeye ait mevcut abonelikler ve kullanılabilir planlar
export async function GET(request: NextRequest) {
  try {
    // Kimlik doğrulama
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { error: "Yetkilendirme gerekli" },
        { status: 401 }
      );
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Geçersiz token" },
        { status: 401 }
      );
    }
    
    // Kullanıcı kontrolü
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { business: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    // Rol kontrolü
    if (user.role !== Role.BUSINESS) {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz bulunmamaktadır" },
        { status: 403 }
      );
    }

    if (!user.business) {
      return NextResponse.json(
        { error: "İşletme bilgisi bulunamadı" },
        { status: 404 }
      );
    }

    // İşletme abonelikleri - burada prisma client'ın tip tanımlaması güncel değil
    const businessSubscriptions = await prisma.$queryRaw`
      SELECT s.*, p.*
      FROM subscriptions s
      LEFT JOIN subscription_plans p ON s.plan_id = p.id
      LEFT JOIN recurring_payments rp ON rp.subscription_id = s.id
      WHERE s.business_id = ${user.business.id}
      ORDER BY s.created_at DESC
    `;

    // Kullanılabilir abonelik planları
    const availablePlans = await prisma.$queryRaw`
      SELECT *
      FROM subscription_plans
      WHERE (business_id = ${user.business.id} OR business_id IS NULL)
      AND is_active = true
    `;

    return NextResponse.json({
      subscriptions: businessSubscriptions,
      availablePlans: availablePlans,
    });

  } catch (error) {
    console.error("Abonelik bilgileri alınırken hata oluştu:", error);
    return NextResponse.json(
      { error: "Abonelik bilgileri alınamadı" },
      { status: 500 }
    );
  }
}

// POST /api/businesses/subscriptions
// Yeni abonelik oluşturma
export async function POST(request: NextRequest) {
  try {
    // Kimlik doğrulama
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { error: "Yetkilendirme gerekli" },
        { status: 401 }
      );
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Geçersiz token" },
        { status: 401 }
      );
    }
    
    // Kullanıcı kontrolü
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { business: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    // Rol kontrolü
    if (user.role !== Role.BUSINESS) {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz bulunmamaktadır" },
        { status: 403 }
      );
    }

    if (!user.business) {
      return NextResponse.json(
        { error: "İşletme bilgisi bulunamadı" },
        { status: 404 }
      );
    }

    // İstek verilerini al
    const body = await request.json();
    const { planId, paymentMethodId } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "Abonelik planı seçilmelidir" },
        { status: 400 }
      );
    }

    // Abonelik planını kontrol et
    const plan = await prisma.$queryRaw`
      SELECT * FROM subscription_plans WHERE id = ${planId} AND is_active = true
    `;

    if (!plan || Array.isArray(plan) && plan.length === 0) {
      return NextResponse.json(
        { error: "Geçersiz veya aktif olmayan abonelik planı" },
        { status: 400 }
      );
    }

    const planData = Array.isArray(plan) ? plan[0] : plan;

    // Ödeme yöntemini kontrol et
    let savedPaymentMethod = null;
    if (paymentMethodId) {
      const paymentMethodResult = await prisma.$queryRaw`
        SELECT * FROM saved_payment_methods WHERE id = ${paymentMethodId}
      `;
      
      if (!paymentMethodResult || Array.isArray(paymentMethodResult) && paymentMethodResult.length === 0) {
        return NextResponse.json(
          { error: "Geçersiz ödeme yöntemi" },
          { status: 400 }
        );
      }
      
      savedPaymentMethod = Array.isArray(paymentMethodResult) ? paymentMethodResult[0] : paymentMethodResult;
    }

    // Abonelik dönem süresini hesapla
    const startDate = new Date();
    const currentPeriodEnd = new Date(startDate);
    
    // Periyot hesaplama
    const interval = planData.interval || 'MONTHLY';
    const intervalCount = planData.interval_count || 1;
    
    switch (interval) {
      case 'DAILY':
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + intervalCount);
        break;
      case 'WEEKLY':
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + (7 * intervalCount));
        break;
      case 'MONTHLY':
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + intervalCount);
        break;
      case 'QUARTERLY':
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + (3 * intervalCount));
        break;
      case 'YEARLY':
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + intervalCount);
        break;
      default:
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    }

    // Deneme süresi kontrolü
    let trialEndDate = null;
    if (planData.trial_period_days && planData.trial_period_days > 0) {
      trialEndDate = new Date(startDate);
      trialEndDate.setDate(trialEndDate.getDate() + planData.trial_period_days);
    }

    // Raw SQL ile abonelik oluştur
    const businessId = user.business.id;
    const customerId = user.business.userId;
    // SubscriptionStatus.TRIAL yerine sabit değer kullanıyorum
    const status = trialEndDate ? 'TRIAL' : 'ACTIVE';
    
    // İşlem başlat
    const newSubscription = await prisma.$transaction(async (tx) => {
      // 1. Abonelik oluştur
      const subscriptionResult = await tx.$executeRaw`
        INSERT INTO subscriptions (
          id, customer_id, business_id, plan_id, status, 
          start_date, current_period_start, current_period_end, 
          trial_end_date, next_billing_date, saved_payment_method_id, 
          auto_renew, created_at, updated_at
        ) VALUES (
          uuid_generate_v4(), ${customerId}, ${businessId}, ${planId}, ${status},
          ${startDate}, ${startDate}, ${currentPeriodEnd},
          ${trialEndDate}, ${trialEndDate || currentPeriodEnd}, ${paymentMethodId || null},
          true, NOW(), NOW()
        )
        RETURNING *
      `;
      
      // Yeni oluşturulan abonelik ID'sini al
      const subResult = await tx.$queryRaw`
        SELECT * FROM subscriptions 
        WHERE business_id = ${businessId} 
        ORDER BY created_at DESC LIMIT 1
      `;
      
      const newSub = Array.isArray(subResult) ? subResult[0] : subResult;
      
      // 2. Eğer deneme süresi yoksa ya da ön ödeme gerekiyorsa ödeme oluştur
      if (!trialEndDate || body.payNow) {
        await tx.$executeRaw`
          INSERT INTO recurring_payments (
            id, subscription_id, amount, currency, status,
            scheduled_date, saved_payment_method_id, created_at, updated_at
          ) VALUES (
            uuid_generate_v4(), ${newSub.id}, ${planData.price}, ${planData.currency || 'TRY'}, 'PENDING',
            NOW(), ${paymentMethodId || null}, NOW(), NOW()
          )
        `;
      }
      
      return newSub;
    });

    return NextResponse.json({
      message: "Abonelik başarıyla oluşturuldu",
      subscription: newSubscription,
    });

  } catch (error) {
    console.error("Abonelik oluşturulurken hata:", error);
    return NextResponse.json(
      { error: "Abonelik oluşturulamadı" },
      { status: 500 }
    );
  }
} 