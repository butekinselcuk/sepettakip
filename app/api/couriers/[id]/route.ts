import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";

// GET /api/couriers/:id - Kurye detayını getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Params'tan id değerini al (await ile)
    const id = await params.id;
    
    // JWT kontrolü
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || !["ADMIN"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Kurye bilgilerini getir
    const courier = await prisma.courier.findUnique({
      where: { id },
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

    if (!courier) {
      return NextResponse.json(
        { error: "Courier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ courier });
  } catch (error) {
    console.error("Error fetching courier:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH /api/couriers/:id - Kurye bilgilerini güncelle
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Params'tan id değerini al (await ile)
    const id = await params.id;
    
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
    const { vehicleType, phone, status } = body;

    // Kuryenin var olduğunu kontrol et
    const existingCourier = await prisma.courier.findUnique({
      where: { id },
    });

    if (!existingCourier) {
      return NextResponse.json(
        { error: "Courier not found" },
        { status: 404 }
      );
    }

    // Kurye bilgilerini güncelle
    const updatedCourier = await prisma.courier.update({
      where: { id },
      data: {
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

    return NextResponse.json({ courier: updatedCourier });
  } catch (error) {
    console.error("Error updating courier:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 