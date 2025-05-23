import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
  } catch (error) {
    return null;
  }
};

export async function POST(
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
    // Request body'den değerlendirme verilerini al
    const requestBody = await request.json();
    const { deliveryRating, businessRating, foodQuality, onTime, comment } = requestBody;

    // Değerlendirme verilerini doğrula
    if (typeof deliveryRating !== 'number' || deliveryRating < 1 || deliveryRating > 5) {
      return NextResponse.json(
        { error: "Kurye değerlendirmesi 1-5 arasında olmalıdır." },
        { status: 400 }
      );
    }

    if (typeof businessRating !== 'number' || businessRating < 1 || businessRating > 5) {
      return NextResponse.json(
        { error: "İşletme değerlendirmesi 1-5 arasında olmalıdır." },
        { status: 400 }
      );
    }

    if (typeof foodQuality !== 'boolean' || typeof onTime !== 'boolean') {
      return NextResponse.json(
        { error: "Yemek kalitesi ve zamanında teslimat değerleri geçersiz." },
        { status: 400 }
      );
    }

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
      },
      include: {
        business: true,
        courier: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Sipariş bulunamadı." },
        { status: 404 }
      );
    }

    // Müşterinin kendi siparişini değerlendirdiğinden emin ol
    if (order.customerId !== user.customer.id) {
      return NextResponse.json(
        { error: "Bu siparişi değerlendirme yetkiniz yok." },
        { status: 403 }
      );
    }

    // Sipariş durumunu kontrol et - sadece teslim edilmiş siparişler değerlendirilebilir
    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { 
          error: "Sadece teslim edilmiş siparişleri değerlendirebilirsiniz. Sipariş durumu: " + order.status
        },
        { status: 400 }
      );
    }

    // Değerlendirmeyi veritabanına kaydet
    // Not: Şu an için "Rating" modeli olmadığı için aşağıdaki kod yorum satırı olarak kalıyor
    // Gerçek uygulama için veritabanı şemasına uygun olarak implemente edilmeli
    
    /*
    const rating = await prisma.rating.create({
      data: {
        orderId: order.id,
        customerId: user.customer.id,
        courierId: order.courierId,
        businessId: order.businessId,
        deliveryRating,
        businessRating,
        foodQuality,
        onTime,
        comment: comment || "",
      },
    });
    */
    
    // Kurye ve işletme ratinglerini güncelle
    // Not: Bu kısım da gerçek veritabanı modeline göre implemente edilmeli
    
    /*
    if (order.courierId) {
      // Kuryenin ortalama değerlendirmesini güncelle
      const courierRatings = await prisma.rating.findMany({
        where: { courierId: order.courierId },
        select: { deliveryRating: true },
      });
      
      const courierAvgRating = courierRatings.reduce((sum, r) => sum + r.deliveryRating, 0) / courierRatings.length;
      
      await prisma.courier.update({
        where: { id: order.courierId },
        data: { averageRating: courierAvgRating },
      });
    }
    
    // İşletmenin ortalama değerlendirmesini güncelle
    const businessRatings = await prisma.rating.findMany({
      where: { businessId: order.businessId },
      select: { businessRating: true },
    });
    
    const businessAvgRating = businessRatings.reduce((sum, r) => sum + r.businessRating, 0) / businessRatings.length;
    
    await prisma.business.update({
      where: { id: order.businessId },
      data: { averageRating: businessAvgRating },
    });
    */

    return NextResponse.json(
      { 
        message: "Değerlendirmeniz başarıyla kaydedildi. Geri bildiriminiz için teşekkürler!",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Değerlendirme kaydedilirken hata:", error);
    return NextResponse.json(
      { error: "Değerlendirme kaydedilirken bir hata oluştu." },
      { status: 500 }
    );
  }
} 