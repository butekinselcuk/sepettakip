import { useEffect, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { OrderStatus, Platform } from '@prisma/client'
import { WebSocketMessage } from '@/lib/websocket'

type WebSocketHook = {
  joinOrder: (orderId: string) => void
  joinPlatform: (platform: Platform) => void
  joinCourier: (courierId: string) => void
  leaveOrder: (orderId: string) => void
  leavePlatform: (platform: Platform) => void
  leaveCourier: (courierId: string) => void
  onOrderUpdate: (callback: (data: any) => void) => void
  onPlatformSync: (callback: (data: any) => void) => void
  onCourierUpdate: (callback: (data: any) => void) => void
}

export function useWebSocket(): WebSocketHook {
  const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000')

  const joinOrder = useCallback(
    (orderId: string) => {
      socket.emit('join-order', orderId)
    },
    [socket]
  )

  const joinPlatform = useCallback(
    (platform: Platform) => {
      socket.emit('join-platform', platform)
    },
    [socket]
  )

  const joinCourier = useCallback(
    (courierId: string) => {
      socket.emit('join-courier', courierId)
    },
    [socket]
  )

  const leaveOrder = useCallback(
    (orderId: string) => {
      socket.emit('leave-order', orderId)
    },
    [socket]
  )

  const leavePlatform = useCallback(
    (platform: Platform) => {
      socket.emit('leave-platform', platform)
    },
    [socket]
  )

  const leaveCourier = useCallback(
    (courierId: string) => {
      socket.emit('leave-courier', courierId)
    },
    [socket]
  )

  const onOrderUpdate = useCallback(
    (callback: (data: any) => void) => {
      socket.on('message', (message: WebSocketMessage) => {
        if (message.type === 'ORDER_UPDATE') {
          callback(message.data)
        }
      })
    },
    [socket]
  )

  const onPlatformSync = useCallback(
    (callback: (data: any) => void) => {
      socket.on('message', (message: WebSocketMessage) => {
        if (message.type === 'PLATFORM_SYNC') {
          callback(message.data)
        }
      })
    },
    [socket]
  )

  const onCourierUpdate = useCallback(
    (callback: (data: any) => void) => {
      socket.on('message', (message: WebSocketMessage) => {
        if (message.type === 'COURIER_UPDATE') {
          callback(message.data)
        }
      })
    },
    [socket]
  )

  useEffect(() => {
    return () => {
      socket.disconnect()
    }
  }, [socket])

  return {
    joinOrder,
    joinPlatform,
    joinCourier,
    leaveOrder,
    leavePlatform,
    leaveCourier,
    onOrderUpdate,
    onPlatformSync,
    onCourierUpdate,
  }
} 