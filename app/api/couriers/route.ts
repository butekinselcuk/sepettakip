import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";

// GET /api/couriers - Tüm kuryeleri listele
export async function GET(request: NextRequest) {
  try {
    // JWT kontrolü
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || !["ADMIN"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // URL parametrelerini al
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    // Sayfalama için hesaplamalar
    const skip = (page - 1) * limit;

    // Filtreleme koşullarını hazırla
    const where: any = {};

    // Arama filtresi
    if (search) {
      where.OR = [
        {
          user: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    // Status filtresi
    if (status) {
      where.status = status;
    }

    // Toplam kurye sayısını al
    const totalItems = await prisma.courier.count({
      where,
    });

    // Kuryeleri getir
    const couriers = await prisma.courier.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    // Sayfalama bilgisini hesapla
    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      couriers,
      pagination: {
        totalItems,
        itemsPerPage: limit,
        currentPage: page,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching couriers:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/couriers - Yeni kurye oluştur
export async function POST(request: NextRequest) {
  try {
    // JWT kontrolü
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || !["ADMIN"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, vehicleType, phone, status = "ACTIVE" } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Kullanıcının var olduğunu ve henüz bir kurye kaydının olmadığını kontrol et
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { courier: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (existingUser.courier) {
      return NextResponse.json(
        { error: "This user already has a courier profile" },
        { status: 400 }
      );
    }

    if (existingUser.role !== "COURIER") {
      return NextResponse.json(
        { error: "Only users with COURIER role can be added as couriers" },
        { status: 400 }
      );
    }

    // Yeni kurye oluştur
    const courier = await prisma.courier.create({
      data: {
        userId,
        vehicleType,
        phone,
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(courier);
  } catch (error) {
    console.error("Error creating courier:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 