#!/bin/sh
set -e

# Prisma client üret
echo "Prisma istemcisi oluşturuluyor..."
npx prisma generate

# Uygulama başlat
echo "Uygulama başlatılıyor..."
exec "$@" 