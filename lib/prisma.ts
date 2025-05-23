import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL environment variable is not set. Using default value.');
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/sepettakip';
}

console.log(`Prisma bağlantı URL'i: ${process.env.DATABASE_URL}`);

// Singleton pattern ile prisma instance oluştur
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn', 'info'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Edge Runtime ortamında çalışıp çalışmadığını kontrol et
const isEdgeRuntime = typeof EdgeRuntime !== 'undefined';

// Bağlantıyı test et - sadece Edge Runtime olmayan ortamlarda
if (!isEdgeRuntime) {
  prisma.$connect()
    .then(() => {
      console.log('Veritabanı bağlantısı başarılı!');
    })
    .catch((err) => {
      console.error('Veritabanı bağlantı hatası:', err);
    });
}

// Development ortamında global değişkene ata
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Hem named export hem de default export sağlayarak tutarlılık sağla
export default prisma; 