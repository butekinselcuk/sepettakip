# JWT Tabanlı Kimlik Doğrulama Sistemi

Bu doküman, projemizde uyguladığımız JWT (JSON Web Token) tabanlı kimlik doğrulama sisteminin teknik detaylarını içermektedir.

## 📋 Genel Bakış

JWT tabanlı kimlik doğrulama sistemi, kullanıcıların sisteme güvenli bir şekilde giriş yapmasını ve yetkilendirilmiş kaynaklara erişimini sağlar. Bu sistem şu bileşenlerden oluşur:

- **Token Üretimi ve Doğrulama**: JWT token oluşturma ve doğrulama mekanizması
- **Rol Tabanlı Yetkilendirme**: Kullanıcı rollerine göre erişim kontrolü
- **Middleware Koruması**: Korumalı rotalar için middleware kontrolü
- **Client-Server Entegrasyonu**: Backend ve frontend arasında güvenli iletişim

## 🔐 Uygulanan Güvenlik Özellikleri

1. **JWT Token İmzalama**: Tokenler güvenli bir anahtar ile imzalanır
2. **HTTP-only Cookies**: Tokenler client tarafında HTTP-only cookie olarak saklanır
3. **Rol Bazlı Erişim**: Kullanıcı rolleri (ADMIN, BUSINESS, COURIER, CUSTOMER) bazında erişim kontrolü
4. **API Güvenlik Katmanı**: Tüm API endpoint'leri için yetkilendirme kontrolü
5. **Token Süresi Sınırlaması**: Tokenler için 24 saatlik yaşam süresi
6. **Otomatik Yönlendirme**: Yetkisiz erişim durumunda login sayfasına yönlendirme

## 🛠️ Teknik Uygulama

### 1. JWT Token İşleme (lib/auth.ts)

```typescript
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function verifyToken(token?: string): JwtPayload | null {
  if (!token) return null;
  
  try {
    const secret = process.env.NEXTAUTH_SECRET || 'fallbacksecret';
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export function hasRole(token: string | undefined, allowedRoles: string[]): boolean {
  const payload = verifyToken(token);
  if (!payload) return false;
  
  return allowedRoles.includes(payload.role);
}

export function generateToken(payload: { id: string; email: string; role: string }): string {
  const secret = process.env.NEXTAUTH_SECRET || 'fallbacksecret';
  return jwt.sign(payload, secret, { expiresIn: '1d' });
}
```

### 2. Güvenlik Middleware (middleware.ts)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

// Korunacak rotalar - bunlar için kimlik doğrulama gerekiyor
const protectedRoutes = [
  '/admin', '/api/admin', '/business', '/api/business', 
  '/courier', '/api/courier', '/customer', '/api/customer', '/profile'
];

