# SepetTakip Kurulum Rehberi

Bu rehber, SepetTakip projesini yerel ortamınızda kurmanız ve çalıştırmanız için detaylı adımları içerir.

## Gereksinimler

- Node.js (v14.x veya üzeri)
- npm (v7.x veya üzeri)
- PostgreSQL (v13.x veya üzeri)
- Git

## Adım Adım Kurulum

### 1. Projeyi Klonlama

```bash
git clone https://github.com/kullaniciadi/sepettakip.git
cd sepettakip
```

### 2. Bağımlılıkları Yükleme

```bash
npm install
```

### 3. Veritabanı Kurulumu

1. PostgreSQL veritabanını oluşturun:

```bash
createdb sepettakip
```

2. `.env` dosyasını oluşturun:

```
DATABASE_URL="postgresql://kullaniciadi:sifre@localhost:5432/sepettakip"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXT_PUBLIC_MAPS_API_KEY="your-google-maps-api-key"
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="user@example.com"
EMAIL_SERVER_PASSWORD="password"
EMAIL_FROM="noreply@example.com"
```

3. Veritabanı şemasını oluşturun:

```bash
npx prisma migrate dev --name init
```

4. Test verilerini yükleyin (opsiyonel):

```bash
npx prisma db seed
```

### 4. Geliştirme Sunucusunu Başlatma

```bash
npm run dev
```

Uygulama http://localhost:3000 adresinde çalışacaktır.

### 5. Yapı Oluşturma ve Üretime Hazırlama

```bash
npm run build
npm start
```

## Docker ile Kurulum

### Docker Compose Kullanarak Kurulum

1. docker-compose.yml dosyası oluşturun:

```yaml
version: '3'
services:
  db:
    image: postgres:13
    environment:
      POSTGRES_USER: sepettakip
      POSTGRES_PASSWORD: sepettakip
      POSTGRES_DB: sepettakip
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://sepettakip:sepettakip@db:5432/sepettakip
      NEXTAUTH_SECRET: your-nextauth-secret
      NODE_ENV: production
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

2. Dockerfile oluşturun:

```Dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

3. Docker Compose çalıştırın:

```bash
docker-compose up -d
```

## API Entegrasyonları

### Yemeksepeti API

Yemeksepeti API entegrasyonu için gerekli kimlik bilgilerini `.env` dosyasına ekleyin:

```
YEMEKSEPETI_API_KEY=your-api-key
YEMEKSEPETI_API_SECRET=your-api-secret
YEMEKSEPETI_MERCHANT_ID=your-merchant-id
```

### Getir API

Getir API entegrasyonu için gerekli kimlik bilgilerini `.env` dosyasına ekleyin:

```
GETIR_API_KEY=your-api-key
GETIR_API_SECRET=your-api-secret
GETIR_MERCHANT_ID=your-merchant-id
```

### Google Maps API

Google Maps entegrasyonu için API anahtarınızı `.env` dosyasına ekleyin:

```
NEXT_PUBLIC_MAPS_API_KEY=your-google-maps-api-key
```

## Sorun Giderme

### Veritabanı Bağlantı Hatası

Eğer veritabanı bağlantı hatası alıyorsanız:

1. PostgreSQL servisinin çalıştığından emin olun
2. `.env` dosyasındaki veritabanı bağlantı bilgilerini kontrol edin
3. Kullanıcı adı ve şifrenin doğru olduğundan emin olun

### Prisma Hataları

Prisma ile ilgili hata mesajları alıyorsanız:

```bash
npx prisma generate
```

komutunu çalıştırarak Prisma istemcisini yeniden oluşturun.

## İletişim ve Destek

Kurulum sırasında herhangi bir sorunla karşılaşırsanız, lütfen aşağıdaki kanallardan bizimle iletişime geçin:

- GitHub Issues: [https://github.com/kullaniciadi/sepettakip/issues](https://github.com/kullaniciadi/sepettakip/issues)
- E-posta: support@example.com 