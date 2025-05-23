-- SepetTakip Staging Veritabanı Test Verileri
-- Bu script, test ortamı için gerekli örnek verileri oluşturur.

-- Test Kullanıcıları
INSERT INTO "users" ("id", "email", "password", "name", "role", "createdAt", "updatedAt")
VALUES
    -- Admin kullanıcıları
    ('11111111-1111-1111-1111-111111111111', 'admin@sepettakip.com', '$2a$10$Cv8TuUtZP1pW.OgxFjNZBuIeoHJO4Qkm2zBmHxQTaEHUFOz9U2CUy', 'Yönetici Kullanıcı', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-222222222222', 'superadmin@sepettakip.com', '$2a$10$Cv8TuUtZP1pW.OgxFjNZBuIeoHJO4Qkm2zBmHxQTaEHUFOz9U2CUy', 'Süper Yönetici', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- İşletme kullanıcıları
    ('33333333-3333-3333-3333-333333333333', 'kebapci@example.com', '$2a$10$Cv8TuUtZP1pW.OgxFjNZBuIeoHJO4Qkm2zBmHxQTaEHUFOz9U2CUy', 'Kebapçı İşletmesi', 'BUSINESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-444444444444', 'pizzaci@example.com', '$2a$10$Cv8TuUtZP1pW.OgxFjNZBuIeoHJO4Qkm2zBmHxQTaEHUFOz9U2CUy', 'Pizza İşletmesi', 'BUSINESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('55555555-5555-5555-5555-555555555555', 'pastane@example.com', '$2a$10$Cv8TuUtZP1pW.OgxFjNZBuIeoHJO4Qkm2zBmHxQTaEHUFOz9U2CUy', 'Pastane İşletmesi', 'BUSINESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- Kurye kullanıcıları
    ('66666666-6666-6666-6666-666666666666', 'kurye1@example.com', '$2a$10$Cv8TuUtZP1pW.OgxFjNZBuIeoHJO4Qkm2zBmHxQTaEHUFOz9U2CUy', 'Ahmet Kurye', 'COURIER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('77777777-7777-7777-7777-777777777777', 'kurye2@example.com', '$2a$10$Cv8TuUtZP1pW.OgxFjNZBuIeoHJO4Qkm2zBmHxQTaEHUFOz9U2CUy', 'Mehmet Kurye', 'COURIER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('88888888-8888-8888-8888-888888888888', 'kurye3@example.com', '$2a$10$Cv8TuUtZP1pW.OgxFjNZBuIeoHJO4Qkm2zBmHxQTaEHUFOz9U2CUy', 'Ayşe Kurye', 'COURIER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- Müşteri kullanıcıları
    ('99999999-9999-9999-9999-999999999999', 'musteri1@example.com', '$2a$10$Cv8TuUtZP1pW.OgxFjNZBuIeoHJO4Qkm2zBmHxQTaEHUFOz9U2CUy', 'Ali Müşteri', 'CUSTOMER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'musteri2@example.com', '$2a$10$Cv8TuUtZP1pW.OgxFjNZBuIeoHJO4Qkm2zBmHxQTaEHUFOz9U2CUy', 'Veli Müşteri', 'CUSTOMER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'musteri3@example.com', '$2a$10$Cv8TuUtZP1pW.OgxFjNZBuIeoHJO4Qkm2zBmHxQTaEHUFOz9U2CUy', 'Fatma Müşteri', 'CUSTOMER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Admin profilleri
INSERT INTO "admins" ("id", "userId", "department", "level", "permissions", "title", "phone", "isSuperAdmin")
VALUES
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'IT', 2, ARRAY['user_management', 'business_management', 'reports'], 'Sistem Yöneticisi', '+905551112233', false),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Yönetim', 3, ARRAY['all'], 'Genel Müdür', '+905551112244', true);

-- Bölgeler
INSERT INTO "zones" ("id", "name", "description", "coordinates", "createdAt", "updatedAt", "averageDeliveryTime", "orderVolume", "activeBusinesses")
VALUES
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Kadıköy', 'İstanbul Kadıköy bölgesi', '{"type": "Polygon", "coordinates": [[[29.02, 40.98], [29.05, 40.98], [29.05, 41.00], [29.02, 41.00], [29.02, 40.98]]]}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 45, 120, 25),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Beşiktaş', 'İstanbul Beşiktaş bölgesi', '{"type": "Polygon", "coordinates": [[[29.00, 41.03], [29.03, 41.03], [29.03, 41.05], [29.00, 41.05], [29.00, 41.03]]]}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 40, 150, 30),
    ('a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a7a7', 'Ümraniye', 'İstanbul Ümraniye bölgesi', '{"type": "Polygon", "coordinates": [[[29.10, 41.01], [29.13, 41.01], [29.13, 41.03], [29.10, 41.03], [29.10, 41.01]]]}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 50, 100, 20);

-- İşletmeler
INSERT INTO "businesses" ("id", "userId", "name", "description", "address", "phone", "website", "email", "logoUrl", "coverUrl", "latitude", "longitude", "zoneId", "status", "rating", "tax_id", "bank_iban", "createdAt", "updatedAt", "openingTime", "closingTime", "deliveryRadius", "deliveryFee", "type", "tags", "features")
VALUES
    ('abe123de-a1b2-3cd4-e5f6-a1b2c3d4e5f6', '33333333-3333-3333-3333-333333333333', 'Meşhur Adana Kebapçısı', 'En lezzetli Adana kebaplar', 'Kadıköy Merkez Mahallesi No:10', '+902161112233', 'www.adanakebap.com', 'info@adanakebap.com', 'https://sepettakip.com/images/logos/kebapci.png', 'https://sepettakip.com/images/covers/kebapci.jpg', 40.9901, 29.0236, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ACTIVE', 4.7, '1234567890', 'TR123456789012345678901234', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_DATE + '09:00'::time, CURRENT_DATE + '23:00'::time, 5.0, 15.0, 'Kebapçı', ARRAY['kebap', 'türk mutfağı', 'ızgara'], ARRAY['online ödeme', 'indirim']),
    
    ('bcd234ef-b2c3-4de5-f6a1-b2c3d4e5f6a1', '44444444-4444-4444-4444-444444444444', 'İtalyan Pizzacı', 'Otantik İtalyan Lezzetleri', 'Beşiktaş Merkez Caddesi No:25', '+902122223344', 'www.italianpizza.com', 'info@italianpizza.com', 'https://sepettakip.com/images/logos/pizza.png', 'https://sepettakip.com/images/covers/pizza.jpg', 41.0420, 29.0094, 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'ACTIVE', 4.5, '2345678901', 'TR234567890123456789012345', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_DATE + '10:00'::time, CURRENT_DATE + '22:00'::time, 4.0, 20.0, 'Pizzacı', ARRAY['pizza', 'italyan', 'makarna'], ARRAY['online ödeme', 'indirim', 'içecek menüleri']),
    
    ('cde345fa-c3d4-5ef6-a1b2-c3d4e5f6a1b2', '55555555-5555-5555-5555-555555555555', 'Şekerci Pastane', 'En tatlı tatlılar', 'Ümraniye Çarşı No:45', '+902163334455', 'www.sekercipastane.com', 'info@sekercipastane.com', 'https://sepettakip.com/images/logos/pastane.png', 'https://sepettakip.com/images/covers/pastane.jpg', 41.0128, 29.1183, 'a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a7a7', 'ACTIVE', 4.8, '3456789012', 'TR345678901234567890123456', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_DATE + '08:00'::time, CURRENT_DATE + '20:00'::time, 3.0, 10.0, 'Pastane', ARRAY['tatlı', 'pasta', 'börek'], ARRAY['online ödeme', 'özel sipariş']);

-- Kuryeler
INSERT INTO "couriers" ("id", "userId", "status", "vehicleType", "phone", "zoneId", "ratings", "currentLatitude", "currentLongitude", "lastLocationUpdate", "availableFrom", "availableTo", "documentsVerified", "backgroundChecked", "maxDeliveriesPerDay", "maxDistance", "averageSpeed", "courierFee")
VALUES
    ('def456ab-d4e5-6fa1-b2c3-d4e5f6a1b2c3', '66666666-6666-6666-6666-666666666666', 'ACTIVE', 'Motosiklet', '+905551112233', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 4.6, 40.991, 29.026, CURRENT_TIMESTAMP, CURRENT_DATE + '09:00:00'::time, CURRENT_DATE + '21:00:00'::time, true, true, 15, 10.0, 35.0, 5.0),
    
    ('efa567bc-e5f6-a1b2-c3d4-e5f6a1b2c3d4', '77777777-7777-7777-7777-777777777777', 'ACTIVE', 'Bisiklet', '+905552223344', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 4.2, 41.043, 29.008, CURRENT_TIMESTAMP, CURRENT_DATE + '10:00:00'::time, CURRENT_DATE + '22:00:00'::time, true, true, 12, 8.0, 25.0, 6.0),
    
    ('fab678cd-f6a1-b2c3-d4e5-f6a1b2c3d4e5', '88888888-8888-8888-8888-888888888888', 'ACTIVE', 'Motosiklet', '+905553334455', 'a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a7a7', 4.9, 41.014, 29.120, CURRENT_TIMESTAMP, CURRENT_DATE + '08:00:00'::time, CURRENT_DATE + '20:00:00'::time, true, true, 18, 12.0, 40.0, 7.0);

-- Müşteriler
INSERT INTO "customers" ("id", "userId", "phone", "address", "latitude", "longitude", "createdAt", "updatedAt")
VALUES
    ('abc789de-a1b2-c3d4-e5f6-a1b2c3d4e5f6', '99999999-9999-9999-9999-999999999999', '+905551112233', 'Kadıköy Caferağa Mahallesi, Moda Caddesi No:10, D:5', 40.9879, 29.0255, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    ('bcd890ef-b2c3-d4e5-f6a1-b2c3d4e5f6a1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '+905552223344', 'Beşiktaş Sinanpaşa Mahallesi, Beşiktaş Caddesi No:25, D:3', 41.0392, 29.0071, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    ('cde901fa-c3d4-e5f6-a1b2-c3d4e5f6a1b2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '+905553334455', 'Ümraniye Atatürk Mahallesi, Alemdağ Caddesi No:155, D:10', 41.0152, 29.1124, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Siparişler
INSERT INTO "orders" ("id", "createdAt", "updatedAt", "status", "totalPrice", "items", "address", "notes", "estimatedDelivery", "actualDelivery", "latitude", "longitude", "customerId", "businessId", "courierId", "priority", "estimatedDuration", "estimatedDistance", "sequenceNumber")
VALUES
    ('def012ab-d4e5-e5f6-a1b2-c3d4e5f6a1b2', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days', 'DELIVERED', 120.50, 
    '[
        {"id": "item1", "name": "Adana Kebap", "quantity": 1, "price": 85.00, "notes": "Acılı olsun"},
        {"id": "item2", "name": "Ayran", "quantity": 2, "price": 15.00, "notes": "Soğuk olsun"},
        {"id": "item3", "name": "Künefe", "quantity": 1, "price": 35.50, "notes": ""}
    ]', 
    'Kadıköy Caferağa Mahallesi, Moda Caddesi No:10, D:5', 'Zile basmayın, bebek uyuyor.', 
    CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '45 minutes', 
    CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '40 minutes', 
    40.9879, 29.0255, 'abc789de-a1b2-c3d4-e5f6-a1b2c3d4e5f6', 'abe123de-a1b2-3cd4-e5f6-a1b2c3d4e5f6', 'def456ab-d4e5-6fa1-b2c3-d4e5f6a1b2c3', 'MEDIUM', 40, 2.5, 1),
    
    ('efa123bc-e5f6-a1b2-c3d4-e5f6a1b2c3d4', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days', 'DELIVERED', 150.75, 
    '[
        {"id": "item1", "name": "Margarita Pizza", "quantity": 1, "price": 95.00, "notes": "İnce hamur olsun"},
        {"id": "item2", "name": "Makarna", "quantity": 1, "price": 55.75, "notes": "Az pişmiş olsun"}
    ]', 
    'Beşiktaş Sinanpaşa Mahallesi, Beşiktaş Caddesi No:25, D:3', 'Hızlı gelirse bahşiş var.', 
    CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '40 minutes', 
    CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '35 minutes', 
    41.0392, 29.0071, 'bcd890ef-b2c3-d4e5-f6a1-b2c3d4e5f6a1', 'bcd234ef-b2c3-4de5-f6a1-b2c3d4e5f6a1', 'efa567bc-e5f6-a1b2-c3d4-e5f6a1b2c3d4', 'HIGH', 35, 1.8, 1),
    
    ('fab234cd-f6a1-b2c3-d4e5-f6a1b2c3d4e5', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day', 'DELIVERED', 95.25, 
    '[
        {"id": "item1", "name": "Tiramisu", "quantity": 2, "price": 45.00, "notes": ""},
        {"id": "item2", "name": "Sütlaç", "quantity": 1, "price": 25.00, "notes": "Tarçınlı olsun"},
        {"id": "item3", "name": "Çay", "quantity": 2, "price": 5.00, "notes": ""}
    ]', 
    'Ümraniye Atatürk Mahallesi, Alemdağ Caddesi No:155, D:10', '', 
    CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '50 minutes', 
    CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '45 minutes', 
    41.0152, 29.1124, 'cde901fa-c3d4-e5f6-a1b2-c3d4e5f6a1b2', 'cde345fa-c3d4-5ef6-a1b2-c3d4e5f6a1b2', 'fab678cd-f6a1-b2c3-d4e5-f6a1b2c3d4e5', 'MEDIUM', 45, 2.2, 1),
    
    ('abc345de-a1b2-c3d4-e5f6-a1b2c3d4e5f6', CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '4 hours', 'CANCELLED', 85.00, 
    '[
        {"id": "item1", "name": "Adana Kebap", "quantity": 1, "price": 85.00, "notes": "Acısız olsun"}
    ]', 
    'Kadıköy Caferağa Mahallesi, Moda Caddesi No:10, D:5', 'Acele lütfen.', 
    CURRENT_TIMESTAMP - INTERVAL '4 hours' + INTERVAL '45 minutes', 
    NULL, 
    40.9879, 29.0255, 'abc789de-a1b2-c3d4-e5f6-a1b2c3d4e5f6', 'abe123de-a1b2-3cd4-e5f6-a1b2c3d4e5f6', NULL, 'MEDIUM', 40, 2.5, 2),
    
    ('bcd456ef-b2c3-d4e5-f6a1-b2c3d4e5f6a1', CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours', 'PROCESSING', 190.50, 
    '[
        {"id": "item1", "name": "Karışık Pizza", "quantity": 2, "price": 95.00, "notes": "Ekstra peynirli olsun"},
        {"id": "item2", "name": "Kola", "quantity": 2, "price": 10.00, "notes": "Soğuk olsun"},
        {"id": "item3", "name": "Tiramisu", "quantity": 1, "price": 40.00, "notes": ""}
    ]', 
    'Beşiktaş Sinanpaşa Mahallesi, Beşiktaş Caddesi No:25, D:3', 'En kısa sürede gelsin lütfen.', 
    CURRENT_TIMESTAMP - INTERVAL '2 hours' + INTERVAL '30 minutes', 
    NULL, 
    41.0392, 29.0071, 'bcd890ef-b2c3-d4e5-f6a1-b2c3d4e5f6a1', 'bcd234ef-b2c3-4de5-f6a1-b2c3d4e5f6a1', 'efa567bc-e5f6-a1b2-c3d4-e5f6a1b2c3d4', 'HIGH', 30, 1.8, 2),
    
    ('cde567fa-c3d4-e5f6-a1b2-c3d4e5f6a1b2', CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '1 hour', 'PREPARING', 65.00, 
    '[
        {"id": "item1", "name": "Profiterol", "quantity": 1, "price": 45.00, "notes": ""},
        {"id": "item2", "name": "Türk Kahvesi", "quantity": 2, "price": 10.00, "notes": "Orta şekerli olsun"}
    ]', 
    'Ümraniye Atatürk Mahallesi, Alemdağ Caddesi No:155, D:10', 'Kapıda kredi kartı ile ödeme yapılacak.', 
    CURRENT_TIMESTAMP - INTERVAL '1 hour' + INTERVAL '45 minutes', 
    NULL, 
    41.0152, 29.1124, 'cde901fa-c3d4-e5f6-a1b2-c3d4e5f6a1b2', 'cde345fa-c3d4-5ef6-a1b2-c3d4e5f6a1b2', NULL, 'LOW', 40, 2.2, 2);

