# Teslimat Yönetim Sistemi Dokümantasyonu

Bu doküman, SepetTakip platformunun teslimat yönetim sisteminin teknik detaylarını ve işleyişini açıklamaktadır.

## 📋 Genel Bakış

Teslimat Yönetim Sistemi, siparişlerin oluşturulmasından teslim edilmesine kadar tüm süreçleri yönetmek için tasarlanmış kapsamlı bir modüldür. Sistem aşağıdaki temel bileşenlerden oluşmaktadır:

- **Sipariş Yönetimi**: Siparişlerin oluşturulması, takibi ve güncellenmesi
- **Kurye Yönetimi**: Kuryelerin atanması, rota optimizasyonu ve performans takibi
- **Gerçek Zamanlı Takip**: Teslimatların harita üzerinde canlı takibi
- **Bölge Yönetimi**: Teslimat bölgelerinin tanımlanması ve yönetimi
- **Bildirim Sistemi**: Sipariş durumu güncellemeleri için otomatik bildirimler

## 🛠️ Teknik Mimari

### Veri Modelleri

#### Delivery (Teslimat) Modeli
```prisma
model Delivery {
  id                String            @id @default(uuid())
  orderId           String            @unique
  order             Order             @relation(fields: [orderId], references: [id])
  status            DeliveryStatus    @default(PENDING)
  courierId         String?
  courier           Courier?          @relation(fields: [courierId], references: [id])
  assignedAt        DateTime?
  startedAt         DateTime?
  completedAt       DateTime?
  estimatedArrival  DateTime?
  actualRoute       Json?             // Gerçekte izlenen rota (koordinat dizisi)
  plannedRoute      Json?             // Planlanan rota (koordinat dizisi)
  notes             String?
  trackingCode      String            @unique @default(uuid())
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  locationUpdates   LocationUpdate[]
  deliveryProof     DeliveryProof?
}

enum DeliveryStatus {
  PENDING       // Beklemede
  ASSIGNED      // Kurye atandı
  PICKED_UP     // Teslimata çıkıldı
  IN_TRANSIT    // Yolda
  DELAYED       // Gecikme var
  COMPLETED     // Tamamlandı
  FAILED        // Başarısız
  CANCELLED     // İptal edildi
}
```

#### Order (Sipariş) Modeli
```prisma
model Order {
  id              String          @id @default(uuid())
  customerId      String
  customer        User            @relation(fields: [customerId], references: [id])
  businessId      String
  business        Business        @relation(fields: [businessId], references: [id])
  items           OrderItem[]
  totalAmount     Float
  status          OrderStatus     @default(PENDING)
  paymentStatus   PaymentStatus   @default(UNPAID)
  paymentMethod   PaymentMethod?
  notes           String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  delivery        Delivery?
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  READY_FOR_DELIVERY
  DELIVERING
  COMPLETED
  CANCELLED
  REFUNDED
}
```

#### Courier (Kurye) Modeli
```prisma
model Courier {
  id              String           @id @default(uuid())
  userId          String           @unique
  user            User             @relation(fields: [userId], references: [id])
  status          CourierStatus    @default(INACTIVE)
  currentLocation Json?            // { lat: number, lng: number }
  lastLocationUpdate DateTime?
  vehicleType     VehicleType      @default(MOTORCYCLE)
  vehiclePlate    String?
  activeRegionId  String?
  activeRegion    Region?          @relation(fields: [activeRegionId], references: [id])
  rating          Float            @default(0)
  deliveries      Delivery[]
  locationUpdates LocationUpdate[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

enum CourierStatus {
  ACTIVE         // Aktif, teslimat yapabilir
  INACTIVE       // İnaktif, teslimat alamaz
  DELIVERING     // Teslimat yapıyor
  ON_BREAK       // Molada
}
```

