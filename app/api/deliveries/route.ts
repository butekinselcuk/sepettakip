import { NextResponse } from 'next/server';
import type {
  Delivery,
  DeliveryFilter,
  DeliveryTrend,
  DeliveryTimeline,
  DeliveryLog,
  DeliveryLogFilter
} from '../../types';
import { DeliveryService } from '../../services/deliveryService';

const deliveryService = new DeliveryService();

// GET /api/deliveries
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter: DeliveryFilter = {
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    courierId: searchParams.get('courierId') || undefined,
    zoneId: searchParams.get('zoneId') || undefined,
    status: searchParams.get('status') as any || undefined,
    timeRange: searchParams.get('timeRange') as any || undefined,
  };

  try {
    const deliveries = await deliveryService.getDeliveries(filter);
    return NextResponse.json(deliveries);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch deliveries' }, { status: 500 });
  }
}

// GET /api/deliveries/trends
export async function GET_TRENDS(request: Request) {
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
    return NextResponse.json({ error: 'Failed to fetch delivery trends' }, { status: 500 });
  }
}

// GET /api/deliveries/:id/timeline
export async function GET_TIMELINE(request: Request, { params }: { params: { id: string } }) {
  try {
    const timeline = await deliveryService.getDeliveryTimeline(params.id);
    return NextResponse.json(timeline);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch delivery timeline' }, { status: 500 });
  }
}

// GET /api/deliveries/logs
export async function GET_LOGS(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter: DeliveryLogFilter = {
    deliveryId: searchParams.get('deliveryId') || undefined,
    courierId: searchParams.get('courierId') || undefined,
    zoneId: searchParams.get('zoneId') || undefined,
    status: searchParams.get('status') as any || undefined,
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    includeLocation: searchParams.get('includeLocation') === 'true',
  };

  try {
    const logs = await deliveryService.getDeliveryLogs(filter);
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch delivery logs' }, { status: 500 });
  }
} 