import { NextResponse } from 'next/server';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

/**
 * Standard API response types
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

/**
 * Handle database errors and return appropriate responses
 * @param error The error object
 * @returns NextResponse with appropriate status and error message
 */
export function handleDatabaseError(error: any): NextResponse {
  console.error("Database error:", error);
  
  // Handle specific Prisma errors
  if (error instanceof PrismaClientKnownRequestError) {
    // P2021 is the error code for "The table does not exist in the current database"
    if (error.code === 'P2021') {
      console.warn("Database table doesn't exist:", error.message);
      return NextResponse.json({ 
        error: "Veritabanı tablosu mevcut değil. Sistem yöneticisiyle iletişime geçin.",
        code: "DB_TABLE_NOT_FOUND" 
      }, { status: 500 });
    }
    
    // P2002 is the error code for unique constraint violations
    if (error.code === 'P2002') {
      const field = error.meta?.target as string[] || ['field'];
      return NextResponse.json({ 
        error: `Bu ${field[0]} değeri zaten kullanılıyor. Lütfen başka bir değer deneyin.` 
      }, { status: 409 });
    }
    
    // P2025 is the error code for record not found
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        error: "Kayıt bulunamadı." 
      }, { status: 404 });
    }
  }
  
  // Default database error response
  return NextResponse.json({ 
    error: "Veritabanı işlemi sırasında bir hata oluştu." 
  }, { status: 500 });
}

/**
 * Handle authentication errors and return appropriate responses
 * @param message Custom error message (optional)
 * @returns NextResponse with 401 status and error message
 */
export function handleAuthError(message?: string): NextResponse {
  return NextResponse.json({ 
    error: message || "Kimlik doğrulama gerekli" 
  }, { status: 401 });
}

/**
 * Handle permission errors and return appropriate responses
 * @param message Custom error message (optional)
 * @returns NextResponse with 403 status and error message
 */
export function handlePermissionError(message?: string): NextResponse {
  return NextResponse.json({ 
    error: message || "Bu işlem için yetkiniz bulunmuyor" 
  }, { status: 403 });
}

/**
 * Handle resource not found errors
 * @param resourceType Type of resource (e.g., "User", "Order")
 * @returns NextResponse with 404 status and error message
 */
export function handleNotFoundError(resourceType: string): NextResponse {
  return NextResponse.json({ 
    error: `${resourceType} bulunamadı` 
  }, { status: 404 });
}

/**
 * Handle validation errors
 * @param errors Validation error messages or object
 * @returns NextResponse with 400 status and error details
 */
export function handleValidationError(errors: string | Record<string, string>): NextResponse {
  return NextResponse.json({ 
    error: "Doğrulama hatası",
    details: typeof errors === 'string' ? { message: errors } : errors
  }, { status: 400 });
}

/**
 * Handle general server errors
 * @param error Error object or message
 * @returns NextResponse with 500 status and error message
 */
export function handleServerError(error: any): NextResponse {
  console.error("Server error:", error);
  
  return NextResponse.json({ 
    error: "Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin." 
  }, { status: 500 });
}

/**
 * Create a successful response
 * @param data Response data
 * @param message Optional success message
 * @returns NextResponse with 200 status and data
 */
export function createSuccessResponse<T>(data: T, message?: string): NextResponse {
  return NextResponse.json({
    data,
    message: message || "İşlem başarıyla tamamlandı"
  });
}

/**
 * Create an empty response for empty data scenarios
 * @param resourceType Type of resource that was empty
 * @returns NextResponse with 200 status and empty data array
 */
export function createEmptyResponse(resourceType: string): NextResponse {
  return NextResponse.json({
    data: [],
    message: `Hiç ${resourceType} bulunamadı`
  });
}

/**
 * Check if a token exists and is valid
 * @param token JWT token to verify
 * @returns Boolean indicating if token is valid
 */
export function isValidToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }
  
  try {
    // Add your token validation logic here
    // For example, using jose or jsonwebtoken to verify token
    
    // This is a placeholder
    return token.length > 20;
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
} 