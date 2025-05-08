import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Health check endpoint
 * Bu endpoint Docker ve Kubernetes gibi sistemlerin uygulamanın sağlıklı olup olmadığını kontrol etmesi için kullanılır.
 * Veritabanı bağlantısını, temel servislerin çalışıp çalışmadığını kontrol eder.
 */
export async function GET() {
  try {
    // Veritabanı bağlantı kontrolü
    await prisma.$queryRaw`SELECT 1`;
    
    // Sistem sağlık bilgilerini topla
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const environment = process.env.NODE_ENV || 'development';
    
    // Yanıt verileri
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 60)} minutes, ${Math.floor(uptime % 60)} seconds`,
      database: 'connected',
      environment,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      },
    };

    return NextResponse.json(healthData);
  } catch (error) {
    console.error('Health check failed:', error);
    
    // Hata durumunda 500 kodu ile yanıt ver
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed', 
        timestamp: new Date().toISOString(),
        error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
      }, 
      { status: 500 }
    );
  } finally {
    // Prisma bağlantısını kapat
    await prisma.$disconnect();
  }
} 