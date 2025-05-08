import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok." },
        { status: 401 }
      );
    }

    // Check if the user is a courier
    if (session.user.role !== "COURIER") {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok." },
        { status: 403 }
      );
    }

    const deliveryId = params.id;

    // In a real app, you would fetch this from a database
    // Example:
    // const delivery = await prisma.delivery.findUnique({
    //   where: { id: deliveryId },
    //   include: {
    //     customer: true,
    //     orderItems: true
    //   }
    // });

    // For now, return mock data
    const mockDelivery = {
      id: deliveryId,
      status: 'IN_TRANSIT',
      assignedAt: new Date().toISOString(),
      estimatedDeliveryTime: new Date(Date.now() + 30 * 60000).toISOString(),
      actualDeliveryTime: null,
      distance: 5.7,
      actualDistance: 0,
      duration: 25,
      actualDuration: 0,
      pickupLocation: {
        address: 'Florya Caddesi No:45, Bakırköy',
        latitude: 40.9762,
        longitude: 28.7866
      },
      dropoffLocation: {
        address: 'Bağdat Caddesi No:123, Kadıköy',
        latitude: 40.9792,
        longitude: 29.0546
      },
      customer: {
        id: 'cust123',
        name: 'Mehmet Demir',
        phone: '+90 555 123 4567'
      },
      orderItems: [
        { id: 'i1', name: 'Pizza Margherita', quantity: 1, price: 150 },
        { id: 'i2', name: 'Cola (1L)', quantity: 2, price: 30 }
      ],
      notes: 'Lütfen kapıda beklemeyin, zili çalın.'
    };

    return NextResponse.json({ delivery: mockDelivery });
  } catch (error) {
    console.error("Error fetching delivery:", error);
    return NextResponse.json(
      { error: "Teslimat yüklenirken bir hata oluştu." },
      { status: 500 }
    );
  }
} 