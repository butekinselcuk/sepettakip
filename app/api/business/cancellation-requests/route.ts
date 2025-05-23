import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  try {
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
    
    // URL parametrelerinden filtre seçeneklerini al
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    // Temel sorgu filtresi
    const where: any = {
      order: {
        businessId
      }
    };
    
    // Status filtresi ekle
    if (status && status !== "ALL") {
      where.status = status;
    }
    
    // Tarih aralığı filtresi ekle
    if (startDate || endDate) {
      where.createdAt = {};
      
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }
    
    // İptal taleplerini getir
    const cancellationRequests = await prisma.cancellationRequest.findMany({
      where,
      include: {
        order: {
          include: {
            items: true,
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    
    return NextResponse.json(cancellationRequests);
    
  } catch (error) {
    console.error("İptal talepleri getirilirken hata:", error);
    return NextResponse.json(
      { message: "İptal talepleri getirilirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 