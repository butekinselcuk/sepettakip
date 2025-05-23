import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';

// Not: Gerçek bir uygulamada bu işlem geçmişi veritabanında tutulur
// Şimdilik basitçe boş dizi döndürelim
const actionHistory: any[] = [];

/**
 * Toplu işlemi geri almak için API endpoint
 * @route POST /api/admin/users/bulk/undo
 */
export async function POST(request: NextRequest) {
  try {
    // Token'ı alıp doğrulama
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz erişim: Token bulunamadı' }, { status: 401 });
    }
    
    // JWT token içindeki bilgileri al
    const decodedToken = await verifyJwtToken(token);
    
    if (!decodedToken || decodedToken.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim: Admin yetkisi gerekli' }, { status: 401 });
    }
    
    const body = await request.json();
    const { actionId } = body;
    
    if (!actionId) {
      return NextResponse.json({ error: 'İşlem ID\'si gereklidir' }, { status: 400 });
    }
    
    // Gerçek uygulamada aksiyonu geçmişten bul
    // Şu an sadece sahte (mock) işlem uygulayacağız
    
    // Etkinlik günlüğüne ekle
    await prisma.activityLog.create({
      data: {
        action: 'UNDO_BULK_ACTION',
        description: `${decodedToken.email} tarafından toplu işlem geri alındı`,
        userId: decodedToken.userId,
        targetType: 'USER'
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'İşlem başarıyla geri alındı'
    });
  } catch (error) {
    console.error('Toplu işlem geri alma hatası:', error);
    return NextResponse.json({ 
      error: 'Sunucu hatası', 
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 