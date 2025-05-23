import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';
import { 
  handleDatabaseError, 
  handleAuthError,
  handleServerError,
  createEmptyResponse
} from '@/lib/api-utils';
// import type { Courier, Delivery } from '@/types'; // Eğer tipler varsa ekle

export async function GET(request: NextRequest) {
  try {
    // Token validation (optional in development)
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return handleAuthError('Unauthorized: Token not found');
    }
    
    try {
      // Tüm kuryeleri ve ilişkili kullanıcıyı çek
      const couriers = await prisma.courier.findMany({
        include: {
          user: true,
          deliveries: true,
        },
      });

      if (!couriers || couriers.length === 0) {
        return createEmptyResponse('kurye');
      }

      const courierStats = couriers.map((courier: any) => {
        const deliveries = courier.deliveries as any[];
        const totalDeliveries = deliveries.length;
        const averageDeliveryTime = totalDeliveries > 0 ?
          deliveries.reduce((sum: number, d: any) => sum + (d.actualDuration ?? 0), 0) / totalDeliveries : 0;
        const customerRating = totalDeliveries > 0 ?
          deliveries.reduce((sum: number, d: any) => sum + (d.customerRating ?? 0), 0) / totalDeliveries : 0;
        const onTimeCount = deliveries.filter((d: any) => d.actualDuration !== null && d.duration !== null && d.actualDuration <= d.duration).length;
        const onTimeDeliveryRate = totalDeliveries > 0 ? (onTimeCount / totalDeliveries) * 100 : 0;
        return {
          courierId: courier.id,
          courierName: courier.user?.name || courier.user?.email || 'Bilinmeyen',
          totalDeliveries,
          averageDeliveryTime: Math.round(averageDeliveryTime),
          customerRating: Math.round(customerRating * 100) / 100,
          onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100,
        };
      });
      
      return NextResponse.json(courierStats);
    } catch (dbError: any) {
      return handleDatabaseError(dbError);
    }
  } catch (error) {
    return handleServerError(error);
  }
} 