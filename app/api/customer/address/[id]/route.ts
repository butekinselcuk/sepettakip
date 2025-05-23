import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

// GET /api/customer/address/[id] - Belirli bir adresin detaylarını getirir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // JWT kontrolü
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || !decoded.userId || decoded.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Müşteri ID'sini bul
    const customer = await prisma.customer.findUnique({
      where: { userId: decoded.userId },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Adresi getir
    const address = await prisma.customerAddress.findUnique({
      where: { id },
    });

    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // Adresin müşteriye ait olup olmadığını kontrol et
    if (address.customerId !== customer.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ address });
  } catch (error) {
    logger.error(`Error fetching address with ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE /api/customer/address/[id] - Belirli bir adresi siler (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // JWT kontrolü
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || !decoded.userId || decoded.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Müşteri ID'sini bul
    const customer = await prisma.customer.findUnique({
      where: { userId: decoded.userId },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Adresin müşteriye ait olup olmadığını kontrol et
    const existingAddress = await prisma.customerAddress.findUnique({
      where: { id },
      select: { customerId: true, isDefault: true },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    if (existingAddress.customerId !== customer.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Adresi soft delete ile güncelle
    await prisma.customerAddress.update({
      where: { id },
      data: {
        isActive: false,
        isDefault: false,
      },
    });

    // Eğer silinen adres varsayılan adres ise, başka bir adresi varsayılan yap
    if (existingAddress.isDefault) {
      const anotherAddress = await prisma.customerAddress.findFirst({
        where: {
          customerId: customer.id,
          isActive: true,
          id: { not: id },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (anotherAddress) {
        await prisma.customerAddress.update({
          where: { id: anotherAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(`Error deleting address with ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PATCH /api/customer/address/[id]/default - Adresi varsayılan olarak işaretler
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const url = new URL(request.url);
    const action = url.pathname.split('/').pop();

    // JWT kontrolü
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || !decoded.userId || decoded.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Müşteri ID'sini bul
    const customer = await prisma.customer.findUnique({
      where: { userId: decoded.userId },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Adresin müşteriye ait olup olmadığını kontrol et
    const existingAddress = await prisma.customerAddress.findUnique({
      where: { id },
      select: { customerId: true, isActive: true },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    if (existingAddress.customerId !== customer.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!existingAddress.isActive) {
      return NextResponse.json({ error: 'Address is inactive' }, { status: 400 });
    }

    // Eğer adresi varsayılan olarak işaretliyorsak
    if (action === 'default') {
      // Diğer adreslerin varsayılan durumunu kaldır
      await prisma.customerAddress.updateMany({
        where: {
          customerId: customer.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });

      // Bu adresi varsayılan yap
      const updatedAddress = await prisma.customerAddress.update({
        where: { id },
        data: {
          isDefault: true,
        },
      });

      return NextResponse.json({ address: updatedAddress });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    logger.error(`Error updating address with ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 