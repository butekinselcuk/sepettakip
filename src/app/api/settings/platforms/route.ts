import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { platformId, apiKey, isEnabled } = body

    if (!platformId || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Save platform settings to database
    await prisma.platformSettings.upsert({
      where: {
        platformId,
      },
      create: {
        platformId,
        apiKey,
        isEnabled,
      },
      update: {
        apiKey,
        isEnabled,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving platform settings:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const settings = await prisma.platformSettings.findMany()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching platform settings:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 