import { NextRequest, NextResponse } from 'next/server';

/**
 * Contact form submission API endpoint
 * Receives contact form data and simulates processing
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.email || !data.message) {
      return NextResponse.json(
        { error: 'Email ve mesaj alanları zorunludur' },
        { status: 400 }
      );
    }
    
    // In a real application, this would send an email or store
    // the message in a database. Here we'll simulate success.
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return success response
    return NextResponse.json(
      { 
        success: true,
        message: 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.'
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Contact form submission error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Mesajınız gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.'
      },
      { status: 500 }
    );
  }
}

/**
 * GET method to test if API endpoint is active
 */
export async function GET() {
  return NextResponse.json(
    { 
      status: 'active',
      message: 'İletişim formu API endpointi aktif durumdadır.'
    },
    { status: 200 }
  );
} 