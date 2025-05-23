import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    console.log("📡 [API] /api/auth/validate - Validating token...");
    
    // Get token from request header or cookie
    const token = req.headers.get('authorization')?.split(' ')[1] || 
                  req.cookies.get('token')?.value;
    
    if (!token) {
      console.log("❌ No token found");
      return NextResponse.json(
        { success: false, error: "Token bulunamadı" },
        { status: 401 }
      );
    }
    
    // Verify token
    const decoded = await verifyJwtToken(token);
    
    if (!decoded) {
      console.log("❌ Invalid token");
      return NextResponse.json(
        { success: false, error: "Geçersiz token" },
        { status: 401 }
      );
    }
    
    console.log("✅ Token valid:", JSON.stringify(decoded, null, 2));
    
    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role
      }
    });
  } catch (error) {
    console.error("❌ Token validation error:", error);
    return NextResponse.json(
      { success: false, error: "Token doğrulama hatası" },
      { status: 500 }
    );
  }
} 