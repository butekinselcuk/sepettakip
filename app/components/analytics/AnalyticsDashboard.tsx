'use client';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import CustomizableChart from './CustomizableChart';
// import RealtimeDashboard from './RealtimeDashboard';
import dynamic from 'next/dynamic';
import InteractiveMap from './InteractiveMap';
import ReportManager from './ReportManager';
import DeliveryTrendChart, { DeliveryTrendData } from './DeliveryTrendChart';
import ZonePerformanceBarChart from './ZonePerformanceBarChart';
import StatCard from './StatCard';
import CourierPerformance from './CourierPerformance';

const InteractiveMapDynamic = dynamic(() => import('./InteractiveMap'), { ssr: false });

const MOCK_DATA = {
  deliveryByZone: [
    { name: 'Kadıköy', value: 120 },
    { name: 'Üsküdar', value: 98 },
    { name: 'Beşiktaş', value: 86 },
    { name: 'Şişli', value: 99 },
    { name: 'Maltepe', value: 85 }
  ],
  deliveryTrend: [
    { name: 'Pzt', value: 150 },
    { name: 'Sal', value: 230 },
    { name: 'Çar', value: 224 },
    { name: 'Per', value: 218 },
    { name: 'Cum', value: 335 },
    { name: 'Cmt', value: 247 },
    { name: 'Paz', value: 176 }
  ],
  courierPerformance: [
    { name: 'Ahmet', value: 95, deliveries: 45 },
    { name: 'Mehmet', value: 88, deliveries: 38 },
    { name: 'Ayşe', value: 92, deliveries: 42 },
    { name: 'Fatma', value: 85, deliveries: 35 },
    { name: 'Ali', value: 90, deliveries: 40 }
  ]
};

// Mock data for interactive map
const MOCK_MAP_DATA = {
  deliveryZones: [
    {
      id: '1',
      name: 'Kadıköy',
      coordinates: [
        [40.9900, 29.0200] as [number, number],
        [40.9900, 29.0400] as [number, number],
        [41.0100, 29.0400] as [number, number],
        [41.0100, 29.0200] as [number, number]
      ],
      color: '#8884d8'
    },
    {
      id: '2',
      name: 'Üsküdar',
      coordinates: [
        [41.0200, 29.0000] as [number, number],
        [41.0200, 29.0200] as [number, number],
        [41.0400, 29.0200] as [number, number],
        [41.0400, 29.0000] as [number, number]
      ],
      color: '#82ca9d'
    }
  ],
  courierLocations: [
    {
      id: '1',
      name: 'Ahmet',
      position: [41.0000, 29.0300] as [number, number],
      status: 'active' as const,
      currentDelivery: {
        id: '1',
        address: 'Kadıköy, İstanbul'
      }
    },
    {
      id: '2',
      name: 'Mehmet',
      position: [41.0300, 29.0100] as [number, number],
      status: 'idle' as const
    }
  ]
};

const timeRanges = [
  { value: 'daily', label: 'Günlük' },
  { value: 'weekly', label: 'Haftalık' },
  { value: 'monthly', label: 'Aylık' },
];

export default function AnalyticsDashboard() {
  const [trendData, setTrendData] = useState<DeliveryTrendData[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('daily');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [zoneData, setZoneData] = useState<any[]>([]);
  const [zoneLoading, setZoneLoading] = useState(false);

  useEffect(() => {
    async function fetchTrends() {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('timeRange', timeRange);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const res = await fetch(`/api/deliveries/trends?${params.toString()}`);
      const json = await res.json();
      const chartData: DeliveryTrendData[] = (json[0]?.hourlyDistribution || []).map((item: any) => ({
        date: `${item.hour}:00`,
        totalDeliveries: item.count,
        completedDeliveries: item.count,
        averageDeliveryTime: item.averageTime,
      }));
      setTrendData(chartData);
      setLoading(false);
    }
    fetchTrends();
  }, [timeRange, startDate, endDate]);

  const fetchZonePerformance = async (start?: string, end?: string) => {
    setZoneLoading(true);
    let url = '/api/zones/performance';
    const params = [];
    if (start) params.push(`startDate=${start}`);
    if (end) params.push(`endDate=${end}`);
    if (params.length) url += '?' + params.join('&');
    const res = await fetch(url);
    const data = await res.json();
    setZoneData(data);
    setZoneLoading(false);
  };

  const handleGenerateReport = async (type: string, recipients: string[], schedule?: any) => {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          recipients,
          schedule,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      console.log('Report generated:', data);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  // StatCard metriklerini hesapla
  const totalDeliveries = zoneData.reduce((acc, z) => acc + (z.metrics?.totalDeliveries || 0), 0);
  const averageSuccessRate = zoneData.length > 0 ? (zoneData.reduce((acc, z) => acc + (z.metrics?.successRate || 0), 0) / zoneData.length) : 0;
  const averageDeliveryTime = zoneData.length > 0 ? (zoneData.reduce((acc, z) => acc + (z.metrics?.averageDeliveryTime || 0), 0) / zoneData.length) : 0;
  // Aktif kurye sayısı için zoneData'da courierDistribution varsa kullan
  const activeCouriers = zoneData.reduce((acc, z) => acc + (z.courierDistribution ? z.courierDistribution.length : 0), 0);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold mb-4">Teslimat Analizi</h1>
      <div style={{ display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
        <StatCard title="Toplam Teslimat" value={totalDeliveries} loading={zoneLoading} color="#e3eafe" icon={<span>📦</span>} />
        <StatCard title="Başarı Oranı" value={averageSuccessRate.toFixed(1) + ' %'} loading={zoneLoading} color="#eafaf1" icon={<span>✅</span>} />
        <StatCard title="Ortalama Süre" value={averageDeliveryTime.toFixed(1) + ' dk'} loading={zoneLoading} color="#fff7e6" icon={<span>⏱️</span>} />
        <StatCard title="Aktif Kurye" value={activeCouriers} loading={zoneLoading} color="#f5f5f5" icon={<span>🛵</span>} />
      </div>
      {/* <RealtimeDashboard /> */}
      <h2 style={{ marginTop: 48 }}>İnteraktif Harita</h2>
      <InteractiveMapDynamic deliveryZones={MOCK_MAP_DATA.deliveryZones} courierLocations={MOCK_MAP_DATA.courierLocations} />
      <div style={{ marginBottom: 24 }}>
        <label style={{ marginRight: 8 }}>Zaman Aralığı:</label>
        <select value={timeRange} onChange={e => setTimeRange(e.target.value)}>
          {timeRanges.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <label style={{ margin: '0 8px' }}>Başlangıç:</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <label style={{ margin: '0 8px' }}>Bitiş:</label>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </div>
      <DeliveryTrendChart data={trendData} loading={loading} />
      <h2 style={{ marginTop: 48 }}>Bölge Performansları</h2>
      <ZonePerformanceBarChart
        data={zoneData}
        loading={zoneLoading}
        onDateRangeChange={fetchZonePerformance}
      />
      <h2 style={{ marginTop: 48 }}>Kurye Karşılaştırma</h2>
      <CourierPerformance />
      <h2 style={{ marginTop: 48 }}>Raporlama</h2>
      <ReportManager onGenerateReport={handleGenerateReport} />
    </div>
  );
} 