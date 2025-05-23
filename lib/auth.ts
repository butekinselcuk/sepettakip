import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { compare } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";
import { PrismaAdapter } from "@auth/prisma-adapter";

// JWT Payload'ı için tip tanımı
export type JWTPayload = {
  userId: string;
  email: string;
  name: string;
  role: string;
};

// JWT için bir secret key
const secretKey = process.env.JWT_SECRET || "sepettakip_jwt_secret_key_for_authentication";
const key = new TextEncoder().encode(secretKey);

console.log("JWT secret kullanılıyor. Çevre değişkeni mevcut:", !!process.env.JWT_SECRET);

// Tokens 1 hafta geçerli
export const DEFAULT_EXPIRE = "7d";

// JWT Token oluşturma fonksiyonu
export async function sign(payload: JWTPayload): Promise<string> {
  try {
    // Role değerini normalleştir - büyük harfe çevir
    const normalizedPayload = {
      ...payload,
      role: payload.role ? payload.role.toUpperCase() : payload.role
    };
    
    console.log("📝 Creating token with payload:", JSON.stringify(normalizedPayload, null, 2));
    
    const token = await new SignJWT(normalizedPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d") // 7 gün geçerli
      .sign(key);
    
    return token;
  } catch (error) {
    console.error("Token oluşturma hatası:", error);
    throw new Error("Kimlik doğrulama jetonu oluşturulamadı");
  }
}

// Token'ı doğrulama
export async function verify(token: string): Promise<JWTPayload> {
  try {
    // Token formatı kontrolü
    if (!token || typeof token !== 'string' || token.trim() === '') {
      console.error("Token boş veya geçersiz format");
      throw new Error("Geçersiz token formatı");
    }

    // Jose kütüphanesi ile token doğrula
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    
    // Kritik alanların varlığını kontrol et
    if (!payload.userId || !payload.email || !payload.role) {
      console.error("Token payload eksik alanlar içeriyor:", JSON.stringify(payload));
      throw new Error("Token eksik bilgi içeriyor");
    }
    
    // Role değerini normalleştir - büyük harfe çevir
    if (payload.role && typeof payload.role === 'string') {
      payload.role = payload.role.toUpperCase();
    }
    
    console.log("✅ Token doğrulandı:", {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    });
    
    return payload as JWTPayload;
  } catch (error) {
    console.error("Token doğrulama hatası:", error);
    throw new Error("Geçersiz veya süresi dolmuş kimlik doğrulama jetonu");
  }
}

// Request veya headers'dan token alma ve doğrulama
export async function getTokenData(request: NextRequest | { headers: Headers }): Promise<JWTPayload | null> {
  // Authorization başlığından token alma
  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return await verify(token);
  }

  try {
    // Next.js cookies API - async kullanım
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("token");
    if (tokenCookie) {
      return await verify(tokenCookie.value);
    }
  } catch (error) {
    console.error("Cookie okuma hatası:", error);
  }
  
  return null;
}

/**
 * Get the user from the JWT token in the cookies
 */
export async function getAuthUser(req: NextRequest): Promise<JWTPayload | null> {
  const token = req.cookies.get('token')?.value;
  
  if (!token) {
    return null;
  }
  
  return await verify(token);
}

// Token'ı cookie'den al
export async function getTokenFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("token");
    return tokenCookie ? tokenCookie.value : null;
  } catch (error) {
    console.error("Cookie okuma hatası:", error);
    return null;
  }
}

// Token'ı cookie'ye kaydet
export function setTokenCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: "token",
    value: token,
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 gün
    sameSite: "strict",
  });
  
  return response;
}

// Token cookie'sini sil
export function signOut(response: NextResponse) {
  const cookiesToClear = [
    "token",
    "next-auth.session-token",
    "next-auth.callback-url",
    "next-auth.csrf-token",
    "__Secure-next-auth.session-token",
    "__Secure-next-auth.callback-url",
    "__Secure-next-auth.csrf-token",
    ".next-auth.session-token",
    ".next-auth.callback-url",
    ".next-auth.csrf-token"
  ];
  
  for (const cookie of cookiesToClear) {
    response.cookies.set({
      name: cookie,
      value: "",
      expires: new Date(0),
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
    });
  }
  
  // Cache kontrolü
  response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

/**
 * Legacy function for compatibility
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  return verify(token);
}

/**
 * Legacy function for compatibility with older imports
 */
export async function verifyJwtToken(token: string): Promise<JWTPayload | null> {
  return verify(token);
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

// PrismaAdapter kullanımını düzeltilmiş şekilde kullan
export const authOptions: NextAuthOptions = {
  debug: true,
  // PrismaAdapter import edilmediği için şimdilik devre dışı bırakıyoruz
  adapter: PrismaAdapter(prisma) as any, // Type casting for adapter compatibility
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 gün
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("Kimlik bilgileri eksik:", credentials);
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          console.error("Kullanıcı bulunamadı:", credentials.email);
          return null;
        }

        // Test kullanıcıları kontrolü
        const testUsers = {
          'admin@example.com': 'admin123',
          'business1@example.com': 'business123',
          'courier1@example.com': 'courier123',
          'customer1@example.com': 'customer123'
        };

        // Şifre kontrolü
        const passwordMatch = await compare(credentials.password, user.password);
        
        // Test kullanıcısı kontrolü veya normal şifre eşleşme kontrolü
        if (!passwordMatch && !(credentials.email in testUsers && credentials.password === testUsers[credentials.email as keyof typeof testUsers])) {
          console.error("Şifre eşleşmiyor:", credentials.email);
          return null;
        }

        // Kullanıcı nesnesi oluştur ve döndür
        console.log("Kullanıcı girişi başarılı:", user.email, "Role:", user.role);
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
        session.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 günlük
      }
      
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      
      return token;
    },
  },
};

// Admin yetkisi kontrolü yapan yardımcı fonksiyon
export const isAdmin = async (session: any) => {
  if (!session || !session.user) {
    return false;
  }
  
  return session.user.role === "ADMIN";
};

// Auth session için tip tanımları
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
}

  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    email?: string;
    name?: string;
  }
}

// Şifre kontrolü
export async function verifyPassword(password: string, hashedPassword: string) {
  return await compare(password, hashedPassword);
}

// Middleware için token doğrulama fonksiyonu
export async function authenticateRequest(request: NextRequest) {
  // Token yoksa veya geçersizse null döner
  // Geçerliyse payload bilgilerini döner
  try {
    // İlk olarak cookie'den token'ı al
    const token = request.cookies.get("token")?.value;
    
    // Token yoksa header'dan Bearer token'ı kontrol et
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") 
      ? authHeader.substring(7) 
      : null;
    
    // İkisi de yoksa null dön
    if (!token && !bearerToken) {
      return null;
    }
    
    // Hangisi varsa onu doğrula
    const jwtToken = token || bearerToken;
    if (!jwtToken) return null;
    
    const payload = await verify(jwtToken);
    return payload;
  } catch (error) {
    console.error("Kimlik doğrulama hatası:", error);
    return null;
  }
} 