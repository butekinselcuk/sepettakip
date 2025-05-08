import { NextResponse } from 'next/server';
import { ZoneService } from '../../../services/zoneService';
import type { ZoneFilter } from '../../../types';

const zoneService = new ZoneService();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter: ZoneFilter = {
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    includeMetrics: true,
  };

  try {
    const performances = await zoneService.getZonePerformanceTrends(filter);
    return NextResponse.json(performances);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch zone performances' }, { status: 500 });
  }
} 