import { PrismaClient } from '@prisma/client'

// PrismaClient global instance preventing multiple instances in development
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL environment variable is not set. Using default value.');
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/sepet';
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// In production mode, don't log queries
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 