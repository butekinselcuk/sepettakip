import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";
import { Status } from "@prisma/client";

// PUT /api/orders/status - Sipariş durumunu günceller
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

    // Request body'den sipariş ID ve durum bilgisini al
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Order ID and status are required" },
        { status: 400 }
      );
    }

    // Status değerinin geçerli olduğunu kontrol et
    if (!Object.values(Status).includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Siparişin var olduğunu kontrol et
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        business: {
          include: {
            user: {
              select: {
                id: true
              }
            }
          }
        },
        courier: {
          include: {
            user: {
              select: {
                id: true
              }
            }
          }
        },
        customer: {
          include: {
            user: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Yetkilendirme kontrolü: Admin veya ilgili kullanıcı olmalı
    const isAdmin = decoded.role === "ADMIN";
    const isBusiness = decoded.role === "BUSINESS" && existingOrder.business?.user?.id === decoded.userId;
    const isCourier = decoded.role === "COURIER" && existingOrder.courier?.user?.id === decoded.userId;
    const isCustomer = decoded.role === "CUSTOMER" && existingOrder.customer?.user?.id === decoded.userId;

    // Roller bazında yetki kontrolü
    if (!isAdmin && !isBusiness && !isCourier && !isCustomer) {
      return NextResponse.json(
        { error: "You don't have permission to update this order status" },
        { status: 403 }
      );
    }

    // Bazı durumlar sadece belirli roller tarafından güncellenebilir
    if (status === Status.PROCESSING || status === Status.PREPARING || status === Status.READY) {
      if (!isAdmin && !isBusiness) {
        return NextResponse.json(
          { error: "Only business or admin can update to this status" },
          { status: 403 }
        );
      }
    }

    if (status === Status.IN_TRANSIT || status === Status.DELIVERED) {
      if (!isAdmin && !isCourier) {
        return NextResponse.json(
          { error: "Only courier or admin can update to this status" },
          { status: 403 }
        );
      }
    }

    if (status === Status.CANCELLED) {
      if (!isAdmin && !isBusiness && !isCustomer) {
        return NextResponse.json(
          { error: "Only business, customer or admin can cancel an order" },
          { status: 403 }
        );
      }
    }

    // Sipariş durumunu güncelle
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status as Status,
        updatedAt: new Date()
      },
      include: {
        business: {
          select: {
            name: true
          }
        },
        customer: {
          select: {
            address: true
          }
        },
        courier: {
          select: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Bildirim oluşturulabilir (isteğe bağlı)
    // ...

    return NextResponse.json({
      message: "Order status updated successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 