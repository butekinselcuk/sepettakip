import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;
    
    if (!requestId) {
      return NextResponse.json(
        { message: "İptal talebi kimliği gereklidir" },
        { status: 400 }
      );
    }
    
    // Token ve yetki kontrolü
    const token = await getToken({ req });
    
    if (!token) {
      return NextResponse.json(
        { message: "Yetkilendirme hatası: Token bulunamadı" },
        { status: 401 }
      );
    }
    
    if (token.role !== "BUSINESS" && token.role !== "BUSINESS_STAFF") {
      return NextResponse.json(
        { message: "Yetkilendirme hatası: Bu işlem için yetkiniz bulunmamaktadır" },
        { status: 403 }
      );
    }
    
    const businessId = token.businessId as string;
    
    if (!businessId) {
      return NextResponse.json(
        { message: "Geçersiz işletme kimliği" },
        { status: 400 }
      );
    }
    
    // İptal talebini kontrol et ve işletmeye ait olduğunu doğrula
    const existingRequest = await prisma.cancellationRequest.findUnique({
      where: { id: requestId },
      include: {
        order: {
          select: {
            businessId: true,
            id: true,
            status: true,
            customer: {
              select: {
                id: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    if (!existingRequest) {
      return NextResponse.json(
        { message: "İptal talebi bulunamadı" },
        { status: 404 }
      );
    }
    
    if (existingRequest.order.businessId !== businessId) {
      return NextResponse.json(
        { message: "Bu iptal talebini görüntüleme yetkiniz bulunmamaktadır" },
        { status: 403 }
      );
    }
    
    if (existingRequest.status !== "PENDING") {
      return NextResponse.json(
        { message: "Sadece bekleyen talepler güncellenebilir" },
        { status: 400 }
      );
    }
    
    // İstek verilerini al
    const body = await req.json();
    const { status, businessNotes, cancellationFee } = body;
    
    // Status kontrol et
    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { message: "Geçersiz durum değeri, APPROVED veya REJECTED olmalıdır" },
        { status: 400 }
      );
    }
    
    // İptal ücretini kontrol et
    if (cancellationFee !== undefined && (isNaN(cancellationFee) || cancellationFee < 0)) {
      return NextResponse.json(
        { message: "İptal ücreti geçerli bir sayı olmalıdır" },
        { status: 400 }
      );
    }
    
    // Güncellenecek verileri hazırla
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    if (businessNotes !== undefined) {
      updateData.businessNotes = businessNotes;
    }
    
    if (cancellationFee !== undefined) {
      updateData.cancellationFee = cancellationFee;
    }
    
    // İptal talebini güncelle
    const updatedRequest = await prisma.cancellationRequest.update({
      where: { id: requestId },
      data: updateData
    });
    
    // Eğer talep onaylandıysa, siparişin durumunu güncelle
    if (status === "APPROVED") {
      await prisma.order.update({
        where: { id: existingRequest.order.id },
        data: { status: "CANCELLED" }
      });
      
      // Bildirim oluştur - Müşteriye iptal onayı
      await prisma.notification.create({
        data: {
          userId: existingRequest.order.customer.id,
          type: "ORDER_CANCELLATION_APPROVED",
          title: "İptal Talebiniz Onaylandı",
          content: `#${existingRequest.order.id} numaralı siparişinizin iptal talebi onaylandı.`,
          isRead: false,
          metadata: {
            orderId: existingRequest.order.id
          }
        }
      });
    } else if (status === "REJECTED") {
      // Bildirim oluştur - Müşteriye iptal reddi
      await prisma.notification.create({
        data: {
          userId: existingRequest.order.customer.id,
          type: "ORDER_CANCELLATION_REJECTED",
          title: "İptal Talebiniz Reddedildi",
          content: `#${existingRequest.order.id} numaralı siparişinizin iptal talebi reddedildi.`,
          isRead: false,
          metadata: {
            orderId: existingRequest.order.id,
            cancellationFee: cancellationFee || 0
          }
        }
      });
    }
    
    return NextResponse.json(updatedRequest);
    
  } catch (error) {
    console.error("İptal talebi güncellenirken hata:", error);
    return NextResponse.json(
      { message: "İptal talebi güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 