-- İptal İstekleri
INSERT INTO "cancellation_requests" ("id", "orderId", "customerId", "businessId", "status", "reason", "otherReason", "cancellationFee", "autoProcessed", "customerNotes", "businessNotes", "createdAt", "updatedAt", "reviewedAt", "reviewedBy", "cancelledAt")
VALUES
    ('def678ab-d4e5-f6a1-b2c3-d4e5f6a1b2c3', 'abc345de-a1b2-c3d4-e5f6-a1b2c3d4e5f6', 'abc789de-a1b2-c3d4-e5f6-a1b2c3d4e5f6', 'abe123de-a1b2-3cd4-e5f6-a1b2c3d4e5f6', 'APPROVED', 'CUSTOMER_CHANGED_MIND', NULL, 0.00, true, 'Siparişimi yanlışlıkla verdim.', 'Onaylandı.', CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '4 hours', 'Sistem', CURRENT_TIMESTAMP - INTERVAL '4 hours');

-- Abone Planları
INSERT INTO "subscription_plans" ("id", "name", "description", "price", "currency", "interval", "intervalCount", "trialPeriodDays", "features", "isActive", "createdAt", "updatedAt")
VALUES
    ('efa789bc-e5f6-a1b2-c3d4-e5f6a1b2c3d4', 'Temel Paket', 'Küçük işletmeler için uygun başlangıç paketi', 150.00, 'TRY', 'MONTHLY', 1, 7, 
    '{"maxOrders": 100, "supportLevel": "Basic", "marketingTools": false, "analytics": "Basic", "customBranding": false}', 
    true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    ('fab890cd-f6a1-b2c3-d4e5-f6a1b2c3d4e5', 'Pro Paket', 'Orta ve büyük işletmeler için gelişmiş özellikler', 300.00, 'TRY', 'MONTHLY', 1, 7, 
    '{"maxOrders": 500, "supportLevel": "Premium", "marketingTools": true, "analytics": "Advanced", "customBranding": true}', 
    true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    ('abc901de-a1b2-c3d4-e5f6-a1b2c3d4e5f6', 'Kurumsal Paket', 'Büyük işletmeler ve zincirler için tam donanımlı paket', 750.00, 'TRY', 'MONTHLY', 1, 7, 
    '{"maxOrders": 2000, "supportLevel": "Enterprise", "marketingTools": true, "analytics": "Enterprise", "customBranding": true, "apiAccess": true, "dedicatedSupport": true}', 
    true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- İşletme Abonelikleri
INSERT INTO "subscriptions" ("id", "customerId", "planId", "businessId", "status", "startDate", "endDate", "currentPeriodStart", "currentPeriodEnd", "nextBillingDate", "quantity", "autoRenew", "createdAt", "updatedAt")
VALUES
    ('bcd012ef-b2c3-d4e5-f6a1-b2c3d4e5f6a1', 'abc789de-a1b2-c3d4-e5f6-a1b2c3d4e5f6', 'efa789bc-e5f6-a1b2-c3d4-e5f6a1b2c3d4', 'abe123de-a1b2-3cd4-e5f6-a1b2c3d4e5f6', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '2 months', CURRENT_TIMESTAMP + INTERVAL '10 months', CURRENT_TIMESTAMP - INTERVAL '1 month', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, true, CURRENT_TIMESTAMP - INTERVAL '2 months', CURRENT_TIMESTAMP),
    
    ('cde123fa-c3d4-e5f6-a1b2-c3d4e5f6a1b2', 'bcd890ef-b2c3-d4e5-f6a1-b2c3d4e5f6a1', 'fab890cd-f6a1-b2c3-d4e5-f6a1b2c3d4e5', 'bcd234ef-b2c3-4de5-f6a1-b2c3d4e5f6a1', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '3 months', CURRENT_TIMESTAMP + INTERVAL '9 months', CURRENT_TIMESTAMP - INTERVAL '1 month', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, true, CURRENT_TIMESTAMP - INTERVAL '3 months', CURRENT_TIMESTAMP),
    
    ('def234ab-d4e5-f6a1-b2c3-d4e5f6a1b2c3', 'cde901fa-c3d4-e5f6-a1b2-c3d4e5f6a1b2', 'abc901de-a1b2-c3d4-e5f6-a1b2c3d4e5f6', 'cde345fa-c3d4-5ef6-a1b2-c3d4e5f6a1b2', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '1 month', CURRENT_TIMESTAMP + INTERVAL '11 months', CURRENT_TIMESTAMP - INTERVAL '1 month', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, true, CURRENT_TIMESTAMP - INTERVAL '1 month', CURRENT_TIMESTAMP);

-- İade Politikaları
INSERT INTO "refund_policies" ("id", "businessId", "name", "description", "autoApproveTimeline", "timeLimit", "orderStatusRules", "productRules", "isActive", "createdAt", "updatedAt")
VALUES
    ('efa345bc-e5f6-a1b2-c3d4-e5f6a1b2c3d4', 'abe123de-a1b2-3cd4-e5f6-a1b2c3d4e5f6', 'Standart İade Politikası', 'Teslimat sonrası 30 dakika içinde iade edilebilir', 30, 60, 
    '{"PENDING": true, "PROCESSING": true, "PREPARING": true, "READY": false, "IN_TRANSIT": false, "DELIVERED": true}',
    '{"exceptions": ["Özel Siparişler", "Promosyon Ürünler"]}',
    true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    ('fab456cd-f6a1-b2c3-d4e5-f6a1b2c3d4e5', 'bcd234ef-b2c3-4de5-f6a1-b2c3d4e5f6a1', 'Esnek İade Politikası', 'Teslimat sonrası 60 dakika içinde iade edilebilir', 60, 90, 
    '{"PENDING": true, "PROCESSING": true, "PREPARING": true, "READY": true, "IN_TRANSIT": false, "DELIVERED": true}',
    '{"exceptions": ["İçecekler"]}',
    true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    ('abc567de-a1b2-c3d4-e5f6-a1b2c3d4e5f6', 'cde345fa-c3d4-5ef6-a1b2-c3d4e5f6a1b2', 'Sıkı İade Politikası', 'Teslimat sonrası 15 dakika içinde iade edilebilir', 15, 30, 
    '{"PENDING": true, "PROCESSING": true, "PREPARING": false, "READY": false, "IN_TRANSIT": false, "DELIVERED": true}',
    '{"exceptions": ["Yaş Pastalar", "Özel Tasarım Pastalar", "Kişiye Özel Ürünler"]}',
    true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP); 