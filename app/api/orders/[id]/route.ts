import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

// GET /api/orders/[id] - Belirli bir siparişi getir
export async function GET(
  req: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Yetkilendirme kontrolü
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Kimlik doğrulama gerekli' }, { status: 401 });
    }
    
    const userData = await verifyJWT(token);
    if (!userData) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }
    
    // Siparişi sorgula
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        business: true,
        customer: true,
        courier: {
          include: {
            user: true
          }
        }
      }
    });
    
    if (!order) {
      return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
    }
    
    // Rol kontrolü - Kullanıcı sadece kendine ait siparişleri görebilir
    if (userData.role === 'BUSINESS' && order.businessId !== userData.id) {
      return NextResponse.json({ error: 'Bu siparişe erişim izniniz yok' }, { status: 403 });
    }
    
    if (userData.role === 'COURIER' && order.courierId !== userData.id) {
      return NextResponse.json({ error: 'Bu siparişe erişim izniniz yok' }, { status: 403 });
    }
    
    // Format response
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalPrice: order.totalPrice,
      address: order.address,
      notes: order.notes,
      estimatedDelivery: order.estimatedDelivery,
      actualDelivery: order.actualDelivery,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      business: {
        id: order.business.id,
        name: order.business.businessName,
        address: order.business.address,
        phone: order.business.phone
      },
      items: order.items.map(item => ({
        id: item.id,
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes
      })),
      courier: order.delivery?.courier ? {
        id: order.delivery.courier.id,
        name: order.delivery.courier.user.name,
        phone: order.delivery.courier.phone || ''
      } : null
    };

    // Get order tracking history
    // In a real application, this would be from a separate table
    // Here we'll simulate it based on the order creation and delivery data
    const trackingHistory = generateTrackingHistory(order);
    formattedOrder.trackingHistory = trackingHistory;

    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error('Sipariş getirme hatası:', error);
    return NextResponse.json({ error: 'Sipariş alınırken bir hata oluştu' }, { status: 500 });
  }
}

// PATCH /api/orders/[id] - Siparişi güncelle
export async function PATCH(
  req: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Yetkilendirme kontrolü
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Kimlik doğrulama gerekli' }, { status: 401 });
    }
    
    const userData = await verifyJWT(token);
    if (!userData) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }
    
    // İstek gövdesini al
    const body = await req.json();
    
    // Önce siparişi kontrol et
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    });
    
    if (!existingOrder) {
      return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
    }
    
    // Rol kontrolü
    if (userData.role === 'BUSINESS' && existingOrder.businessId !== userData.id) {
      return NextResponse.json({ error: 'Bu siparişi güncelleme izniniz yok' }, { status: 403 });
    }
    
    if (userData.role === 'COURIER' && existingOrder.courierId !== userData.id) {
      return NextResponse.json({ error: 'Bu siparişi güncelleme izniniz yok' }, { status: 403 });
    }
    
    // Kurye değiştiriliyorsa
    if (body.courierId && userData.role !== 'ADMIN' && userData.role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Kuryeyi değiştirme yetkiniz yok' }, { status: 403 });
    }
    
    // Güncelleme verilerini hazırla
    const updateData: any = {};
    
    // İzin verilen alanları güncelle
    if (body.status) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    
    // Admin ve işletme kullanıcıları için ek alanlar
    if (['ADMIN', 'BUSINESS'].includes(userData.role as string)) {
      if (body.courierId !== undefined) updateData.courierId = body.courierId || null;
      if (body.estimatedDelivery) updateData.estimatedDelivery = new Date(body.estimatedDelivery);
      if (body.address) updateData.address = body.address;
    }
    
    // Kurye ve admin kullanıcıları teslim bilgilerini güncelleyebilir
    if (['ADMIN', 'COURIER'].includes(userData.role as string)) {
      if (body.actualDelivery) updateData.actualDelivery = new Date(body.actualDelivery);
    }
    
    // Boş güncelleme isteğini kontrol et
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Güncellenecek veri bulunamadı' }, { status: 400 });
    }
    
    // Siparişi güncelle
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        business: true,
        customer: true,
        courier: {
          include: {
            user: true
          }
        }
      }
    });
    
    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Sipariş güncelleme hatası:', error);
    return NextResponse.json({ error: 'Sipariş güncellenirken bir hata oluştu' }, { status: 500 });
  }
}

