import { NextResponse } from "next/server";
import prisma from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';

// GET - Kurye profil bilgilerini al
export async function GET(request: Request) {
  try {
    // Token doğrulama
    const token = request.headers.get('Authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' },
        { status: 401 }
      );
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Geçersiz oturum. Lütfen tekrar giriş yapın.' },
        { status: 401 }
      );
    }

    // Kullanıcıyı ve kurye bilgilerini bul
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { 
        courier: true 
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı.' },
        { status: 404 }
      );
    }

    // Sadece kuryelerin erişimine izin ver
    if (user.role !== 'COURIER' || !user.courier) {
      return NextResponse.json(
        { error: 'Bu işlem için yetkiniz bulunmamaktadır veya kurye kaydınız bulunmamaktadır.' },
        { status: 403 }
      );
    }

    // Kullanıcı ve kurye bilgilerini döndür
    return NextResponse.json({
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        courier: {
          id: user.courier.id,
          phone: user.courier.phone,
          latitude: user.courier.latitude,
          longitude: user.courier.longitude,
          isActive: user.courier.isActive,
          vehicleType: user.courier.vehicleType,
          status: user.courier.status,
          availabilityStatus: user.courier.availabilityStatus,
          currentLatitude: user.courier.currentLatitude,
          currentLongitude: user.courier.currentLongitude,
          documentsVerified: user.courier.documentsVerified
        }
      }
    });
  } catch (error) {
    console.error('Kurye profili alınırken hata oluştu:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' },
      { status: 500 }
    );
  }
}

// PATCH - Kurye profil bilgilerini güncelle
export async function PATCH(request: Request) {
  try {
    // Token doğrulama
    const token = request.headers.get('Authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' },
        { status: 401 }
      );
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Geçersiz oturum. Lütfen tekrar giriş yapın.' },
        { status: 401 }
      );
    }

    // Request body'den profil bilgilerini al
    const data = await request.json();
    
    // Kullanıcıyı ve kurye bilgilerini bul
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { 
        courier: true 
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı.' },
        { status: 404 }
      );
    }

    // Sadece kuryelerin erişimine izin ver
    if (user.role !== 'COURIER' || !user.courier) {
      return NextResponse.json(
        { error: 'Bu işlem için yetkiniz bulunmamaktadır veya kurye kaydınız bulunmamaktadır.' },
        { status: 403 }
      );
    }

    // Güncellenecek kullanıcı alanlarını belirle
    const userUpdateData: Record<string, any> = {};
    if (data.name) userUpdateData.name = data.name;
    // Şifre değişikliği farklı bir endpoint üzerinden yapılacak

    // Güncellenecek kurye alanlarını belirle
    const courierUpdateData: Record<string, any> = {};
    if (data.phone) courierUpdateData.phone = data.phone;
    if (data.vehicleType) courierUpdateData.vehicleType = data.vehicleType;
    if (data.currentLatitude !== undefined) courierUpdateData.currentLatitude = data.currentLatitude;
    if (data.currentLongitude !== undefined) courierUpdateData.currentLongitude = data.currentLongitude;
    if (data.availabilityStatus) courierUpdateData.availabilityStatus = data.availabilityStatus;

    // Kullanıcı bilgilerini güncelle
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: userUpdateData,
      include: { courier: true }
    });

    // Kurye bilgilerini güncelle
    if (Object.keys(courierUpdateData).length > 0) {
      await prisma.courier.update({
        where: { id: user.courier.id },
        data: courierUpdateData
      });
    }

    // Güncel profil bilgilerini almak için tekrar sorgu yap
    const updatedProfile = await prisma.user.findUnique({
      where: { id: user.id },
      include: { courier: true }
    });

    return NextResponse.json({
      success: true,
      message: 'Profil başarıyla güncellendi',
      profile: {
        id: updatedProfile?.id,
        email: updatedProfile?.email,
        name: updatedProfile?.name,
        role: updatedProfile?.role,
        courier: updatedProfile?.courier
      }
    });
  } catch (error) {
    console.error('Kurye profili güncellenirken hata oluştu:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' },
      { status: 500 }
    );
  }
} 