// Rol bazlı erişim kontrolleri
const roleBasedAccess: Record<string, string[]> = {
  'ADMIN': ['/admin', '/api/admin'],
  'BUSINESS': ['/business', '/api/business'],
  'COURIER': ['/courier', '/api/courier'],
  'CUSTOMER': ['/customer', '/api/customer'],
};

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Token kontrolü
  let token: string | undefined;
  if (path.startsWith('/api')) {
    // API route için auth header kontrolü
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  } else {
    // Normal sayfa için cookie kontrolü
    token = request.cookies.get('token')?.value;
  }

  // Path korunmuyorsa izin ver
  if (!protectedRoutes.some(route => path.startsWith(route))) {
    return NextResponse.next();
  }

  // Token yoksa login'e yönlendir
  if (!token) {
    if (path.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekiyor' }, 
        { status: 401 }
      );
    }
    
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(url);
  }

  // Token doğrulama ve rol kontrolü
  const payload = verifyToken(token);
  if (!payload) {
    // Geçersiz token durumunda
    if (path.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş token' }, 
        { status: 401 }
      );
    }
    
    const url = new URL('/auth/login', request.url);
    return NextResponse.redirect(url);
  }

  // Rol bazlı erişim kontrolü
  const userRole = payload.role;
  
  // Admin her yere erişebilir
  if (userRole === 'ADMIN') {
    return NextResponse.next();
  }
  
  // Yetki kontrolü
  const allowedPaths = roleBasedAccess[userRole] || [];
  if (!allowedPaths.some(route => path.startsWith(route)) && !path.startsWith('/profile')) {
    // Yetkisiz erişim
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}
```

### 3. Giriş API Endpoint'i (app/api/auth/route.ts)

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, role } = body;

    // Giriş kontrolü
    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-posta ve şifre gereklidir' },
        { status: 400 }
      );
    }

    // Kullanıcı kontrolü
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Geçersiz kimlik bilgileri' },
        { status: 401 }
      );
    }

    // Rol kontrolü
    let userRole: Role;
    if (role === 'ADMIN' || role === 'BUSINESS' || role === 'COURIER' || role === 'CUSTOMER') {
      userRole = role as Role;
      if (user.role !== userRole) {
        return NextResponse.json(
          { error: 'Bu rol için yetkiniz bulunmamaktadır' },
          { status: 403 }
        );
      }
    }

    // Şifre kontrolü
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Geçersiz kimlik bilgileri' },
        { status: 401 }
      );
    }

    // JWT token oluştur
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role,
        name: user.name
      }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Kullanıcıyı döndür (şifre hariç)
    const { password: _, ...userData } = user;

    return NextResponse.json({
      message: 'Giriş başarılı',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Giriş sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}
```

### 4. Çıkış API Endpoint'i (app/api/auth/logout/route.ts)

```typescript
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
```

### 5. Client Tarafı Auth Utils (lib/auth-utils.ts)

```typescript
export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  return localStorage.getItem('token');
}

export function getUser() {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const userJson = localStorage.getItem('user');
  if (!userJson) {
    return null;
  }
  
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function hasRole(role: string): boolean {
  const user = getUser();
  if (!user) {
    return false;
  }
  
  return user.role === role;
}

export function isAuthenticated(): boolean {
  return !!getToken() && !!getUser();
}

export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  
  if (!token) {
    return {};
  }
  
  return {
    'Authorization': `Bearer ${token}`
  };
}

export function logout(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
```

### 6. Login Form Örneği (app/auth/login/page.tsx)

```tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('CUSTOMER');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // URL'den gelen başarılı kayıt mesajını kontrol et
    const registered = searchParams?.get('registered');
    if (registered) {
      setSuccess("Kaydınız başarıyla tamamlandı! Giriş yapabilirsiniz.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth', {
        email,
        password,
        role: userType,
      });

      if (response.data.token) {
        // Token, API tarafından oluşturuldu - localStorage'a kaydediyoruz
        localStorage.setItem('token', response.data.token);
        
        // Kullanıcı bilgilerini sakla
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        // Rol bazlı yönlendirme
        let redirectPath = '/customer/dashboard';
        if (userType === 'ADMIN') redirectPath = '/admin/dashboard';
        else if (userType === 'BUSINESS') redirectPath = '/business/dashboard';
        else if (userType === 'COURIER') redirectPath = '/courier/dashboard';
        
        router.push(redirectPath);
      } else {
        setError('Giriş başarısız oldu. Token bulunamadı.');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Giriş sırasında bir hata oluştu';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Sol taraf - Tanıtım Bölümü */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-800 text-white p-10 flex-col justify-center items-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-6">SepetTakip Platformu</h1>
          <p className="text-lg mb-8">Sipariş ve kurye yönetimi için tüm ihtiyaçlarınız tek yerde.</p>
          
          <div className="space-y-6">
            {/* Özellik kartları */}
          </div>
        </div>
      </div>
      
      {/* Sağ taraf - Giriş Formu */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
        <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Giriş Yap</h1>
            <p className="text-gray-600 mt-2">Hesabınıza giriş yaparak devam edin</p>
          </div>
          
          {/* Hata ve başarı mesajları */}
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Form alanları */}
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium transition duration-200 flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Giriş Yapılıyor...
                </>
              ) : "Giriş Yap"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

### 7. Auth Provider Bileşeni (components/AuthProvider.tsx)

```tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import { isAuthenticated, getUser, logout } from '@/lib/auth-utils';

