import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";

// GET /api/users/settings - Kullanıcı ayarlarını getirir
export async function GET(request: NextRequest) {
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

    // Kullanıcının ayarlarını getir
    const userSettings = await prisma.userSettings.findUnique({
      where: {
        userId: decoded.userId
      }
    });

    // Ayarlar bulunamazsa, varsayılan ayarları döndür
    if (!userSettings) {
      const defaultSettings = {
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        preferences: {
          language: 'tr',
          darkMode: false,
          timeZone: 'Europe/Istanbul'
        },
        privacy: {
          shareLocation: true,
          shareActivity: false
        }
      };

      return NextResponse.json({ settings: defaultSettings });
    }

    return NextResponse.json({ settings: userSettings.settings });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT /api/users/settings - Kullanıcı ayarlarını günceller
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

    // Request body'den yeni ayarları al
    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        { error: "Settings object is required" },
        { status: 400 }
      );
    }

    // Kullanıcının mevcut ayarlarını kontrol et
    const existingSettings = await prisma.userSettings.findUnique({
      where: {
        userId: decoded.userId
      }
    });

    let updatedSettings;

    if (existingSettings) {
      // Mevcut ayarları güncelle
      updatedSettings = await prisma.userSettings.update({
        where: {
          userId: decoded.userId
        },
        data: {
          settings: settings
        }
      });
    } else {
      // Yeni ayar kaydı oluştur
      updatedSettings = await prisma.userSettings.create({
        data: {
          userId: decoded.userId,
          settings: settings
        }
      });
    }

    return NextResponse.json({
      success: true,
      settings: updatedSettings.settings
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 