# Proje Sorunları ve Çözüm Adımları

Bu dokümanda tespit edilen temel sorunlar ve bunların çözüm adımları listelenmiştir. Her sorun için adım adım izlenecek yollar ve dikkat edilecek noktalar belirtilmiştir.

## 1. Veritabanı Bağlantısı ve Model Sorunları

### Sorun 1.1: Prisma şema doğrulama hatası
- **Hata:** Order modelinde `items`, `customer` ve `courier` ilişkileri hatası
- **Çözüm:**
  - `prisma/schema.prisma` dosyasında Order modelinin ilişkilerini düzeltme
  - `npx prisma generate` komutu ile şemayı güncelleme
  - `npx prisma db push` komutu ile veritabanını güncelleme

```prisma
model Order {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  status    Status   @default(PENDING)

  // Order details
  totalPrice        Float
  items             Json     // Array of items with quantities, prices, etc
  address           String
  notes             String?
  estimatedDelivery DateTime?
  actualDelivery    DateTime?

  // Relations to other models
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])
  
  businessId String
  business   Business @relation(fields: [businessId], references: [id])
  
  courierId  String?
  courier    Courier? @relation(fields: [courierId], references: [id])
}
```

## 2. API Endpoint Sorunları

### Sorun 2.1: `/api/orders` endpoint'inde data fetch sorunu ve TypeScript hataları
- **Hata:** Order verilerini getirirken ve güncellerken include yapısı ve Status enum kullanımında hatalar
- **Çözüm:**
  - `app/api/orders/route.ts` dosyasında include yapısını düzeltme:

```typescript
// Doğru kullanım
const orders = await prisma.order.findMany({
  where: filters,
  include: {
    customer: true,
    business: true,
    courier: true
  },
  skip: skip,
  take: take,
  orderBy: { createdAt: 'desc' }
});
```

### Sorun 2.2: `/api/couriers/location` endpoint'indeki konum güncelleme sorunu
- **Hata:** Kurye konum güncellemesi yapılırken Prisma model alanlarının uyuşmaması
- **Çözüm:**
  - `app/api/couriers/location/route.ts` dosyasında doğru alan isimlerini kullanma:

```typescript
const updatedCourier = await prisma.courier.update({
  where: {
    id: courier.id,
  },
  data: {
    currentLatitude: latitude,
    currentLongitude: longitude,
    lastLocationUpdate: new Date(),
  },
});
```

## 3. Yetkilendirme ve Oturum Yönetimi Sorunları

### Sorun 3.1: Token doğrulama ve rol tabanlı erişim sorunları
- **Hata:** API endpoint'lerinde ve sayfa erişimlerinde yetki ve rol kontrolü sorunları
- **Çözüm:**
  - `middleware.ts` dosyasında token doğrulama işlemini gözden geçirme
  - Rol çıkarımı ve kontrolünü düzeltme:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  
  try {
    const payload = await verifyJWT(token)
    
    if (!payload) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    // Rol tabanlı erişim kontrolü
    const { role } = payload
    const path = request.nextUrl.pathname
    
    // Admin routes
    if (path.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    // Business routes
    if (path.startsWith('/business') && role !== 'BUSINESS') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    // Courier routes
    if (path.startsWith('/courier') && role !== 'COURIER') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    // Customer routes
    if (path.startsWith('/customer') && role !== 'CUSTOMER') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    return NextResponse.next()
  } catch (error) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/business/:path*',
    '/courier/:path*',
    '/customer/:path*',
    '/api/((?!auth).*)' // API routes except auth
  ]
}
```

## 4. UI ve Frontend Sorunları

### Sorun 4.1: Kurye dashboard sayfasındaki konum güncelleme hatası
- **Hata:** Kurye konum güncellemesi yapılırken API endpoint hataları
- **Çözüm:**
  - Kurye Dashboard'unda konum güncelleme işlemini düzeltme:

```typescript
const updateCourierLocation = async () => {
  if (!isLocationEnabled) {
    setLocationError('Konum erişimi etkin değil. Lütfen konum izni verin.');
    return;
  }
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        setIsUpdatingLocation(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setLocationError('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
          return;
        }
        
        const response = await axios.patch('/api/couriers/location', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setLastLocationUpdate(new Date());
        setLocationError('');
        
        toast({
          title: "Konum güncellendi",
          description: "Konumunuz başarıyla güncellendi.",
          variant: "default",
        });
      } catch (err) {
        console.error('Konum güncelleme hatası:', err);
        setLocationError('Konum güncellemesi başarısız: ' + (err.response?.data?.error || err.message));
        
        toast({
          title: "Konum güncellemesi başarısız",
          description: err.response?.data?.error || err.message,
          variant: "destructive",
        });
      } finally {
        setIsUpdatingLocation(false);
      }
    },
    (err) => {
      console.error('Tarayıcı konum hatası:', err);
      setLocationError(`Tarayıcı konum hatası: ${err.message}`);
      setIsUpdatingLocation(false);
    }
  );
};
```

### Sorun 4.2: UI component'lerindeki uyum sorunları ve eksik bildirim bileşenleri
- **Hata:** Toast bildirimleri, modal'lar ve diğer UI component'lerinin çalışmaması
- **Çözüm:**
  - Toast bileşenlerini oluşturma ve doğru import etme

```typescript
// app/components/ui/toast.tsx ve use-toast.ts dosyalarını oluşturma
// app/components/ui/toaster.tsx dosyasını oluşturma

