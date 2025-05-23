import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

interface ZonePerformanceData {
  zoneId: string;
  metrics: {
    totalDeliveries: number;
    averageDeliveryTime: number;
    successRate: number;
  };
}

interface ZonePerformanceBarChartProps {
  data: ZonePerformanceData[];
  loading?: boolean;
  onDateRangeChange?: (start: string, end: string) => void;
}

export default function ZonePerformanceBarChart({ data, loading, onDateRangeChange }: ZonePerformanceBarChartProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dataFetched, setDataFetched] = useState(false);

  // Ensure data is a valid array and all entries have expected structure
  const safeData = Array.isArray(data) ? data.map(zone => ({
    zoneId: zone?.zoneId || 'Unknown',
    metrics: {
      totalDeliveries: typeof zone?.metrics?.totalDeliveries === 'number' ? zone.metrics.totalDeliveries : 0,
      averageDeliveryTime: typeof zone?.metrics?.averageDeliveryTime === 'number' ? zone.metrics.averageDeliveryTime : 0,
      successRate: typeof zone?.metrics?.successRate === 'number' ? zone.metrics.successRate : 0
    }
  })) : [];

  useEffect(() => {
    // Prevent unnecessary API calls
    if (dataFetched) return;
    
    if (onDateRangeChange) {
      onDateRangeChange(startDate, endDate);
      setDataFetched(true);
    }
  }, [startDate, endDate, onDateRangeChange, dataFetched]);

  // Reset data fetched state when dates change
  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
    setDataFetched(false);
  };

  return (
    <div style={{ width: '100%', padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <label>Başlangıç: <input 
          type="date" 
          value={startDate} 
          onChange={e => handleDateChange('start', e.target.value)} 
        /></label>
        <label>Bitiş: <input 
          type="date" 
          value={endDate} 
          onChange={e => handleDateChange('end', e.target.value)} 
        /></label>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={safeData} margin={{ top: 16, right: 32, left: 8, bottom: 32 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="zoneId" label={{ value: 'Bölge', position: 'insideBottom', offset: -20 }} />
          <YAxis yAxisId="left" label={{ value: 'Teslimat', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'Başarı Oranı (%)', angle: 90, position: 'insideRight' }} />
          <Tooltip formatter={(value: any, name: string) => [value, name === 'metrics.totalDeliveries' ? 'Toplam Teslimat' : name === 'metrics.successRate' ? 'Başarı Oranı (%)' : 'Ortalama Süre (dk)']} />
          <Legend />
          <Bar yAxisId="left" dataKey="metrics.totalDeliveries" name="Toplam Teslimat" fill="#8884d8" />
          <Bar yAxisId="right" dataKey="metrics.successRate" name="Başarı Oranı (%)" fill="#82ca9d" />
          <Bar yAxisId="left" dataKey="metrics.averageDeliveryTime" name="Ortalama Süre (dk)" fill="#ffc658" />
        </BarChart>
      </ResponsiveContainer>
      {loading && <div>Yükleniyor...</div>}
    </div>
  );
} 