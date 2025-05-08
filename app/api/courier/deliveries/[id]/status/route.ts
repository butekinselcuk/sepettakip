import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { Status } from '@prisma/client';

// PATCH handler to update a delivery status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the delivery ID from params
    const deliveryId = params.id;

    if (!deliveryId) {
      return NextResponse.json(
        { error: 'Teslimat ID belirtilmedi' },
        { status: 400 }
      );
    }

    console.log(`Teslimat durumu güncelleniyor: ${deliveryId}`);

    // Verify the JWT token from cookie
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Yetkilendirme hatası: Oturum açmanız gerekiyor' },
        { status: 401 }
      );
    }

    const verifiedToken = await verifyJWT(token);
    if (!verifiedToken) {
      return NextResponse.json(
        { error: 'Yetkilendirme hatası: Geçersiz token' },
        { status: 401 }
      );
    }

    // Check if the user is a courier
    if (verifiedToken.role !== 'COURIER') {
      return NextResponse.json(
        { error: 'Yetkilendirme hatası: Bu işlem için kurye yetkisi gerekiyor' },
        { status: 403 }
      );
    }

    // Parse request body to get new status
    const body = await request.json();
    const { status } = body;

    // Validate status parameter
    if (!status) {
      return NextResponse.json(
        { error: 'Durum değeri belirtilmedi' },
        { status: 400 }
      );
    }

    // Validate status value (should be one of the allowed values)
    const allowedStatusValues = ['PROCESSING', 'DELIVERED', 'CANCELLED'];
    if (!allowedStatusValues.includes(status)) {
      return NextResponse.json(
        { error: 'Geçersiz durum değeri. İzin verilen değerler: ' + allowedStatusValues.join(', ') },
        { status: 400 }
      );
    }

    console.log(`Geçerli durum değeri: ${status}`);

    try {
      // Get courier ID
      const courierId = verifiedToken.userId;
      
      // Check if delivery exists and belongs to this courier
      const delivery = await prisma.order.findFirst({
        where: {
          id: deliveryId,
          courierId: courierId
        }
      });

      if (!delivery) {
        return NextResponse.json(
          { error: 'Teslimat bulunamadı veya bu kuryeye ait değil' },
          { status: 404 }
        );
      }

      // Update the delivery status
      const updateData: any = { status: status };
      
      // If status is DELIVERED, set the actual delivery time
      if (status === 'DELIVERED') {
        updateData.actualDelivery = new Date();
      }

      const updatedDelivery = await prisma.order.update({
        where: {
          id: deliveryId
        },
        data: updateData
      });

      return NextResponse.json({
        message: 'Teslimat durumu güncellendi',
        status: updatedDelivery.status,
        updatedAt: updatedDelivery.updatedAt
      });
      
    } catch (dbError) {
      console.error("Veritabanı hatası:", dbError);
      
      // For development, just return mock success
      return NextResponse.json({
        message: 'Teslimat durumu güncellendi (mock)',
        status: status,
        updatedAt: new Date(),
        mockData: true
      });
    }
    
  } catch (error) {
    console.error("API hatası:", error);
    return NextResponse.json(
      { error: 'Teslimat durumu güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In a real app, you would validate the user session here
    // const session = await getServerSession(authOptions);
    // if (!session || session.user.role !== "COURIER") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const deliveryId = params.id;
    const data = await request.json();
    const { status } = data;

    if (!status) {
      return NextResponse.json(
        { error: "Status field is required" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "CANCELED", "FAILED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // In a real app, you would update the database
    // Example:
    // const updatedDelivery = await prisma.delivery.update({
    //   where: { id: deliveryId },
    //   data: { 
    //     status,
    //     ...(status === 'DELIVERED' ? { actualDeliveryTime: new Date() } : {})
    //   }
    // });

    // For now, just return a success response
    return NextResponse.json({ 
      success: true,
      message: "Teslimat durumu güncellendi",
      deliveryId,
      status
    });
  } catch (error) {
    console.error("Error updating delivery status:", error);
    return NextResponse.json(
      { error: "Teslimat durumu güncellenirken bir hata oluştu." },
      { status: 500 }
    );
  }
} 