// app/layout.tsx'de Toaster'ı ekleme
import { Toaster } from "@/components/ui/toaster"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

## 5. Rol Tabanlı Erişim Sorunları

### Sorun 5.1: Login sonrası kullanıcının rolüne göre doğru sayfaya yönlendirilmemesi
- **Hata:** Kullanıcılar giriş yaptıktan sonra rollerine göre doğru panellere yönlendirilmiyor
- **Çözüm:**
  - `app/auth/login/page.tsx` dosyasında login işlemi sonrası yönlendirme mantığını düzeltme:

```typescript
const handleLogin = async (data: z.infer<typeof formSchema>) => {
  try {
    setIsLoading(true);
    
    const response = await axios.post('/api/auth/login', {
      email: data.email,
      password: data.password
    });
    
    const { token, user } = response.data;
    
    // Token'ı ve kullanıcı bilgilerini kaydetme
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Rolüne göre yönlendirme
    switch (user.role) {
      case 'ADMIN':
        router.push('/admin/dashboard');
        break;
      case 'BUSINESS':
        router.push('/business/dashboard');
        break;
      case 'COURIER':
        router.push('/courier/dashboard');
        break;
      case 'CUSTOMER':
        router.push('/customer/dashboard');
        break;
      default:
        router.push('/');
    }
    
    toast({
      title: "Giriş başarılı",
      description: "Hesabınıza giriş yaptınız",
      variant: "default",
    });
  } catch (error: any) {
    console.error("Login error:", error);
    setError(error.response?.data?.error || "Giriş işlemi sırasında bir hata oluştu");
    
    toast({
      title: "Giriş başarısız",
      description: error.response?.data?.error || "Giriş yapılamadı",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};
```

## 6. Örnek Veri ve Seed Sorunları

### Sorun 6.1: Seed script çalışmaması ve örnek veri yüklenmesi
- **Hata:** Seed script TypeScript ve Prisma uyumsuzluğundan dolayı çalışmıyor
- **Çözüm:**
  - `prisma/seed.ts` dosyasını düzeltme
  - `package.json` dosyasında seed komutunu düzenleme:

```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
},
```

## 7. API Endpoint Testi ve Kontrol Listesi

Aşağıdaki API endpoint'lerinin test edilmesi ve sorunlarının giderilmesi gerekmektedir:

### 7.1 Yetkilendirme Endpoint'leri
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`

### 7.2 Sipariş Endpoint'leri 
- `GET /api/orders` - Tüm siparişleri listeler
- `POST /api/orders` - Yeni sipariş oluşturur
- `GET /api/orders/[id]` - Belirli bir siparişin detaylarını getirir
- `PATCH /api/orders/[id]` - Sipariş bilgilerini günceller
- `DELETE /api/orders/[id]` - Sipariş siler

### 7.3 Kurye Endpoint'leri
- `GET /api/couriers` - Tüm kuryeleri listeler
- `PATCH /api/couriers/location` - Kurye konumunu günceller
- `GET /api/courier/deliveries` - Kuryeye atanmış teslimatları listeler

## 8. Ek İyileştirmeler

### 8.1 Türkçe metinlerin İngilizce ile değiştirilmesi veya dil desteği eklenmesi
- Dashboard ve UI'daki Türkçe metinleri gözden geçirme
- İngilizce metinlere geçiş veya çoklu dil desteği ekleme

### 8.2 Tarih formatlarının standartlaştırılması
- `utils.ts` dosyasında tarih formatlama fonksiyonlarını düzenleme

### 8.3 Error handling ve loading state'lerinin iyileştirilmesi
- Tüm API çağrılarında try-catch blokları ve loading state'lerin kullanılması

## 9. Çözüm Adımları Önceliklendirmesi

1. Veritabanı bağlantısı ve Prisma model sorunlarını çözme
2. API endpoint hatalarını düzeltme
3. Yetkilendirme ve rol tabanlı erişim sistemini düzeltme 
4. UI component'leri ve frontend sorunlarını giderme
5. Seed ve örnek veri sorunlarını çözme
6. Tüm API endpoint'lerini test etme
7. Ek iyileştirmeleri yapma

Bu sorunlar adım adım çözüldüğünde platformun temel işlevleri doğru çalışacak ve kullanıcılar rollerine göre sayfalara erişebileceklerdir. 