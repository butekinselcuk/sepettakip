'use client';
import { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LabelList 
} from 'recharts';
import { FilterState } from './DashboardFilters';

interface RegionPerformanceChartProps {
  filters: FilterState | null;
  loading?: boolean;
}

interface RegionData {
  name: string;
  id: string;
  total: number;
  successRate: number;
}

export function RegionPerformanceChart({ filters, loading = false }: RegionPerformanceChartProps) {
  const [data, setData] = useState<RegionData[]>([]);
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
        const response = await fetch(`/api/dashboard/region-performance?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Bölge performansı verileri alınamadı');
        }
        
        const responseData = await response.json();
        setData(responseData);
      } catch (error) {
        console.error('Bölge performansı verileri yüklenirken hata oluştu:', error);
      } finally {
        setChartLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  if (loading || chartLoading || data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm h-[400px] flex items-center justify-center">
        <div className="text-gray-500">Veriler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">Bölge Performansı</h3>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip formatter={(value, name) => {
              if (name === 'successRate') return [`%${value}`, 'Başarı Oranı'];
              return [value, 'Toplam Teslimat'];
            }} />
            <Legend formatter={(value) => {
              if (value === 'total') return 'Toplam Teslimat';
              if (value === 'successRate') return 'Başarı Oranı (%)';
              return value;
            }} />
            <Bar 
              dataKey="total" 
              fill="#3b82f6" 
              radius={[0, 4, 4, 0]}
            >
              <LabelList dataKey="total" position="right" />
            </Bar>
            <Bar 
              dataKey="successRate" 
              fill="#10b981" 
              radius={[0, 4, 4, 0]}
            >
              <LabelList dataKey="successRate" formatter={(value: number) => `%${value}`} position="right" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 