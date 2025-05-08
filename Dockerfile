# SepetTakip Next.js Uygulaması için Dockerfile
# Multi-stage build ile geliştirme ve üretim için optimize edilmiş yapı

# --- Bağımlılık yükleme aşaması ---
FROM node:18-alpine AS deps
WORKDIR /app

# Paket yöneticisi dosyalarını kopyala
COPY package.json package-lock.json ./

# Bağımlılıkları yükle
RUN npm ci

# --- Geliştirme aşaması ---
FROM node:18-alpine AS development
WORKDIR /app

# Bağımlılıkları kopyala
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ortam değişkenlerini ayarla
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Geliştirme sunucusunu başlat
CMD ["npm", "run", "dev"]

# --- Build aşaması ---
FROM node:18-alpine AS builder
WORKDIR /app

# Bağımlılıkları kopyala
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ortam değişkenlerini ayarla
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Prisma istemcisini oluştur ve uygulamayı derle
RUN npx prisma generate
RUN npm run build

# --- Üretim aşaması ---
FROM node:18-alpine AS production
WORKDIR /app

# Ortam değişkenlerini ayarla
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Üretim için gerekli dosyaları kopyala
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Sağlık kontrolü
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Uygulamayı başlat
EXPOSE 3000
CMD ["npm", "start"] 