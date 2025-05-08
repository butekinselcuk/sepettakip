import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { Status } from '@prisma/client';

// Define an interface for delivery types
interface DeliveryData {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedDelivery: Date;
  actualDelivery?: Date | null;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  businessName: string;
  items: any[];
  totalPrice: number;
  estimatedDuration: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  completedAt?: Date | null;
}

// GET: Kurye teslimatlarını getir
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

    const decodedToken = await verifyJWT(token);
    
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

    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Filtreleme koşullarını oluştur
    const where: any = {
      courierId: courierId,
    };

    // Durum filtresi
    if (status) {
      where.status = status;
    }

    // Tarih filtresi
    if (startDate && endDate) {
      where.assignedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.assignedAt = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.assignedAt = {
        lte: new Date(endDate),
      };
    }

    // Teslimatları getir
    const deliveries = await prisma.delivery.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
      include: {
        customer: {
          include: {
            user: true
          }
        }
      },
    });

    // Toplam teslimat sayısını getir
    const totalDeliveries = await prisma.delivery.count({
      where,
    });

    // Yanıtı formatla
    const formattedDeliveries = deliveries.map((delivery) => ({
      id: delivery.id,
      status: delivery.status,
      assignedAt: delivery.assignedAt || delivery.createdAt,
      estimatedDeliveryTime: delivery.estimatedArrival,
      actualDeliveryTime: delivery.deliveredAt,
      distance: delivery.distance || 0,
      actualDistance: delivery.actualDistance || 0,
      duration: delivery.duration || 0,
      actualDuration: delivery.actualDuration || 0,
      pickupLocation: {
        // Teslimat noktası bilgileri - İleride gerçek veri ile değiştirilecek
        address: "Teslimat Noktası",
        latitude: 0,
        longitude: 0,
      },
      dropoffLocation: {
        address: delivery.customer?.address || "",
        latitude: delivery.customer?.latitude || 0,
        longitude: delivery.customer?.longitude || 0,
      },
      customer: {
        id: delivery.customer?.id || "",
        name: delivery.customer?.user?.name || "",
        phone: delivery.customer?.phone || "",
      },
    }));

    return NextResponse.json({
      deliveries: formattedDeliveries,
      pagination: {
        total: totalDeliveries,
        page,
        limit,
        pages: Math.ceil(totalDeliveries / limit),
      },
    });
  } catch (error) {
    console.error("Teslimat verileri getirme hatası:", error);
    return NextResponse.json(
      { error: "Teslimat verileri alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// PUT: Teslimat durumunu güncelle
export async function PUT(request: Request) {
  try {
    // JWT token'ı doğrula
    const token = request.headers.get("authorization")?.split(" ")[1];
    
    if (!token) {
      return NextResponse.json(
        { error: "Yetkilendirme token'ı eksik" },
        { status: 401 }
      );
    }

    const decodedToken = await verifyJWT(token);
    
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
    
    // URL ve request body'den veri al
    const { searchParams } = new URL(request.url);
    const deliveryId = searchParams.get("id");
    
    if (!deliveryId) {
      return NextResponse.json(
        { error: "Teslimat ID'si belirtilmedi" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    if (!body.status) {
      return NextResponse.json(
        { error: "Teslimat durumu belirtilmedi" },
        { status: 400 }
      );
    }

    // Geçerli teslimat durumlarını kontrol et
    const validStatuses = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "FAILED"];
    
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "Geçersiz teslimat durumu" },
        { status: 400 }
      );
    }

    // Teslimatın mevcut durumunu kontrol et
    const existingDelivery = await prisma.delivery.findUnique({
      where: {
        id: deliveryId,
      },
    });

    if (!existingDelivery) {
      return NextResponse.json(
        { error: "Teslimat bulunamadı" },
        { status: 404 }
      );
    }

    if (existingDelivery.courierId !== courierId) {
      return NextResponse.json(
        { error: "Bu teslimatı güncelleme yetkiniz yok" },
        { status: 403 }
      );
    }

    // Duruma göre ek veri hazırla
    const updateData: any = {
      status: body.status,
    };

    // Teslimat tamamlandıysa teslim tarihini ekle
    if (body.status === "DELIVERED") {
      updateData.deliveredAt = new Date();
    }

    // Teslimatı güncelle
    const updatedDelivery = await prisma.delivery.update({
      where: {
        id: deliveryId,
      },
      data: updateData,
    });

    // Yanıtı formatla
    return NextResponse.json({
      message: "Teslimat durumu güncellendi",
      delivery: {
        id: updatedDelivery.id,
        status: updatedDelivery.status,
        deliveredAt: updatedDelivery.deliveredAt,
      },
    });
  } catch (error) {
    console.error("Teslimat güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Teslimat güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Tahmini teslimat süresini dakika cinsinden hesapla
function calculateDuration(startDate: Date, endDate: Date | null): number {
  if (!endDate) return 0;
  
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diffMs = end - start;
  
  // Dakika cinsinden döndür
  return Math.round(diffMs / (1000 * 60));
} 