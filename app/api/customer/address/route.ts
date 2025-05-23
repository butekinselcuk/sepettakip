import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';
import logger from '@/lib/logger';
import { z } from 'zod';

// Adres doğrulama şeması
const addressSchema = z.object({
  title: z.string().min(1, 'Adres başlığı gereklidir'),
  firstName: z.string().min(1, 'Ad gereklidir'),
  lastName: z.string().min(1, 'Soyad gereklidir'),
  addressLine1: z.string().min(1, 'Adres satırı gereklidir'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'Şehir gereklidir'),
  state: z.string().optional(),
  postalCode: z.string().min(1, 'Posta kodu gereklidir'),
  country: z.string().default('Türkiye'),
  phone: z.string().optional(),
  notes: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isDefault: z.boolean().default(false),
});

// GET /api/customer/address - Müşterinin adreslerini listeler
export async function GET(request: NextRequest) {
  try {
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

    // Müşterinin aktif adreslerini getir
    const addresses = await prisma.customerAddress.findMany({
      where: {
        customerId: customer.id,
        isActive: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Error fetching customer addresses:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/customer/address - Yeni müşteri adresi ekler
export async function POST(request: NextRequest) {
  try {
    // JWT kontrolü
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || !decoded.userId || decoded.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Request body'den adres bilgilerini al
    const body = await request.json();
    
    // Veri doğrulama
    const validation = addressSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const addressData = validation.data;

    // Müşteri ID'sini bul
    const customer = await prisma.customer.findUnique({
      where: { userId: decoded.userId },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Eğer yeni adres varsayılan olarak işaretlendiyse, diğer adreslerin varsayılan durumunu kaldır
    if (addressData.isDefault) {
      await prisma.customerAddress.updateMany({
        where: {
          customerId: customer.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Yeni adresi oluştur
    const newAddress = await prisma.customerAddress.create({
      data: {
        ...addressData,
        customerId: customer.id,
      },
    });

    return NextResponse.json({ address: newAddress }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer address:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PUT /api/customer/address - Müşteri adresini günceller
export async function PUT(request: NextRequest) {
  try {
    // JWT kontrolü
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || !decoded.userId || decoded.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Request body'den adres bilgilerini al
    const body = await request.json();
    const { id, ...addressData } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
    }
    
    // Veri doğrulama
    const validation = addressSchema.safeParse(addressData);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const validatedData = validation.data;

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
      select: { customerId: true },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    if (existingAddress.customerId !== customer.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Eğer güncellenen adres varsayılan olarak işaretlendiyse, diğer adreslerin varsayılan durumunu kaldır
    if (validatedData.isDefault) {
      await prisma.customerAddress.updateMany({
        where: {
          customerId: customer.id,
          isDefault: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Adresi güncelle
    const updatedAddress = await prisma.customerAddress.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({ address: updatedAddress });
  } catch (error) {
    console.error('Error updating customer address:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE /api/customer/address - Müşteri adresini siler (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    // JWT kontrolü
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || !decoded.userId || decoded.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // URL parametrelerinden adres ID'sini al
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
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
    console.error('Error deleting customer address:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 