import { NextRequest } from 'next/server';
import * as jose from 'jose';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'BUSINESS' | 'CUSTOMER' | 'COURIER';
  iat?: number;
  exp?: number;
}

// Type for JWT secret
type JWTSecret = string | Buffer;

// Default JWT secret for development (DO NOT USE IN PRODUCTION)
const DEFAULT_JWT_SECRET = '3a82c5a4c69f45b3a3fb62e6ebdc6ea4982c5a4c69f45b3a3fb62e6ebdc6ea4';

/**
 * Verify a JWT token
 */
export async function verifyJwtToken(token: string): Promise<JWTPayload | null> {
  try {
    // JWT_SECRET from environment variables
    const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
    
    if (!secret) {
      console.error('JWT_SECRET is not defined in environment variables');
      return null;
    }
    
    // Use jose library for verification which is also used in middleware
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, secretKey);
    
    // Type check the payload before returning
    if (typeof payload.userId !== 'string' || 
        typeof payload.email !== 'string' || 
        !['ADMIN', 'BUSINESS', 'CUSTOMER', 'COURIER'].includes(payload.role as string)) {
      console.error("JWT payload has invalid structure:", payload);
      return null;
    }
    
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as 'ADMIN' | 'BUSINESS' | 'CUSTOMER' | 'COURIER',
      iat: payload.iat,
      exp: payload.exp
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Sign a new JWT token using jose
 */
export async function signJwtToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn = '7d'): Promise<string> {
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  
  if (!secret) {
    console.error('JWT_SECRET is not defined in environment variables or default');
    throw new Error('JWT_SECRET is not available');
  }
  
  const secretKey = new TextEncoder().encode(secret);
  
  // Convert expiration string to seconds
  let expirationTime = '7d';
  if (typeof expiresIn === 'string') {
    expirationTime = expiresIn;
  }
  
  // Create a jose SignJWT object
  const token = await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(secretKey);
  
  return token;
}

/**
 * Get the user from the JWT token in the cookies
 */
export async function getAuthUser(req: NextRequest): Promise<JWTPayload | null> {
  const token = req.cookies.get('token')?.value;
  
  if (!token) {
    return null;
  }
  
  return await verifyJwtToken(token);
}

/**
 * Set a JWT token in the cookies
 */
export function setAuthCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set('token', token, {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clear the auth cookie
 */
export function clearAuthCookie() {
  const cookieStore = cookies();
  cookieStore.delete('token');
}

/**
 * Legacy function for compatibility
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  return verifyJwtToken(token);
}

export function withAuth(handler: Function, allowedRoles: string[] = []) {
  return async (req: NextRequest) => {
    const user = await getAuthUser(req);
    
    // Kullanıcı yoksa veya token geçersizse
    if (!user) {
      return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
    }
    
    // Rol kontrolü (eğer belirtilmişse)
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role as string)) {
      return NextResponse.json({ message: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }
    
    // Kullanıcıyı req nesnesine ekle ve işlemi devam ettir
    return handler(req, user);
  };
} 