'use client';
import { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { FilterState } from './DashboardFilters';

interface TrendChartProps {
  filters: FilterState | null;
  loading?: boolean;
}

interface DeliveryTrend {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
  percentage: number;
}

// API'den dönen veri tipi
interface ApiTrendItem {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
  percentage: number;
}

export function TrendChart({ filters, loading = false }: TrendChartProps) {
  const [data, setData] = useState<DeliveryTrend[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!filters) return;
      
      setChartLoading(true);
      try {
        // API URL ve parametreleri oluştur
        const params = new URLSearchParams();
        params.append('from', filters.dateRange.from.toISOString());
        params.append('to', filters.dateRange.to.toISOString());
        if (filters.region !== 'all') params.append('region', filters.region);
        if (filters.courier !== 'all') params.append('courier', filters.courier);
        if (filters.status !== 'all') params.append('status', filters.status);
        if (filters.platform !== 'all') params.append('platform', filters.platform);
        if (filters.orderType !== 'all') params.append('orderType', filters.orderType);
        if (filters.minAmount !== null) params.append('minAmount', filters.minAmount.toString());
        if (filters.maxAmount !== null) params.append('maxAmount', filters.maxAmount.toString());
        if (filters.onlyLate) params.append('onlyLate', 'true');
        
        // API çağrısı yap
        const response = await fetch(`/api/dashboard/trends?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Trend verileri alınamadı');
        }
        
        const responseData = await response.json();
        
        // Tarih formatını düzeltme
        const formattedData = responseData.map((item: ApiTrendItem) => ({
          ...item,
          date: new Date(item.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
        }));
        
        setData(formattedData);
      } catch (error) {
        console.error('Trend verileri yüklenirken hata oluştu:', error);
      } finally {
        setChartLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  if (loading || chartLoading || data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm h-[350px] flex items-center justify-center">
        <div className="text-gray-500">Veriler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">Teslimat Trendi</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
            <Tooltip formatter={(value: number, name: string) => {
              if (name === 'percentage') return [`%${value}`, 'Başarı Oranı'];
              return [value, name === 'total' ? 'Toplam' : name === 'completed' ? 'Tamamlanan' : 'İptal Edilen'];
            }} />
            <Legend formatter={(value) => {
              if (value === 'total') return 'Toplam Teslimat';
              if (value === 'completed') return 'Tamamlanan';
              if (value === 'cancelled') return 'İptal Edilen';
              if (value === 'percentage') return 'Başarı Oranı';
              return value;
            }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="completed"
              stroke="#10b981"
              strokeWidth={2}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cancelled"
              stroke="#ef4444"
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="percentage"
              stroke="#8b5cf6"
              strokeDasharray="5 5"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 