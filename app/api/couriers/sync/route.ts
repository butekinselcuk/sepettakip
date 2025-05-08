import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";

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

    // COURIER rolüne sahip ama courier tablosunda kaydı olmayan kullanıcıları bul
    const usersWithCourierRole = await prisma.user.findMany({
      where: {
        role: "COURIER",
        courier: null // Henüz courier kaydı olmayanlar
      }
    });

    if (usersWithCourierRole.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users found that need synchronization",
        createdProfiles: 0
      });
    }

    // Her bir kullanıcı için courier profilini oluştur
    const createdProfiles = [];
    for (const user of usersWithCourierRole) {
      const courier = await prisma.courier.create({
        data: {
          userId: user.id,
          status: "ACTIVE",
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
      createdProfiles.push(courier);
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdProfiles.length} courier profiles`,
      createdProfiles: createdProfiles.length,
      data: createdProfiles
    });
  } catch (error) {
    console.error("Error syncing courier profiles:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 