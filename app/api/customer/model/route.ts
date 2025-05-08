import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyJwtToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Yetkilendirme kontrolü
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Token is missing' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyJwtToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    // Kullanıcının rolünü kontrol et
    if (decoded.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Kullanıcı ID'sini al
    const userId = decoded.id;

    // Müşteri bilgilerini al
    const customer = await prisma.customer.findUnique({
      where: { userId: userId as string },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            createdAt: true
          }
        },
        addresses: true,
        orders: {
          take: 5,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            createdAt: true,
            totalPrice: true
          }
        }
      }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Not found: Customer profile does not exist' },
        { status: 404 }
      );
    }

    // Müşteri modelini döndür
    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.user.name,
        email: customer.user.email,
        phone: customer.user.phone,
        addresses: customer.addresses,
        memberSince: customer.user.createdAt,
        recentOrders: customer.orders,
        customerType: customer.customerType || 'REGULAR',
        loyaltyPoints: customer.loyaltyPoints || 0,
        preferredPaymentMethod: customer.preferredPaymentMethod,
        defaultAddressId: customer.defaultAddressId
      }
    });
  } catch (error) {
    console.error('Error fetching customer model:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 