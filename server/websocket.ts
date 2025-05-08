import { WebSocketServer, WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const wss = new WebSocketServer({ port: 3001 });

// Bağlı istemcileri tutacak set
const clients = new Set<WebSocket>();

// Her 5 saniyede bir güncelleme gönder
setInterval(async () => {
  try {
    // Aktif kurye sayısı
    const activeCouriers = await prisma.courier.count({
      where: {
        status: 'ACTIVE'
      }
    });

    // Aktif teslimat sayısı
    const activeDeliveries = await prisma.delivery.count({
      where: {
        status: 'PENDING'
      }
    });

    // Bugün tamamlanan teslimat sayısı
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = await prisma.delivery.count({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: today
        }
      }
    });

    // Ortalama teslimat süresi
    const avgDeliveryTime = await prisma.delivery.aggregate({
      where: {
        status: 'COMPLETED',
        deliveryTime: { not: null }
      },
      _avg: {
        deliveryTime: true
      }
    });

    // Tüm bağlı istemcilere güncelleme gönder
    const update = {
      type: 'delivery_update',
      data: {
        activeCouriers,
        activeDeliveries,
        completedToday,
        averageDeliveryTime: Math.round(avgDeliveryTime._avg.deliveryTime || 0)
      }
    };

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(update));
      }
    });
  } catch (error) {
    console.error('WebSocket güncelleme hatası:', error);
  }
}, 5000);

wss.on('connection', (ws: WebSocket) => {
  clients.add(ws);

  ws.on('close', () => {
    clients.delete(ws);
  });
});

console.log('WebSocket sunucusu 3001 portunda çalışıyor'); 