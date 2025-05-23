import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';
import { 
  handleDatabaseError, 
  handleAuthError,
  handleServerError,
  createEmptyResponse
} from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'daily';
    
    // Token validation (optional in development)
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return handleAuthError('Unauthorized: Token not found');
    }
    
    try {
      // Gerçek veri tabanı sorgusu
      const deliveries = await prisma.delivery.findMany({
        where: {
          // Son 30 günlük verileri getir (varsayılan)
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30))
          }
        },
        select: {
          id: true,
          status: true,
          createdAt: true
        }
      });
      
      // Veri yoksa boş sonuç döndür
      if (!deliveries || deliveries.length === 0) {
        return createEmptyResponse('teslimat');
      }
      
      // Verileri zaman aralığına göre grupla
      let trendsData: any[] = [];
      
      if (timeRange === 'daily') {
        // Günlük veriler için işlem
        const groupedByDay = groupDeliveriesByDay(deliveries);
        trendsData = transformToTrendsData(groupedByDay);
      } else if (timeRange === 'weekly') {
        // Haftalık veriler için işlem
        const groupedByWeek = groupDeliveriesByWeek(deliveries);
        trendsData = transformToTrendsData(groupedByWeek);
      } else {
        // Aylık veriler için işlem
        const groupedByMonth = groupDeliveriesByMonth(deliveries);
        trendsData = transformToTrendsData(groupedByMonth);
      }
      
      return NextResponse.json({ trends: trendsData });
    } catch (dbError: any) {
      return handleDatabaseError(dbError);
    }
  } catch (error) {
    return handleServerError(error);
  }
}

// Verileri günlük gruplama
function groupDeliveriesByDay(deliveries: any[]) {
  const groupedData: Record<string, any[]> = {};
  
  deliveries.forEach(delivery => {
    const date = delivery.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD formatı
    if (!groupedData[date]) {
      groupedData[date] = [];
    }
    groupedData[date].push(delivery);
  });
  
  return groupedData;
}

// Verileri haftalık gruplama
function groupDeliveriesByWeek(deliveries: any[]) {
  const groupedData: Record<string, any[]> = {};
  
  deliveries.forEach(delivery => {
    const date = delivery.createdAt;
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Haftanın başlangıcı (Pazar)
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!groupedData[weekKey]) {
      groupedData[weekKey] = [];
    }
    groupedData[weekKey].push(delivery);
  });
  
  return groupedData;
}

// Verileri aylık gruplama
function groupDeliveriesByMonth(deliveries: any[]) {
  const groupedData: Record<string, any[]> = {};
  
  deliveries.forEach(delivery => {
    const date = delivery.createdAt;
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!groupedData[monthKey]) {
      groupedData[monthKey] = [];
    }
    groupedData[monthKey].push(delivery);
  });
  
  return groupedData;
}

// Gruplandırılmış verileri trend verilerine dönüştürme
function transformToTrendsData(groupedData: Record<string, any[]>) {
  return Object.entries(groupedData).map(([date, deliveries]) => {
    const completed = deliveries.filter(d => d.status === 'DELIVERED' || d.status === 'COMPLETED').length;
    const failed = deliveries.filter(d => d.status === 'CANCELLED' || d.status === 'FAILED').length;
    const pending = deliveries.filter(d => d.status === 'PENDING' || d.status === 'PROCESSING').length;
    
    return {
      date,
      completed,
      failed,
      pending
    };
  }).sort((a, b) => a.date.localeCompare(b.date)); // Tarihe göre sırala
} 