import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// Mock courier data
const MOCK_KURYE_LOCATIONS = [
  {
    id: 'KR001',
    name: 'Ahmet Yılmaz',
    position: [41.0082, 28.9784] as [number, number], // Istanbul
    status: 'active' as const,
    lastUpdate: new Date().toISOString(),
    zone: 'kadikoy',
    currentDelivery: {
      id: 'DEL123',
      address: 'Caferağa Mah. Moda Cad. No: 15, Kadıköy',
      customer: 'Mehmet Demir',
      estimatedArrival: new Date(Date.now() + 15 * 60000).toISOString() // 15 minutes from now
    }
  },
  {
    id: 'KR002',
    name: 'Zeynep Kaya',
    position: [41.0422, 29.0083] as [number, number], // Üsküdar
    status: 'active' as const,
    lastUpdate: new Date().toISOString(),
    zone: 'kadikoy',
    currentDelivery: {
      id: 'DEL124',
      address: 'Acıbadem Mah. Tekin Sok. No: 7, Kadıköy',
      customer: 'Ayşe Yıldız',
      estimatedArrival: new Date(Date.now() + 8 * 60000).toISOString() // 8 minutes from now
    }
  },
  {
    id: 'KR003',
    name: 'Mustafa Demir',
    position: [41.0162, 28.9833] as [number, number], // Beşiktaş
    status: 'idle' as const,
    lastUpdate: new Date().toISOString(),
    zone: 'besiktas',
    currentDelivery: null
  },
  {
    id: 'KR004',
    name: 'Elif Şahin',
    position: [41.0509, 28.9951] as [number, number], // Şişli
    status: 'active' as const,
    lastUpdate: new Date().toISOString(),
    zone: 'sisli',
    currentDelivery: {
      id: 'DEL125',
      address: 'Mecidiyeköy Mah. Büyükdere Cad. No: 56, Şişli',
      customer: 'Ali Öztürk',
      estimatedArrival: new Date(Date.now() + 23 * 60000).toISOString() // 23 minutes from now
    }
  },
  {
    id: 'KR005',
    name: 'Kemal Yıldız',
    position: [41.0051, 28.9770] as [number, number], // Karaköy
    status: 'offline' as const,
    lastUpdate: new Date(Date.now() - 35 * 60000).toISOString(), // 35 minutes ago
    zone: 'besiktas',
    currentDelivery: null
  }
];

// Function to update locations of active couriers
function updateMockLocations() {
  return MOCK_KURYE_LOCATIONS.map(kurye => {
    // Only update active couriers
    if (kurye.status === 'active') {
      // Add small random movement
      const lat = kurye.position[0] + (Math.random() - 0.5) * 0.001;
      const lng = kurye.position[1] + (Math.random() - 0.5) * 0.001;
      
      return {
        ...kurye,
        position: [lat, lng] as [number, number],
        lastUpdate: new Date().toISOString()
      };
    }
    return kurye;
  });
}

// GET /api/kurye/konumlar - Kurye konumlarını al
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const zoneId = url.searchParams.get('zoneId');
    
    // Kuryeleri ve son konum bilgilerini sorgula
    const couriers = await prisma.courier.findMany({
      where: zoneId ? { zoneId } : undefined,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        deliveryLogs: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            latitude: true,
            longitude: true,
            createdAt: true,
          }
        }
      }
    });

    // Konum verileriyle birlikte kuryeler
    const couriersWithLocation = couriers.map(courier => ({
      id: courier.id,
      name: courier.user?.name,
      email: courier.user?.email,
      status: courier.status,
      zoneId: courier.zoneId,
      location: courier.deliveryLogs.length > 0 ? courier.deliveryLogs[0] : null
    }));

    return NextResponse.json(couriersWithLocation);
  } catch (error) {
    console.error('Kurye konumları alınırken hata:', error);
    return NextResponse.json(
      { error: 'Kurye konumları alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST /api/kurye/konumlar - Kurye konumu güncelle
export async function POST(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      );
    }
    
    // Token doğrulama
    const userData = await verifyJWT(token);
    if (!userData || userData.role !== 'COURIER') {
      return NextResponse.json(
        { error: 'Yetkisiz erişim' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { latitude, longitude, deliveryId, status, notes } = body;

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Konum bilgisi gereklidir' },
        { status: 400 }
      );
    }

    // Kurye bilgilerini al
    const courier = await prisma.courier.findFirst({
      where: { userId: userData.id as string }
    });

    if (!courier) {
      return NextResponse.json(
        { error: 'Kurye bulunamadı' },
        { status: 404 }
      );
    }

    // Konum güncellemesini kaydet
    const deliveryLog = await prisma.deliveryLog.create({
      data: {
        courierId: courier.id,
        deliveryId: deliveryId || '',
        status: status || 'ACTIVE',
        latitude,
        longitude,
        notes
      }
    });

    // Teslimat varsa durumunu güncelle
    if (deliveryId && status) {
      await prisma.delivery.update({
        where: { id: deliveryId },
        data: { status }
      });
    }

    return NextResponse.json({
      message: 'Konum başarıyla güncellendi',
      log: deliveryLog
    });
  } catch (error) {
    console.error('Konum güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Konum güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 