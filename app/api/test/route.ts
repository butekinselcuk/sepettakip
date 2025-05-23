import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Modelleri test et
    const customerCount = await prisma.customer.count();
    const orderCount = await prisma.order.count();
    const productCount = await prisma.product.count();

    // Mevcut tablolar için şema bilgilerini al
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `;

    // Customer model test
    const customer = await prisma.customer.findFirst({
      include: {
        user: true
      }
    });

    // Bir müşteri için adres oluşturmayı dene
    let customerAddress = null;
    if (customer) {
      try {
        customerAddress = await prisma.customerAddress.create({
          data: {
            customerId: customer.id,
            title: "Test Adresi",
            firstName: customer.user.name.split(' ')[0],
            lastName: customer.user.name.split(' ')[1] || "Test",
            addressLine1: "Test Sokak No:1",
            city: "İstanbul",
            postalCode: "34000",
            isDefault: true
          }
        });
      } catch (error) {
        console.error("Adres oluşturma hatası:", error);
      }
    }

    return NextResponse.json({
      tables,
      counts: {
        customers: customerCount,
        orders: orderCount,
        products: productCount
      },
      sampleCustomer: customer,
      customerAddress
    });
  } catch (error) {
    console.error("Test API hatası:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 