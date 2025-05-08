import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { OrderStatus, Platform } from '@prisma/client'

export type OrderUpdate = {
  orderId: string
  status: OrderStatus
  platform: Platform
  updatedAt: Date
}

export type WebSocketMessage = {
  type: 'ORDER_UPDATE' | 'PLATFORM_SYNC' | 'COURIER_UPDATE'
  data: OrderUpdate | any
}

type CourierUpdate = {
  type: 'COURIER_CREATED' | 'COURIER_UPDATED' | 'COURIER_DELETED' | 'LOCATION_UPDATED'
  courier?: any
  courierId?: string
  location?: {
    latitude: number
    longitude: number
  }
}

export class WebSocketServer {
  private static instance: WebSocketServer
  private io: SocketIOServer | null = null

  private constructor() {}

  static getInstance(): WebSocketServer {
    if (!WebSocketServer.instance) {
      WebSocketServer.instance = new WebSocketServer()
    }
    return WebSocketServer.instance
  }

  initialize(server: NetServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        methods: ['GET', 'POST'],
      },
    })

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)

      // Join room for specific order updates
      socket.on('join-order', (orderId: string) => {
        socket.join(`order-${orderId}`)
      })

      // Join room for platform updates
      socket.on('join-platform', (platform: Platform) => {
        socket.join(`platform-${platform}`)
      })

      // Join room for courier updates
      socket.on('join-courier', (courierId: string) => {
        socket.join(`courier-${courierId}`)
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })
  }

  broadcastOrderUpdate(update: OrderUpdate) {
    if (!this.io) return

    // Broadcast to specific order room
    this.io.to(`order-${update.orderId}`).emit('message', {
      type: 'ORDER_UPDATE',
      data: update,
    })

    // Broadcast to platform room
    this.io.to(`platform-${update.platform}`).emit('message', {
      type: 'ORDER_UPDATE',
      data: update,
    })
  }

  broadcastPlatformSync(platform: Platform, data: any) {
    if (!this.io) return

    this.io.to(`platform-${platform}`).emit('message', {
      type: 'PLATFORM_SYNC',
      data,
    })
  }

  broadcastCourierUpdate(courierId: string, data: any) {
    if (!this.io) return

    this.io.to(`courier-${courierId}`).emit('message', {
      type: 'COURIER_UPDATE',
      data,
    })
  }

  broadcastCourierLocation(courierId: string, location: { latitude: number; longitude: number }) {
    this.io?.to(`courier:${courierId}`).emit('courierUpdate', {
      type: 'LOCATION_UPDATED',
      courierId,
      location,
    })
  }
}

export const wsServer = WebSocketServer.getInstance() 