// DELETE /api/orders/[id] - Siparişi sil
export async function DELETE(
  req: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Yetkilendirme kontrolü
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Kimlik doğrulama gerekli' }, { status: 401 });
    }
    
    const userData = await verifyJWT(token);
    if (!userData) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }
    
    // Sadece admin siparişleri silebilir
    if (userData.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bu işlemi gerçekleştirme yetkiniz yok' }, { status: 403 });
    }
    
    // Siparişi kontrol et
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    });
    
    if (!existingOrder) {
      return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
    }
    
    // Siparişi sil
    await prisma.order.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true, message: 'Sipariş başarıyla silindi' });
  } catch (error) {
    console.error('Sipariş silme hatası:', error);
    return NextResponse.json({ error: 'Sipariş silinirken bir hata oluştu' }, { status: 500 });
  }
}

// Helper function to get user's role-specific ID
async function getUserRoleId(userId: string, role: string) {
  try {
    let result;
    
    switch(role) {
      case 'CUSTOMER':
        result = await prisma.customer.findUnique({
          where: { userId }
        });
        break;
      case 'BUSINESS':
        result = await prisma.business.findUnique({
          where: { userId }
        });
        break;
      case 'COURIER':
        result = await prisma.courier.findUnique({
          where: { userId }
        });
        break;
      default:
        return null;
    }
    
    return result?.id || null;
  } catch (error) {
    console.error(`Error getting ${role} ID:`, error);
    return null;
  }
}

// Helper function to generate tracking history based on order status
function generateTrackingHistory(order: any) {
  const history = [];
  const createdAt = new Date(order.createdAt);
  
  // Always add order created status
  history.push({
    status: 'PENDING',
    time: createdAt.toISOString(),
    description: 'Sipariş alındı'
  });
  
  // Add subsequent statuses based on order status
  if (['CONFIRMED', 'PREPARING', 'ASSIGNED', 'PICKED_UP', 'DELIVERED'].includes(order.status)) {
    history.push({
      status: 'CONFIRMED',
      time: new Date(createdAt.getTime() + 5 * 60000).toISOString(), // +5 minutes
      description: 'Sipariş onaylandı'
    });
  }
  
  if (['PREPARING', 'ASSIGNED', 'PICKED_UP', 'DELIVERED'].includes(order.status)) {
    history.push({
      status: 'PREPARING',
      time: new Date(createdAt.getTime() + 10 * 60000).toISOString(), // +10 minutes
      description: 'Sipariş hazırlanıyor'
    });
  }
  
  if (['ASSIGNED', 'PICKED_UP', 'DELIVERED'].includes(order.status)) {
    history.push({
      status: 'ASSIGNED',
      time: new Date(createdAt.getTime() + 20 * 60000).toISOString(), // +20 minutes
      description: 'Kurye atandı'
    });
  }
  
  if (['PICKED_UP', 'DELIVERED'].includes(order.status)) {
    history.push({
      status: 'PICKED_UP',
      time: new Date(createdAt.getTime() + 30 * 60000).toISOString(), // +30 minutes
      description: 'Kurye siparişi aldı'
    });
  }
  
  if (order.status === 'DELIVERED') {
    history.push({
      status: 'DELIVERED',
      time: order.actualDelivery ? new Date(order.actualDelivery).toISOString() 
                                : new Date(createdAt.getTime() + 45 * 60000).toISOString(), // +45 minutes
      description: 'Sipariş teslim edildi'
    });
  }
  
  if (order.status === 'CANCELLED') {
    history.push({
      status: 'CANCELLED',
      time: new Date(order.updatedAt).toISOString(),
      description: 'Sipariş iptal edildi'
    });
  }
  
  return history;
} 