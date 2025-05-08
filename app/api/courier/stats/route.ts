import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Token doğrulama fonksiyonu
const verifyToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key', (err, decoded) => {
      if (err) return resolve(null);
      resolve(decoded);
    });
  });
};

export async function GET(request: NextRequest) {
  try {
    // Token doğrulama
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Token bulunamadı' },
        { status: 401 }
      );
    }
    
    const decodedToken = await verifyToken(token);
    
    if (!decodedToken || !decodedToken.userId) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Geçersiz token' },
        { status: 401 }
      );
    }
    
    // Kullanıcı kurye mi kontrolü
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      include: { courier: true }
    });
    
    if (!user || user.role !== 'COURIER' || !user.courier) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Kurye erişimi gerekiyor' },
        { status: 403 }
      );
    }
    
    const courierId = user.courier.id;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    
    // Bugünkü teslimatları getir
    const todayDeliveries = await prisma.delivery.count({
      where: {
        courierId: courierId,
        createdAt: {
          gte: startOfDay
        },
        status: 'DELIVERED'
      }
    });
    
    // Toplam teslimatları getir
    const totalDeliveries = await prisma.delivery.count({
      where: {
        courierId: courierId,
        status: 'DELIVERED'
      }
    });
    
    // Kuryenin ortalama puanını hesapla
    const courier = await prisma.courier.findUnique({
      where: { id: courierId }
    });
    
    // Bugünkü kazanç hesaplama
    // Not: Veritabanı modeline göre Order Delivery ile direkt ilişkilendirilmemiş,
    // bu yüzden Order tablosundan courierId üzerinden sorgulama yapıyoruz
    const todayOrders = await prisma.order.findMany({
      where: {
        courierId: courierId,
        status: 'DELIVERED',
        updatedAt: {
          gte: startOfDay
        }
      },
      select: {
        totalPrice: true
      }
    });
    
    const todayEarnings = todayOrders.reduce((total, order) => {
      return total + (order.totalPrice || 0) * 0.1; // %10 kurye payı
    }, 0);
    
    // Formatlanmış yanıt oluştur
    const stats = {
      deliveriesToday: todayDeliveries,
      totalDeliveries: totalDeliveries,
      rating: courier?.ratings || 0,
      earningsToday: `${todayEarnings.toFixed(2)} TL`
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Kurye istatistikleri alınırken hata:', error);
    return NextResponse.json(
      { error: 'Kurye istatistikleri alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
} 