### API Endpoint'leri

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/deliveries` | GET | Tüm teslimatların listesini getirir |
| `/api/deliveries` | POST | Yeni bir teslimat oluşturur |
| `/api/deliveries/:id` | GET | Belirli bir teslimatın detaylarını getirir |
| `/api/deliveries/:id` | PATCH | Bir teslimatın durumunu günceller |
| `/api/deliveries/:id/assign` | POST | Bir teslimatı bir kuryeye atar |
| `/api/deliveries/:id/track` | GET | Teslimat takip bilgilerini getirir |
| `/api/deliveries/:id/proof` | POST | Teslimat kanıtı (fotoğraf, imza) yükler |
| `/api/couriers` | GET | Aktif kuryelerin listesini getirir |
| `/api/couriers/:id/location` | PATCH | Kurye konumunu günceller |
| `/api/couriers/:id/status` | PATCH | Kurye durumunu günceller |
| `/api/orders/:id/delivery` | POST | Belirli bir sipariş için teslimat oluşturur |

## 💻 Teslimat İş Akışı

### 1. Sipariş Oluşturma ve Onaylama

```typescript
async function createOrder(orderData: OrderCreateInput): Promise<Order> {
  // Sipariş verilerini doğrula
  validateOrderData(orderData);
  
  // Siparişi veritabanına kaydet
  const order = await prisma.order.create({
    data: {
      customerId: orderData.customerId,
      businessId: orderData.businessId,
      totalAmount: calculateTotalAmount(orderData.items),
      status: 'PENDING',
      paymentStatus: orderData.paymentMethod === 'CASH' ? 'UNPAID' : 'PAID',
      paymentMethod: orderData.paymentMethod,
      items: {
        create: orderData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      }
    },
    include: {
      items: true,
      customer: true,
      business: true
    }
  });
  
  // Siparişi onaylamak için işletmeye bildirim gönder
  await sendNotification({
    userId: order.business.userId,
    type: 'NEW_ORDER',
    title: 'Yeni Sipariş',
    message: `#${order.id} numaralı yeni bir sipariş alındı.`,
    data: { orderId: order.id }
  });
  
  return order;
}

async function confirmOrder(orderId: string): Promise<Order> {
  // Siparişi bul ve durumunu onayla
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status: 'CONFIRMED' },
    include: { customer: true }
  });
  
  // Müşteriye bildirim gönder
  await sendNotification({
    userId: order.customerId,
    type: 'ORDER_CONFIRMED',
    title: 'Sipariş Onaylandı',
    message: `#${order.id} numaralı siparişiniz onaylandı ve hazırlanıyor.`,
    data: { orderId: order.id }
  });
  
  return order;
}
```

### 2. Teslimat Oluşturma

```typescript
async function createDelivery(orderId: string): Promise<Delivery> {
  // Siparişi kontrol et
  const order = await prisma.order.findUnique({
    where: { id: orderId }
  });
  
  if (!order || order.status !== 'READY_FOR_DELIVERY') {
    throw new Error('Sipariş teslimat için hazır değil');
  }
  
  // Teslimat oluştur
  const delivery = await prisma.delivery.create({
    data: {
      orderId,
      status: 'PENDING',
      trackingCode: generateTrackingCode(),
    },
    include: {
      order: {
        include: {
          customer: true,
          business: true
        }
      }
    }
  });
  
  // Siparişi güncelle
  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'DELIVERING' }
  });
  
  // Yakındaki uygun kuryelere bildirim gönder
  await notifyAvailableCouriers(delivery);
  
  return delivery;
}
```

### 3. Kurye Atama ve Rota Planlama

```typescript
async function assignCourierToDelivery(deliveryId: string, courierId: string): Promise<Delivery> {
  // Kurye ve teslimat bilgilerini al
  const [courier, delivery] = await Promise.all([
    prisma.courier.findUnique({ where: { id: courierId } }),
    prisma.delivery.findUnique({ 
      where: { id: deliveryId },
      include: { order: { include: { customer: true, business: true } } }
    })
  ]);
  
  if (!courier || !delivery) {
    throw new Error('Kurye veya teslimat bulunamadı');
  }
  
  if (courier.status !== 'ACTIVE') {
    throw new Error('Kurye şu anda aktif değil');
  }
  
  // Teslimat süresini tahmin et
  const estimatedArrival = calculateEstimatedArrival(
    courier.currentLocation,
    delivery.order.business.location,
    delivery.order.customer.address
  );
  
  // Rotayı planla
  const plannedRoute = await planDeliveryRoute(
    courier.currentLocation,
    delivery.order.business.location,
    delivery.order.customer.address
  );
  
  // Teslimat kaydını güncelle
  const updatedDelivery = await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      courierId,
      status: 'ASSIGNED',
      assignedAt: new Date(),
      estimatedArrival,
      plannedRoute
    }
  });
  
  // Kurye durumunu güncelle
  await prisma.courier.update({
    where: { id: courierId },
    data: { status: 'DELIVERING' }
  });
  
  // Müşteriye bildirim gönder
  await sendNotification({
    userId: delivery.order.customerId,
    type: 'COURIER_ASSIGNED',
    title: 'Kurye Atandı',
    message: `Siparişiniz için ${courier.user.name} isimli kurye atandı. Tahmini varış: ${formatTime(estimatedArrival)}`,
    data: { deliveryId, trackingCode: delivery.trackingCode }
  });
  
  return updatedDelivery;
}
```

### 4. Teslimat Takibi ve Güncelleme

```typescript
async function updateCourierLocation(courierId: string, location: { lat: number, lng: number }): Promise<void> {
  // Kurye konumunu güncelle
  await prisma.courier.update({
    where: { id: courierId },
    data: {
      currentLocation: location,
      lastLocationUpdate: new Date()
    }
  });
  
  // Aktif teslimatı bul
  const activeDelivery = await prisma.delivery.findFirst({
    where: {
      courierId,
      status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] }
    },
    include: {
      order: { include: { customer: true } }
    }
  });
  
  if (activeDelivery) {
    // Konum güncellemesini kaydet
    await prisma.locationUpdate.create({
      data: {
        deliveryId: activeDelivery.id,
        courierId,
        location,
        timestamp: new Date()
      }
    });
    
    // Gerçek rotayı güncelle
    const existingRoute = activeDelivery.actualRoute as any[] || [];
    await prisma.delivery.update({
      where: { id: activeDelivery.id },
      data: {
        actualRoute: [...existingRoute, { ...location, timestamp: new Date() }]
      }
    });
    
    // Teslimat durumunu güncelle (gerekirse)
    await updateDeliveryStatusBasedOnLocation(activeDelivery, location);
  }
}