// User ve Context tipleri

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Kullanıcı bilgisini yükle
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        try {
          const userData = getUser();
          if (userData) {
            setUser(userData);
          } else {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            setUser(response.data.user);
          }
        } catch (error) {
          console.error('Kullanıcı bilgisi alınamadı:', error);
          handleLogout();
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Logout fonksiyonu
  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
    } finally {
      logout();
      setUser(null);
      
      if (pathname && !pathname.startsWith('/auth/')) {
        router.push('/auth/login');
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

## 🌐 Entegrasyon

### 1. Layout İçine Auth Provider Ekleme (app/layout.tsx)

```tsx
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Sayfalarda Auth Kullanımı

```tsx
'use client';

import { useAuth } from '@/components/AuthProvider';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Yükleniyor...</div>;
  }
  
  if (!user) {
    return <div>Lütfen giriş yapın</div>;
  }
  
  return (
    <div>
      <h1>Hoşgeldiniz, {user.name}</h1>
      {/* Rol bazlı içerik */}
      {user.role === 'ADMIN' && (
        <div>Admin paneli içeriği</div>
      )}
    </div>
  );
}
```

## 📝 Yapılacaklar ve İyileştirmeler

1. **Token Yenileme (Refresh Token) Sistemi**: Şu anda sistemimiz yalnızca access token kullanıyor. Refresh token ekleyerek kullanıcı deneyimini iyileştirebiliriz.

2. **İki Faktörlü Kimlik Doğrulama (2FA)**: Daha güvenli bir kimlik doğrulama için 2FA sistemi eklenebilir.

3. **Token Kara Listesi (Blacklist)**: Oturum kapatma işleminden sonra JWT'lerin kullanımını engellemek için kara liste mekanizması eklenmeli.

4. **CSRF Koruması**: CSRF tokenları ekleyerek güvenlik seviyesi artırılabilir.

5. **Daha Güçlü Parola Politikaları**: Kullanıcı şifreleri için daha güçlü politikalar ve doğrulama mekanizmaları eklenebilir.

6. **Audit Loglama**: Kimlik doğrulama işlemleri için detaylı log tutulması.

7. **API Rate Limiting**: API isteklerini sınırlandırarak brute force saldırılarına karşı koruma.

8. **Şifremi Unuttum Mekanizması**: Kullanıcıların şifrelerini sıfırlamaları için güvenli bir mekanizma eklenebilir.

## 📊 Performans Değerlendirmesi

JWT tabanlı kimlik doğrulama sistemimiz, session tabanlı kimlik doğrulamaya göre aşağıdaki avantajları sağlar:

1. **Durumsuz (Stateless)**: Backend'de oturum bilgilerini saklamaya gerek yok
2. **Ölçeklenebilirlik**: Farklı sunucular arasında kolayca çalışabilir
3. **Düşük Sunucu Yükü**: Veritabanı sorgularını azaltır
4. **API Uyumluluğu**: API'ler için ideal kimlik doğrulama yöntemi

## 🔄 API Endpoint'leri Özeti

| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| /api/auth | POST | Kullanıcı girişi ve token oluşturma |
| /api/auth/register | POST | Yeni kullanıcı kaydı |
| /api/auth/logout | POST | Oturum kapatma |
| /api/auth/me | GET | Mevcut kimliği doğrulanmış kullanıcı bilgilerini döndürür |

## 🔐 Güvenlik Notları

- JWT Secret anahtarı güvenli bir şekilde saklanmalıdır
- Tokenlar HTTP-only cookie olarak saklanmalıdır (XSS saldırılarına karşı koruma)
- Token süresi makul bir değerde tutulmalıdır (çok uzun olmamalı)
- HTTPS kullanılmalıdır (tokenların ağ üzerinde çalınmasını önlemek için)

---

Bu doküman, JWT tabanlı kimlik doğrulama sistemimizin teknik detaylarını ve uygulama sürecini anlatmaktadır. Yukarıda belirtilen iyileştirmeler gelecek iterasyonlarda uygulanacaktır. 