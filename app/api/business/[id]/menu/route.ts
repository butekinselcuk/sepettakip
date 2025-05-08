import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { verifyJwtToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication token is required' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify and decode token
    const decoded = await verifyJwtToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log("API: /api/business/[id]/menu çağrıldı", { businessId: params.id, userId: decoded.userId, userRole: decoded.role });

    const businessId = params.id;

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    // Demo için mock menü verileri
    const mockMenuItems = [
      { id: '1', name: "Adana Kebap", description: "Acılı kıyma kebabı", price: 80, category: "Kebaplar", isAvailable: true, imageUrl: "/images/adana.jpg", businessId },
      { id: '2', name: "Urfa Kebap", description: "Acısız kıyma kebabı", price: 75, category: "Kebaplar", isAvailable: true, imageUrl: "/images/urfa.jpg", businessId },
      { id: '3', name: "Tavuk Şiş", description: "Marine edilmiş tavuk şiş", price: 65, category: "Kebaplar", isAvailable: true, imageUrl: "/images/tavuk-sis.jpg", businessId },
      { id: '4', name: "Karışık Izgara", description: "Adana, şiş kebap ve kanat karışık porsiyon", price: 120, category: "Izgaralar", isAvailable: true, imageUrl: "/images/karisik.jpg", businessId },
      { id: '5', name: "Lahmacun", description: "İnce hamur üzerinde kıymalı açık pide", price: 25, category: "Pideler", isAvailable: true, imageUrl: "/images/lahmacun.jpg", businessId },
      { id: '6', name: "Kaşarlı Pide", description: "Kaşar peynirli pide", price: 45, category: "Pideler", isAvailable: true, imageUrl: "/images/kasarli-pide.jpg", businessId },
      { id: '7', name: "Ayran", description: "Geleneksel Türk yoğurt içeceği", price: 10, category: "İçecekler", isAvailable: true, imageUrl: "/images/ayran.jpg", businessId },
      { id: '8', name: "Şalgam", description: "Ekşi şalgam suyu", price: 10, category: "İçecekler", isAvailable: true, imageUrl: "/images/salgam.jpg", businessId },
      { id: '9', name: "Künefe", description: "Kadayıf hamurundan yapılan peynirli tatlı", price: 60, category: "Tatlılar", isAvailable: true, imageUrl: "/images/kunefe.jpg", businessId },
      { id: '10', name: "Baklava", description: "Fıstıklı baklava (4 dilim)", price: 70, category: "Tatlılar", isAvailable: true, imageUrl: "/images/baklava.jpg", businessId }
    ];

    if (!business) {
      console.log("İşletme bulunamadı, mock menü döndürülüyor:", businessId);
      return NextResponse.json(mockMenuItems);
    }

    // Get menu items for the business
    try {
      const menuItems = await prisma.menuItem.findMany({
        where: { 
          businessId: businessId,
          isAvailable: true
        },
        orderBy: {
          category: 'asc'
        }
      });

      // For development/demo, if no menu items, return mock data
      if (menuItems.length === 0) {
        console.log("İşletme için menü öğesi bulunamadı, mock menü döndürülüyor:", businessId);
        return NextResponse.json(mockMenuItems);
      }

      return NextResponse.json(menuItems);
    } catch (error) {
      console.error("Menü öğeleri getirilirken hata:", error);
      console.log("Hata nedeniyle mock menü döndürülüyor");
      return NextResponse.json(mockMenuItems);
    }
  } catch (error: any) {
    console.error('Error in GET /api/business/[id]/menu:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
} 