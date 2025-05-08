import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";

// PATCH /api/deliveries/location - Kurye konum bilgisini günceller
export async function PATCH(request: NextRequest) {
  try {
    // JWT kontrolü
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || !decoded.userId || decoded.role !== "COURIER") {
      return NextResponse.json({ error: "Only couriers can update location" }, { status: 403 });
    }

    // Request body'den konum bilgilerini al
    const body = await request.json();
    const { latitude, longitude } = body;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { error: "Valid latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Koordinat değerlerinin geçerli olduğunu kontrol et
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    // Kurye ID'sini bul
    const courier = await prisma.courier.findFirst({
      where: {
        user: {
          id: decoded.userId
        }
      }
    });

    if (!courier) {
      return NextResponse.json(
        { error: "Courier profile not found" },
        { status: 404 }
      );
    }

    // Kurye konumunu güncelle
    const updatedCourier = await prisma.courier.update({
      where: { id: courier.id },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastLocationUpdate: new Date()
      }
    });

    // Aktif teslimatları bul
    const activeDeliveries = await prisma.delivery.findMany({
      where: {
        courierId: courier.id,
        status: {
          in: ["ASSIGNED", "PICKED_UP"]
        }
      },
      include: {
        zone: {
          select: {
            id: true,
            name: true,
            boundaries: true
          }
        }
      }
    });

    // Bölge kontrolü - Eğer kurye bölge dışına çıktıysa bildirim oluşturulabilir
    const notifications = [];
    for (const delivery of activeDeliveries) {
      if (delivery.zone?.boundaries) {
        const isInZone = checkIfPointInZone(
          { lat: latitude, lng: longitude },
          delivery.zone.boundaries
        );

        if (!isInZone) {
          // Bölge dışı uyarısı oluşturulabilir
          notifications.push({
            type: "ZONE_EXIT_WARNING",
            zoneId: delivery.zone.id,
            zoneName: delivery.zone.name
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      courier: {
        id: updatedCourier.id,
        currentLatitude: updatedCourier.currentLatitude,
        currentLongitude: updatedCourier.currentLongitude,
        lastLocationUpdate: updatedCourier.lastLocationUpdate
      },
      notifications: notifications.length > 0 ? notifications : null
    });
  } catch (error) {
    console.error("Error updating courier location:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Bir noktanın belirli bir bölge içinde olup olmadığını kontrol eden yardımcı fonksiyon
function checkIfPointInZone(point: { lat: number; lng: number }, boundaries: any): boolean {
  // GeoJSON formatındaki sınırları kontrol et
  try {
    if (boundaries.type === "Polygon") {
      return pointInPolygon(point, boundaries.coordinates[0]);
    } else {
      // Diğer GeoJSON tipleri için kontrol eklenebilir (MultiPolygon, vb.)
      return false;
    }
  } catch (error) {
    console.error("Error checking zone boundaries:", error);
    return false;
  }
}

// Ray casting algoritması ile bir noktanın polygon içinde olup olmadığını kontrol eder
function pointInPolygon(point: { lat: number; lng: number }, polygon: number[][]): boolean {
  const x = point.lng;
  const y = point.lat;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }

  return inside;
} 