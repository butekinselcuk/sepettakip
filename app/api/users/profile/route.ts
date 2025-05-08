import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";

// PUT /api/users/profile - Kullanıcı profil bilgilerini günceller
export async function PUT(request: NextRequest) {
  try {
    // JWT kontrolü
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Request body'den profil bilgilerini al
    const body = await request.json();
    const { name, email, ...profileData } = body;

    // Temel kullanıcı bilgilerini güncelle
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        name: name,
        email: email
      }
    });

    // Rol bazlı profil güncellemesi
    let roleProfile = null;

    switch (decoded.role) {
      case "ADMIN":
        // Admin profili güncelleme işlemleri (gerekiyorsa)
        break;

      case "BUSINESS":
        // İşletme profili güncelleme
        if (profileData.business) {
          roleProfile = await prisma.business.update({
            where: { userId: decoded.userId },
            data: {
              name: profileData.business.name,
              phone: profileData.business.phone,
              address: profileData.business.address,
              description: profileData.business.description,
              website: profileData.business.website,
              // Not: category ve rating alanları şemada olmayabilir
            }
          });
        }
        break;

      case "COURIER":
        // Kurye profili güncelleme
        if (profileData.courier) {
          roleProfile = await prisma.courier.update({
            where: { userId: decoded.userId },
            data: {
              phone: profileData.courier.phone,
              vehicleType: profileData.courier.vehicleType,
              isAvailable: profileData.courier.isAvailable
            }
          });
        }
        break;

      case "CUSTOMER":
        // Müşteri profili güncelleme
        if (profileData.customer) {
          roleProfile = await prisma.customer.update({
            where: { userId: decoded.userId },
            data: {
              address: profileData.customer.address,
              phone: profileData.customer.phone
            }
          });
        }
        break;
    }

    return NextResponse.json({
      user: updatedUser,
      profile: roleProfile
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 