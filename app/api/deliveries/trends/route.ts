import { NextResponse } from 'next/server';
import type { DeliveryFilter } from '../../../types';
import { DeliveryService } from '../../../services/deliveryService';

const deliveryService = new DeliveryService();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter: DeliveryFilter = {
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    timeRange: searchParams.get('timeRange') as any || 'daily',
  };

  try {
    const trends = await deliveryService.getDeliveryTrends(filter);
    return NextResponse.json(trends);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch delivery trends' }, { status: 500 });
  }
} 