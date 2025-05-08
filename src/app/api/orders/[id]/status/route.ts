import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOrderStatusEmail } from '@/lib/email'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json()

    // Siparişi güncelle
    const order = await prisma.order.update({
      where: { id: params.id },
      data: { status },
      include: {
        customer: true,
        courier: true,
      },
    })

    // E-posta bildirimi gönder
    await sendOrderStatusEmail(order.id, status)

    return NextResponse.json(order)
  } catch (error) {
    console.error('Sipariş durumu güncelleme hatası:', error)
    return NextResponse.json(
      { error: 'Sipariş durumu güncellenemedi' },
      { status: 500 }
    )
  }
} 