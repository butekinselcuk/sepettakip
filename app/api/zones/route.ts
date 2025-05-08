import { NextResponse } from 'next/server';
import type {
  Zone,
  ZoneFilter,
  ZonePerformance
} from '../../types';
import { ZoneService } from '../../services/zoneService';

const zoneService = new ZoneService();

// GET /api/zones
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter: ZoneFilter = {
    status: searchParams.get('status') as any || undefined,
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    includeMetrics: searchParams.get('includeMetrics') === 'true',
    includeCourierDistribution: searchParams.get('includeCourierDistribution') === 'true',
    includeHourlyMetrics: searchParams.get('includeHourlyMetrics') === 'true',
  };

  try {
    const zones = await zoneService.getZones(filter);
    return NextResponse.json(zones);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch zones' }, { status: 500 });
  }
}

// GET /api/zones/:id/performance
export async function GET_PERFORMANCE(request: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url);
  const filter: ZoneFilter = {
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    includeMetrics: true,
    includeCourierDistribution: searchParams.get('includeCourierDistribution') === 'true',
    includeHourlyMetrics: searchParams.get('includeHourlyMetrics') === 'true',
  };

  try {
    const performance = await zoneService.getZonePerformance(params.id, filter);
    return NextResponse.json(performance);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch zone performance' }, { status: 500 });
  }
}

// GET /api/zones/performance/trends
export async function GET_PERFORMANCE_TRENDS(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter: ZoneFilter = {
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    includeMetrics: true,
    includeCourierDistribution: searchParams.get('includeCourierDistribution') === 'true',
    includeHourlyMetrics: searchParams.get('includeHourlyMetrics') === 'true',
  };

  try {
    const trends = await zoneService.getZonePerformanceTrends(filter);
    return NextResponse.json(trends);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch zone performance trends' }, { status: 500 });
  }
} 