import { NextResponse } from 'next/server'
import {
  getNotificationPreferences,
  createNotificationPreference,
  updateNotificationPreference,
  deleteNotificationPreference,
  updateAllNotificationPreferences,
} from '@/lib/notificationPreferences'

// Tercihleri getir
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || undefined
    const courierId = searchParams.get('courierId') || undefined

    const preferences = await getNotificationPreferences(userId, courierId)
    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Tercihler getirilirken hata:', error)
    return NextResponse.json(
      { error: 'Tercihler getirilirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

// Yeni tercih oluştur
export async function POST(request: Request) {
  try {
    const preference = await request.json()
    const newPreference = await createNotificationPreference(preference)
    return NextResponse.json(newPreference, { status: 201 })
  } catch (error) {
    console.error('Tercih oluşturulurken hata:', error)
    return NextResponse.json(
      { error: 'Tercih oluşturulurken bir hata oluştu' },
      { status: 500 }
    )
  }
}

// Tercih güncelle
export async function PATCH(request: Request) {
  try {
    const { id, ...preference } = await request.json()
    const updatedPreference = await updateNotificationPreference(id, preference)
    return NextResponse.json(updatedPreference)
  } catch (error) {
    console.error('Tercih güncellenirken hata:', error)
    return NextResponse.json(
      { error: 'Tercih güncellenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

// Tercih sil
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    await deleteNotificationPreference(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Tercih silinirken hata:', error)
    return NextResponse.json(
      { error: 'Tercih silinirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

// Tüm tercihleri toplu güncelle
export async function PUT(request: Request) {
  try {
    const { userId, preferences } = await request.json()
    const updatedPreferences = await updateAllNotificationPreferences(userId, preferences)
    return NextResponse.json(updatedPreferences)
  } catch (error) {
    console.error('Tercihler güncellenirken hata:', error)
    return NextResponse.json(
      { error: 'Tercihler güncellenirken bir hata oluştu' },
      { status: 500 }
    )
  }
} 