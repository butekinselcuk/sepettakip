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
    // Token validation (optional in development)
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return handleAuthError('Unauthorized: Token not found');
    }
    
    try {
      // Try to safely query the database
      const zones = await prisma.zone.findMany();
      
      if (!zones || zones.length === 0) {
        return createEmptyResponse('bölge');
      }
      
      // Get deliveries for each zone
      const deliveries = await prisma.delivery.findMany({
        where: {
          zoneId: {
            in: zones.map(zone => zone.id)
          }
        }
      });
      
      // Calculate performance metrics
      const zonePerformance = zones.map(zone => {
        const zoneDeliveries = deliveries.filter(d => d.zoneId === zone.id);
        const completedDeliveries = zoneDeliveries.filter(d => d.status === 'DELIVERED');
        
        return {
          id: zone.id,
          name: zone.name,
          totalDeliveries: zoneDeliveries.length,
          completedDeliveries: completedDeliveries.length,
          averageDeliveryTime: zone.averageDeliveryTime || 0,
          activeBusinesses: zone.activeBusinesses || 0
        };
      });
      
      return NextResponse.json({ zonePerformance });
    } catch (dbError: any) {
      return handleDatabaseError(dbError);
    }
  } catch (error) {
    return handleServerError(error);
  }
} 