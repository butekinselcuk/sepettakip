import { NextResponse } from 'next/server'
import { getUnreadNotifications, markNotificationAsRead } from '@/lib/notifications'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const courierId = searchParams.get('courierId')

    const notifications = await getUnreadNotifications(
      userId || undefined,
      courierId || undefined
    )

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Bildirimler alınırken hata:', error)
    return NextResponse.json(
      { error: 'Bildirimler alınamadı' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const { notificationId } = await request.json()

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Bildirim ID gerekli' },
        { status: 400 }
      )
    }

    const notification = await markNotificationAsRead(notificationId)
    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Bildirim güncellenirken hata:', error)
    return NextResponse.json(
      { error: 'Bildirim güncellenemedi' },
      { status: 500 }
    )
  }
} 