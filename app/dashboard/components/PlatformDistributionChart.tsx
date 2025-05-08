'use client';

import { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  Tooltip 
} from 'recharts';
import { FilterState } from './DashboardFilters';

interface PlatformDistributionChartProps {
  filters: FilterState | null;
  loading?: boolean;
}

interface PlatformData {
  name: string;
  value: number;
  percentage: number;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export function PlatformDistributionChart({ filters, loading = false }: PlatformDistributionChartProps) {
  const [data, setData] = useState<PlatformData[]>([]);
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
        const response = await fetch(`/api/dashboard/platform-distribution?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Platform dağılımı verileri alınamadı');
        }
        
        const responseData = await response.json();
        setData(responseData);
      } catch (error) {
        console.error('Platform dağılımı verileri yüklenirken hata oluştu:', error);
      } finally {
        setChartLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  if (loading || chartLoading || data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm h-[300px] flex items-center justify-center">
        <div className="text-gray-500">Veriler yükleniyor...</div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border rounded shadow text-sm">
          <p className="font-medium">{data.name}</p>
          <p>Teslimat Sayısı: {data.value}</p>
          <p>Oran: %{data.percentage.toFixed(1)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">Platform Dağılımı</h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percentage }) => `${name}: %${percentage.toFixed(1)}`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(value, entry, index) => `${value}: %${data[index].percentage.toFixed(1)}`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 