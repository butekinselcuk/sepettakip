import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenData } from "@/lib/auth";

// PUT: Kurye bildirim ayarlarını güncelle
export async function PUT(request: NextRequest) {
  try {
    // Token ile kullanıcı verilerini al
    const tokenData = await getTokenData(request);
    
    if (!tokenData || !tokenData.userId) {
      return NextResponse.json(
        { error: "Yetkisiz erişim" },
        { status: 401 }
      );
    }
    
    // Gelen verileri al
    const body = await request.json();
    const { 
      receiveNotifications,
      emailNotifications,
      pushNotifications,
      smsNotifications,
      newDeliveryAlert
    } = body;
    
    // Kullanıcının kurye olup olmadığını kontrol et
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: { 
        id: true,
        role: true,
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }
    
    if (user.role !== "COURIER") {
      return NextResponse.json(
        { error: "Bu işlem sadece kuryeler tarafından yapılabilir" },
        { status: 403 }
      );
    }
    
    // Kullanıcı ayarlarını getir veya oluştur
    let userSettings = await prisma.userSettings.findUnique({
      where: { userId: user.id }
    });
    
    if (userSettings) {
      // Ayarları güncelle
      userSettings = await prisma.userSettings.update({
        where: { userId: user.id },
        data: {
          receiveNotifications,
          emailNotifications,
          pushNotifications,
          smsNotifications,
          newDeliveryAlert
        }
      });
    } else {
      // Yeni ayarlar oluştur
      userSettings = await prisma.userSettings.create({
        data: {
          userId: user.id,
          receiveNotifications,
          emailNotifications,
          pushNotifications,
          smsNotifications,
          newDeliveryAlert
        }
      });
    }
    
    return NextResponse.json({
      message: "Bildirim ayarları başarıyla güncellendi",
      settings: userSettings
    });
  } catch (error) {
    console.error("Bildirim ayarları güncellenirken hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası", message: error instanceof Error ? error.message : "Bilinmeyen hata" },
      { status: 500 }
    );
  }
}

// GET: Kurye bildirim ayarlarını getir
export async function GET(request: NextRequest) {
  try {
    // Token ile kullanıcı verilerini al
    const tokenData = await getTokenData(request);
    
    if (!tokenData || !tokenData.userId) {
      return NextResponse.json(
        { error: "Yetkisiz erişim" },
        { status: 401 }
      );
    }
    
    // Kullanıcının kurye olup olmadığını kontrol et
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: { 
        id: true,
        role: true,
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }
    
    if (user.role !== "COURIER") {
      return NextResponse.json(
        { error: "Bu işlem sadece kuryeler tarafından yapılabilir" },
        { status: 403 }
      );
    }
    
    // Kullanıcı ayarlarını getir
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: user.id }
    });
    
    if (!userSettings) {
      // Varsayılan ayarları döndür
      return NextResponse.json({
        settings: {
          receiveNotifications: true,
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          newDeliveryAlert: true
        }
      });
    }
    
    return NextResponse.json({
      settings: userSettings
    });
  } catch (error) {
    console.error("Bildirim ayarları getirilirken hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası", message: error instanceof Error ? error.message : "Bilinmeyen hata" },
      { status: 500 }
    );
  }
} 