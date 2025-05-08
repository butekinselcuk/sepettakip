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

    console.log("API: /api/business/[id] çağrıldı", { businessId: params.id, userId: decoded.userId, userRole: decoded.role });

    const businessId = params.id;

    // Find business in database
    const business = await prisma.business.findUnique({
      where: { 
        id: businessId 
      },
      select: {
        id: true,
        businessName: true,
        category: true,
        description: true,
        address: true,
        phone: true,
        website: true,
        logoUrl: true,
        coverUrl: true,
        isVerified: true,
        rating: true,
        openingHours: {
          select: {
            dayOfWeek: true,
            openTime: true,
            closeTime: true,
            isClosed: true
          }
        }
      }
    });

    if (!business) {
      console.log("İşletme bulunamadı:", businessId);
      
      // Demo amaçlı, eğer işletme bulunamazsa mock veri dön
      return NextResponse.json({
        id: businessId,
        name: "Demo İşletme",
        description: "Bu bir demo işletmedir",
        address: "Demo Sokak No:123, İstanbul",
        phone: "+90 555 123 4567",
        website: "www.demosite.com",
        logo: "/images/logo.png",
        cover: "/images/cover.jpg",
        isVerified: true,
        rating: 4.5,
        reviewCount: 120,
        categories: ["Türk Mutfağı", "Kebap"],
        openingHours: "10:00 - 22:00"
      });
    }

    // Format the business data for the response
    const formattedBusiness = {
      id: business.id,
      name: business.businessName,
      description: business.description,
      address: business.address,
      phone: business.phone,
      website: business.website,
      logo: business.logoUrl,
      cover: business.coverUrl,
      isVerified: business.isVerified,
      rating: business.rating || 4.5, // Default rating if none exists
      reviewCount: 120, // Mock review count
      categories: business.category ? business.category.split(',').map(c => c.trim()) : ["Genel"],
      openingHours: formatOpeningHours(business.openingHours)
    };

    return NextResponse.json(formattedBusiness);
  } catch (error: any) {
    console.error('Error in GET /api/business/[id]:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

// Helper function to format opening hours
function formatOpeningHours(hours: any[] | null) {
  if (!hours || hours.length === 0) {
    return "10:00 - 22:00"; // Default hours
  }
  
  // Format based on current day
  const dayOfWeek = new Date().getDay();
  const todayHours = hours.find(h => h.dayOfWeek === dayOfWeek);
  
  if (!todayHours || todayHours.isClosed) {
    return "Bugün Kapalı";
  }
  
  return `${todayHours.openTime} - ${todayHours.closeTime}`;
} 