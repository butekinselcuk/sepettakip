'use client';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Label } from '@/components/ui/label';
import React, { useState, useEffect } from 'react';
import CustomizableChart from './CustomizableChart';
// import RealtimeDashboard from './RealtimeDashboard';
import dynamic from 'next/dynamic';
import InteractiveMap from './InteractiveMap';
import ReportManager from './ReportManager';
import DeliveryTrendChart, { DeliveryTrendData } from './DeliveryTrendChart';
import ZonePerformanceBarChart from './ZonePerformanceBarChart';
import StatCard from './StatCard';
import CourierPerformance from './CourierPerformance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const InteractiveMapDynamic = dynamic(() => import('./InteractiveMap'), { ssr: false });

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
  const [dataFetched, setDataFetched] = useState(false);
  const [mapData, setMapData] = useState<any>({
    deliveryZones: [],
    courierLocations: []
  });

  useEffect(() => {
    // Prevent recursive calls and only fetch when needed
    if (dataFetched) return;
    
    async function fetchTrends() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('timeRange', timeRange);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const res = await fetch(`/api/deliveries/trends?${params.toString()}`);
        const json = await res.json();

        let chartData: DeliveryTrendData[] = [];
        if (json && Array.isArray(json) && json.length > 0 && 
            json[0]?.hourlyDistribution && Array.isArray(json[0].hourlyDistribution)) {
          chartData = json[0].hourlyDistribution.map((item: any) => ({
            date: `${item.hour || 0}:00`,
            totalDeliveries: item.count || 0,
            completedDeliveries: item.count || 0,
            averageDeliveryTime: item.averageTime || 0,
          }));
        }
        
        setTrendData(chartData);
      } catch (error) {
        console.error("Error fetching trend data:", error);
        setTrendData([]);
      } finally {
        setLoading(false);
        setDataFetched(true);
      }
    }
    
    fetchTrends();
    
    // Fetch map data
    fetchMapData();
  }, [timeRange, startDate, endDate, dataFetched]);
  
  // Fetch map data with actual API
  const fetchMapData = async () => {
    try {
      // Fetch delivery zones
      const zonesRes = await fetch('/api/zones');
      const zonesData = await zonesRes.json();
      
      // Fetch courier locations
      const couriersRes = await fetch('/api/couriers/locations');
      const couriersData = await couriersRes.json();
      
      setMapData({
        deliveryZones: Array.isArray(zonesData) ? zonesData.map((zone: any) => ({
          id: zone.id || '',
          name: zone.name || '',
          coordinates: zone.coordinates || [],
          color: '#' + Math.floor(Math.random()*16777215).toString(16) // Random color
        })) : [],
        courierLocations: Array.isArray(couriersData) ? couriersData.map((courier: any) => ({
          id: courier.id || '',
          name: courier.name || '',
          position: courier.position || [41.0, 29.0],
          status: courier.status || 'idle',
          currentDelivery: courier.currentDelivery
        })) : []
      });
    } catch (error) {
      console.error("Error fetching map data:", error);
      // Set empty data on error
      setMapData({
        deliveryZones: [],
        courierLocations: []
      });
    }
  };

  const fetchZonePerformance = async (start?: string, end?: string) => {
    setZoneLoading(true);
    try {
      let url = '/api/zones/performance';
      const params = [];
      if (start) params.push(`startDate=${start}`);
      if (end) params.push(`endDate=${end}`);
      if (params.length) url += '?' + params.join('&');
      
      const res = await fetch(url);
      const data = await res.json();
      
      // Ensure data is an array
      setZoneData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching zone performance:", error);
      setZoneData([]);
    } finally {
      setZoneLoading(false);
    }
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

  // Reset data fetched state when filters change
  useEffect(() => {
    setDataFetched(false);
  }, [timeRange, startDate, endDate]);

  // Ensure zoneData is an array
  const safeZoneData = Array.isArray(zoneData) ? zoneData : [];
  
  // StatCard metriklerini hesapla - with safety checks
  const totalDeliveries = safeZoneData.reduce((acc, z) => {
    const deliveries = z?.metrics?.totalDeliveries;
    return acc + (typeof deliveries === 'number' ? deliveries : 0);
  }, 0);
    
  const averageSuccessRate = safeZoneData.length > 0
    ? (safeZoneData.reduce((acc, z) => {
        const rate = z?.metrics?.successRate;
        return acc + (typeof rate === 'number' ? rate : 0);
      }, 0) / safeZoneData.length)
    : 0;
    
  const averageDeliveryTime = safeZoneData.length > 0
    ? (safeZoneData.reduce((acc, z) => {
        const time = z?.metrics?.averageDeliveryTime;
        return acc + (typeof time === 'number' ? time : 0);
      }, 0) / safeZoneData.length)
    : 0;
    
  // Aktif kurye sayısı için zoneData'da courierDistribution varsa kullan
  const activeCouriers = safeZoneData.reduce((acc, z) => {
    const couriers = z?.courierDistribution;
    return acc + (Array.isArray(couriers) ? couriers.length : 0);
  }, 0);

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
      <InteractiveMapDynamic deliveryZones={mapData.deliveryZones} courierLocations={mapData.courierLocations} />
      <div style={{ marginBottom: 24 }}>
        <label style={{ marginRight: 8 }}>Zaman Aralığı:</label>
        <select value={timeRange} onChange={e => {
          setTimeRange(e.target.value);
          setDataFetched(false);
        }}>
          {timeRanges.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <label style={{ margin: '0 8px' }}>Başlangıç:</label>
        <input 
          type="date" 
          value={startDate} 
          onChange={e => {
            setStartDate(e.target.value);
            setDataFetched(false);
          }} 
        />
        <label style={{ margin: '0 8px' }}>Bitiş:</label>
        <input 
          type="date" 
          value={endDate} 
          onChange={e => {
            setEndDate(e.target.value);
            setDataFetched(false);
          }} 
        />
      </div>
      <DeliveryTrendChart data={trendData} loading={loading} />
      <h2 style={{ marginTop: 48 }}>Bölge Performansları</h2>
      <ZonePerformanceBarChart
        data={safeZoneData}
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