import { NextRequest, NextResponse } from "next/server";
import { verifyJwtToken, JWTPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Status } from "@prisma/client";

// GET endpoint for fetching business orders
export async function GET(request: NextRequest) {
  try {
    // Get the authorization token from the request headers
    const token = request.headers.get("authorization")?.split(" ")[1];

    // Check if token exists
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Token required" },
        { status: 401 }
      );
    }

    // Verify the token
    const decodedToken = await verifyJwtToken(token);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    // Check if the user is a business
    if (decodedToken.role !== "BUSINESS") {
      return NextResponse.json(
        { error: "Forbidden: Business access required" },
        { status: 403 }
      );
    }

    // Get the business ID from the user ID
    const business = await prisma.business.findFirst({
      where: {
        userId: decodedToken.userId
      }
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business profile not found" },
        { status: 404 }
      );
    }

    const businessId = business.id;

    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const status = url.searchParams.get("status");

    // Calculate pagination values
    const skip = (page - 1) * limit;

    // Prepare filters
    const filters: any = {
      businessId: businessId,
    };

    // Add status filter if provided
    if (status && status !== "all") {
      filters.status = status as Status;
    }

    // Count total orders for pagination
    const totalOrders = await prisma.order.count({
      where: filters,
    });

    // Fetch orders with relations
    const orders = await prisma.order.findMany({
      where: filters,
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        courier: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalOrders / limit);

    // Return response with properly mapped data to match the frontend
    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.id.substring(0, 8).toUpperCase(), // Generate order number from id
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        estimatedDelivery: order.estimatedDelivery,
        actualDelivery: order.actualDelivery,
        items: order.items,
        totalPrice: order.totalPrice,
        notes: order.notes || "",
        address: order.address,
        customer: {
          id: order.customerId,
          name: order.customer.user.name,
          email: order.customer.user.email,
          phone: order.customer.phone || "",
        },
        courier: order.courier ? {
          id: order.courierId as string,
          name: order.courier.user.name,
          phone: order.courier.phone || "",
        } : null,
      })),
      pagination: {
        total: totalOrders,
        page,
        limit,
        pages: totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching business orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT endpoint for updating order status
export async function PUT(request: NextRequest) {
  try {
    // Get the authorization token from the request headers
    const token = request.headers.get("authorization")?.split(" ")[1];

    // Check if token exists
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Token required" },
        { status: 401 }
      );
    }

    // Verify the token
    const decodedToken = await verifyJwtToken(token);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    // Check if the user is a business
    if (decodedToken.role !== "BUSINESS") {
      return NextResponse.json(
        { error: "Forbidden: Business access required" },
        { status: 403 }
      );
    }

    // Get the business ID from the user ID
    const business = await prisma.business.findFirst({
      where: {
        userId: decodedToken.userId
      }
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business profile not found" },
        { status: 404 }
      );
    }

    const businessId = business.id;

    // Get request body
    const { orderId, status } = await request.json();

    // Validate required fields
    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Bad request: orderId and status are required" },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = Object.values(Status).filter(s => 
      ["PENDING", "PROCESSING", "PREPARING", "READY", "IN_TRANSIT", "DELIVERED", "CANCELLED"].includes(s)
    );
    
    if (!validStatuses.includes(status as Status)) {
      return NextResponse.json(
        { 
          error: "Bad request: Invalid status value",
          validValues: validStatuses
        },
        { status: 400 }
      );
    }

    // Check if order exists and belongs to this business
    const existingOrder = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Not found: Order does not exist" },
        { status: 404 }
      );
    }

    if (existingOrder.businessId !== businessId) {
      return NextResponse.json(
        { error: "Forbidden: You can only update your own orders" },
        { status: 403 }
      );
    }

    // Update the order status
    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: status as Status,
        updatedAt: new Date(),
      },
    });

    // Return response
    return NextResponse.json({
      message: "Order status updated successfully",
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Yeni sipariş oluştur
export async function POST(request: Request) {
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
    if (decodedToken.role !== "BUSINESS") {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok" },
        { status: 403 }
      );
    }

    // Business ID'yi token'dan al
    const userId = decodedToken.userId;

    // Önce işletme bilgilerini bul
    const business = await prisma.business.findFirst({
      where: {
        userId: userId,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "İşletme bulunamadı" },
        { status: 404 }
      );
    }

    const businessId = business.id;

    // Request body'den veri al
    const body = await request.json();
    const { customerId, items, totalPrice, address, notes, latitude, longitude } = body;

    // Zorunlu alanları kontrol et
    if (!customerId) {
      return NextResponse.json(
        { error: "Müşteri ID'si belirtilmedi" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Sipariş öğeleri belirtilmedi veya geçersiz" },
        { status: 400 }
      );
    }

    if (typeof totalPrice !== 'number' || totalPrice <= 0) {
      return NextResponse.json(
        { error: "Geçersiz toplam fiyat" },
        { status: 400 }
      );
    }

    if (!address) {
      return NextResponse.json(
        { error: "Teslimat adresi belirtilmedi" },
        { status: 400 }
      );
    }

    // Müşterinin varlığını kontrol et
    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Müşteri bulunamadı" },
        { status: 404 }
      );
    }

    // Yeni sipariş oluştur
    const newOrder = await prisma.order.create({
      data: {
        status: Status.PENDING,
        totalPrice,
        items,
        address,
        notes,
        latitude,
        longitude,
        businessId,
        customerId,
        estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000), // 30 dakika sonrası
      },
    });

    return NextResponse.json({
      message: "Sipariş başarıyla oluşturuldu",
      order: {
        id: newOrder.id,
        status: newOrder.status,
        createdAt: newOrder.createdAt,
        estimatedDelivery: newOrder.estimatedDelivery,
      },
    });
  } catch (error) {
    console.error("Sipariş oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Sipariş oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
} 