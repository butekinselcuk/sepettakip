import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = cookies();
    
    // Token cookie'sini sil
    cookieStore.delete('token');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Başarıyla çıkış yapıldı' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Çıkış yaparken bir hata oluştu' 
      },
      { status: 500 }
    );
  }
} 