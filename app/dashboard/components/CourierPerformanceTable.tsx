'use client';
import { useEffect, useState } from 'react';
import { FilterState } from './DashboardFilters';
import { StarIcon } from 'lucide-react';

interface CourierPerformanceTableProps {
  filters: FilterState | null;
  loading?: boolean;
}

interface CourierData {
  id: string;
  name: string;
  totalDeliveries: number;
  completedDeliveries: number;
  successRate: number;
  avgDeliveryTime: number;
  rating: number;
}

export function CourierPerformanceTable({ filters, loading = false }: CourierPerformanceTableProps) {
  const [data, setData] = useState<CourierData[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [sortField, setSortField] = useState<keyof CourierData>('totalDeliveries');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchData = async () => {
      if (!filters) return;
      
      setTableLoading(true);
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
        const response = await fetch(`/api/dashboard/courier-performance?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Kurye performansı verileri alınamadı');
        }
        
        const responseData = await response.json();
        setData(responseData);
      } catch (error) {
        console.error('Kurye performansı verileri yüklenirken hata oluştu:', error);
      } finally {
        setTableLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const handleSort = (field: keyof CourierData) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    return 0;
  });

  const renderSortIcon = (field: keyof CourierData) => {
    if (field !== sortField) return null;
    
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <StarIcon 
        key={i} 
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  if (loading || tableLoading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm h-[400px] flex items-center justify-center">
        <div className="text-gray-500">Veriler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm overflow-hidden">
      <h3 className="text-lg font-medium mb-4">Kurye Performansı</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('name')}
              >
                Kurye{renderSortIcon('name')}
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('totalDeliveries')}
              >
                Toplam Teslimat{renderSortIcon('totalDeliveries')}
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('successRate')}
              >
                Başarı Oranı{renderSortIcon('successRate')}
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('avgDeliveryTime')}
              >
                Ort. Süre (dk){renderSortIcon('avgDeliveryTime')}
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('rating')}
              >
                Değerlendirme{renderSortIcon('rating')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                  Bu filtrelere uygun kurye bulunamadı
                </td>
              </tr>
            ) : (
              sortedData.map((courier) => (
                <tr key={courier.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {courier.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {courier.totalDeliveries.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <div 
                        className={`h-2 w-16 bg-gray-200 rounded-full overflow-hidden mr-2`}
                      >
                        <div 
                          className={`h-full ${
                            courier.successRate >= 90 ? 'bg-green-500' : 
                            courier.successRate >= 75 ? 'bg-yellow-500' : 
                            'bg-red-500'
                          }`}
                          style={{ width: `${courier.successRate}%` }}
                        />
                      </div>
                      <span>%{courier.successRate}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {courier.avgDeliveryTime}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      {renderStars(courier.rating)}
                      <span className="ml-1">{courier.rating.toFixed(1)}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 