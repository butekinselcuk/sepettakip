import { NextResponse } from 'next/server'
import {
  getNotificationTemplates,
  createNotificationTemplate,
  updateNotificationTemplate,
  deleteNotificationTemplate,
} from '@/lib/notificationTemplates'

// Şablonları getir
export async function GET() {
  try {
    const templates = await getNotificationTemplates()
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Şablonlar getirilirken hata:', error)
    return NextResponse.json(
      { error: 'Şablonlar getirilirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

// Yeni şablon oluştur
export async function POST(request: Request) {
  try {
    const template = await request.json()
    const newTemplate = await createNotificationTemplate(template)
    return NextResponse.json(newTemplate, { status: 201 })
  } catch (error) {
    console.error('Şablon oluşturulurken hata:', error)
    return NextResponse.json(
      { error: 'Şablon oluşturulurken bir hata oluştu' },
      { status: 500 }
    )
  }
}

// Şablon güncelle
export async function PATCH(request: Request) {
  try {
    const { id, ...template } = await request.json()
    const updatedTemplate = await updateNotificationTemplate(id, template)
    return NextResponse.json(updatedTemplate)
  } catch (error) {
    console.error('Şablon güncellenirken hata:', error)
    return NextResponse.json(
      { error: 'Şablon güncellenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

// Şablon sil
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    await deleteNotificationTemplate(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Şablon silinirken hata:', error)
    return NextResponse.json(
      { error: 'Şablon silinirken bir hata oluştu' },
      { status: 500 }
    )
  }
} 