import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';
import { Role } from '@prisma/client';

// GET /api/business/policies - İşletmeye ait tüm politikaları listele
export async function GET(request: NextRequest) {
  try {
    // Verify token and extract business ID
    const token = request.headers.get("authorization")?.split(" ")[1] || request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || decoded.role !== Role.BUSINESS) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // İşletmeyi bul
    const business = await prisma.business.findFirst({
      where: { userId: decoded.userId }
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // İşletmeye ait politikaları getir
    const policies = await prisma.refundPolicy.findMany({
      where: {
        businessId: business.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ policies });
  } catch (error) {
    console.error("Error getting policies:", error);
    return NextResponse.json(
      { error: "Policies could not be retrieved" },
      { status: 500 }
    );
  }
}

// POST /api/business/policies - Yeni politika oluştur
export async function POST(request: NextRequest) {
  try {
    // Verify token and extract business ID
    const token = request.headers.get("authorization")?.split(" ")[1] || request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || decoded.role !== Role.BUSINESS) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // İşletmeyi bul
    const business = await prisma.business.findFirst({
      where: { userId: decoded.userId }
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Request body'yi oku
    const data = await request.json();

    // Basic validation
    if (!data.name) {
      return NextResponse.json(
        { error: "Policy name is required" },
        { status: 400 }
      );
    }

    // Politika oluştur
    const policy = await prisma.refundPolicy.create({
      data: {
        name: data.name,
        description: data.description,
        autoApproveTimeline: data.autoApproveTimeline,
        timeLimit: data.timeLimit,
        orderStatusRules: data.orderStatusRules || {},
        productRules: data.productRules || {},
        cancellationFees: data.cancellationFees || [],
        isActive: data.isActive !== undefined ? data.isActive : true,
        businessId: business.id,
      },
    });

    return NextResponse.json({ policy }, { status: 201 });
  } catch (error) {
    console.error("Error creating policy:", error);
    return NextResponse.json(
      { error: "Policy could not be created" },
      { status: 500 }
    );
  }
} 