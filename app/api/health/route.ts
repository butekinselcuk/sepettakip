import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Health check endpoint
 * Bu endpoint Docker ve Kubernetes gibi sistemlerin uygulamanın sağlıklı olup olmadığını kontrol etmesi için kullanılır.
 * Veritabanı bağlantısını, temel servislerin çalışıp çalışmadığını kontrol eder.
 */
export async function GET() {
  try {
    // Veritabanı bağlantısını kontrol et
    const dbCheck = await prisma.$queryRaw`SELECT 1 as db_health`;
    
    // Çevre değişkenlerini topla
    const environment = process.env.NODE_ENV || 'development';
    const version = process.env.APP_VERSION || '1.0.0';
    
    // Yanıt objesi oluştur
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment,
      version,
      database: dbCheck ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
    
    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Service unavailable',
        timestamp: new Date().toISOString() 
      }, 
      { status: 500 }
    );
  }
} 