async function updateDeliveryStatus(deliveryId: string, status: DeliveryStatus, notes?: string): Promise<Delivery> {
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      order: {
        include: {
          customer: true
        }
      },
      courier: {
        include: {
          user: true
        }
      }
    }
  });
  
  if (!delivery) {
    throw new Error('Teslimat bulunamadı');
  }
  
  // Duruma göre ek alanları güncelle
  const additionalData: any = { status };
  
  if (notes) {
    additionalData.notes = notes;
  }
  
  if (status === 'PICKED_UP') {
    additionalData.startedAt = new Date();
  } else if (status === 'COMPLETED') {
    additionalData.completedAt = new Date();
  }
  
  // Teslimatı güncelle
  const updatedDelivery = await prisma.delivery.update({
    where: { id: deliveryId },
    data: additionalData
  });
  
  // Sipariş durumunu güncelle
  let orderStatus: OrderStatus | null = null;
  
  if (status === 'COMPLETED') {
    orderStatus = 'COMPLETED';
  } else if (status === 'FAILED' || status === 'CANCELLED') {
    orderStatus = 'CANCELLED';
  }
  
  if (orderStatus) {
    await prisma.order.update({
      where: { id: delivery.orderId },
      data: { status: orderStatus }
    });
  }
  
  // Bildirim gönder
  await sendDeliveryStatusNotification(updatedDelivery);
  
  return updatedDelivery;
}
```

### 5. Teslimat Tamamlama ve Onaylama

```typescript
async function completeDelivery(deliveryId: string, proof: DeliveryProofInput): Promise<Delivery> {
  // Teslimat kanıtını kaydet
  await prisma.deliveryProof.create({
    data: {
      deliveryId,
      type: proof.type,
      image: proof.image,
      signature: proof.signature,
      notes: proof.notes
    }
  });
  
  // Teslimat durumunu tamamlandı olarak güncelle
  const delivery = await updateDeliveryStatus(deliveryId, 'COMPLETED');
  
  // Kurye durumunu aktif olarak güncelle
  await prisma.courier.update({
    where: { id: delivery.courierId! },
    data: { status: 'ACTIVE' }
  });
  
  // Müşteriden değerlendirme iste
  await requestDeliveryRating(delivery);
  
  return delivery;
}
```

## 📱 Teslimat Takip Arayüzü

### Müşteri Takip Sayfası

Müşteriler, kendilerine verilen benzersiz takip kodu ile teslimatlarını aşağıdaki özellikleri kullanarak takip edebilirler:

- Gerçek zamanlı kurye konumu
- Tahmini varış süresi
- Teslimat durum güncellemeleri
- Kurye bilgileri ve iletişim seçenekleri

```tsx
function CustomerTrackingPage({ trackingCode }) {
  const [delivery, setDelivery] = useState(null);
  const [courierLocation, setCourierLocation] = useState(null);
  
  useEffect(() => {
    // Teslimat bilgilerini al
    fetchDeliveryDetails(trackingCode);
    
    // Gerçek zamanlı konum güncellemelerini dinle
    const locationSubscription = subscribeToLocationUpdates(trackingCode, (location) => {
      setCourierLocation(location);
    });
    
    return () => {
      // Cleanup
      locationSubscription.unsubscribe();
    };
  }, [trackingCode]);
  
  // Render harita ve teslimat bilgileri
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">Teslimat Takibi</h1>
          <p className="text-gray-600">Takip Kodu: {trackingCode}</p>
          
          {delivery && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Durum</h2>
                  <p className="text-blue-600">{getStatusText(delivery.status)}</p>
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Tahmini Varış</h2>
                  <p className="text-blue-600">{formatTime(delivery.estimatedArrival)}</p>
                </div>
              </div>
              
              {/* Teslimat durum çubuğu */}
              <DeliveryStatusBar status={delivery.status} />
              
              {/* Harita */}
              <div className="h-64 bg-gray-100 rounded-lg mt-6">
                <DeliveryMap 
                  businessLocation={delivery.order.business.location}
                  customerLocation={delivery.order.customer.address.location}
                  courierLocation={courierLocation}
                  plannedRoute={delivery.plannedRoute}
                />
              </div>
              
              {/* Kurye bilgileri */}
              {delivery.courier && (
                <div className="mt-6 border-t pt-4">
                  <h2 className="text-lg font-semibold">Kurye Bilgileri</h2>
                  <div className="flex items-center mt-2">
                    <img 
                      src={delivery.courier.user.avatar || '/default-avatar.png'} 
                      alt="Kurye" 
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <div>
                      <p className="font-medium">{delivery.courier.user.name}</p>
                      <div className="flex items-center mt-1">
                        <StarRating value={delivery.courier.rating} />
                        <span className="text-gray-600 text-sm ml-2">
                          ({delivery.courier.rating.toFixed(1)})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Kurye Arayüzü

Kuryeler için özel olarak tasarlanmış, mobil uyumlu arayüz aşağıdaki özellikleri içerir:

- Aktif teslimat listesi
- Rota navigasyonu
- Teslimat durum güncelleme
- Teslimat kanıtı (fotoğraf/imza) yükleme
- Acil durum bildirimi

## 📊 Performans Metrikleri

Sistem, teslimat performansını ölçmek için aşağıdaki metrikleri takip eder:

1. **Ortalama Teslimat Süresi**: Siparişin onaylanmasından teslim edilmesine kadar geçen süre
2. **Teslimat Başarı Oranı**: Başarıyla tamamlanan teslimatların yüzdesi
3. **Kurye Performansı**: Her kurye için ortalama teslimat süresi ve müşteri değerlendirmesi
4. **Zamanında Teslimat Oranı**: Tahmini süreler dahilinde tamamlanan teslimatların yüzdesi
5. **Teslimat Yoğunluğu Haritası**: Bölgelere göre teslimat yoğunluğu analizi

## 📝 Eksik Kalan Özellikler ve İyileştirmeler

1. **Toplu Teslimat Optimizasyonu**: Bir kurye için birden fazla teslimatın rota optimizasyonu
2. **Dinamik Ücretlendirme**: Mesafe, trafik ve hava durumuna göre dinamik teslimat ücretlendirme
3. **İleri Seviye Rota Optimizasyonu**: Trafik, hava koşulları ve geçmiş veriler baz alınarak rota planlaması
4. **Otomatik Kurye Eşleştirme**: Yapay zeka tabanlı en uygun kurye eşleştirme algoritması
5. **İletişim Modülü**: Kurye ve müşteri arasında anonim iletişim kanalı
6. **Gelişmiş Teslimat Kanıtları**: QR kod tarama, NFC etiketleri gibi güvenli teslimat doğrulama yöntemleri
7. **İkinci Teslimat Planlaması**: Başarısız teslimatlar için otomatik yeniden planlama
8. **Trafik ve Hava Durumu Entegrasyonu**: Gerçek zamanlı trafik ve hava durumu verilerinin kullanılması

## 🔄 Entegrasyon Noktaları

Teslimat yönetim sistemi, aşağıdaki sistemlerle entegre çalışmaktadır:

1. **Sipariş Yönetimi**: Siparişlerin teslimat için hazırlanması
2. **Kullanıcı Yönetimi**: Müşteri ve kurye bilgilerinin yönetimi
3. **Bildirim Sistemi**: Teslimat durumu güncellemeleri için otomatik bildirimler
4. **Ödeme Sistemi**: Kapıda ödeme seçeneği için entegrasyon
5. **Raporlama Sistemi**: Teslimat performansı raporları

---

Bu dokümantasyon, SepetTakip platformunun teslimat yönetim sisteminin genel yapısını ve işleyişini özetlemektedir. Sistem sürekli olarak geliştirilmekte ve yeni özellikler eklenmektedir. 