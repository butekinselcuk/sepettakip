'use client';

import { Card } from '@/components/ui/card';
import { 
  Package, 
  Clock, 
  TrendingUp, 
  Users,
  DollarSign,
  TruckIcon, 
  ClockIcon, 
  UserIcon, 
  BanknoteIcon, 
  CheckCircleIcon 
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { FilterState } from './DashboardFilters';

interface SummaryCardsProps {
  filters: FilterState | null;
  loading?: boolean;
}

interface SummaryData {
  totalDeliveries: number;
  todayDeliveries: number;
  avgDeliveryTime: number;
  activeCouriers: number;
  totalIncome: number;
  successRate: number;
}

function SummaryCard({ title, value, icon, trend }: { title: string; value: string | number; icon: React.ReactNode; trend?: string }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
          {trend && (
            <p className="text-sm mt-1 text-gray-400">{trend}</p>
          )}
        </div>
        <div className="p-3 bg-primary/10 rounded-full">
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function SummaryCards({ filters, loading = false }: SummaryCardsProps) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!filters) return;
      
      setSummaryLoading(true);
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
        const response = await fetch(`/api/dashboard/summary?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Özet veriler alınamadı');
        }
        
        const responseData = await response.json();
        
        setData(responseData);
      } catch (error) {
        console.error('Özet veriler yüklenirken hata oluştu:', error);
      } finally {
        setSummaryLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  if (loading || summaryLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-2 w-2/3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Toplam Teslimat",
      value: data.totalDeliveries.toLocaleString(),
      icon: <TruckIcon className="h-5 w-5 text-blue-500" />,
      description: "Bu ay toplam",
      color: "bg-blue-50"
    },
    {
      title: "Bugünkü Teslimat",
      value: data.todayDeliveries.toLocaleString(),
      icon: <TruckIcon className="h-5 w-5 text-indigo-500" />,
      description: "Bugün",
      color: "bg-indigo-50"
    },
    {
      title: "Ort. Teslimat Süresi",
      value: `${data.avgDeliveryTime} dk`,
      icon: <ClockIcon className="h-5 w-5 text-yellow-500" />,
      description: "Ortalama süre",
      color: "bg-yellow-50"
    },
    {
      title: "Aktif Kuryeler",
      value: data.activeCouriers.toString(),
      icon: <UserIcon className="h-5 w-5 text-green-500" />,
      description: "Şu anda aktif",
      color: "bg-green-50"
    },
    {
      title: "Toplam Gelir",
      value: `₺${data.totalIncome.toLocaleString()}`,
      icon: <BanknoteIcon className="h-5 w-5 text-purple-500" />,
      description: "Bu ay toplam",
      color: "bg-purple-50"
    },
    {
      title: "Başarı Oranı",
      value: `%${data.successRate}`,
      icon: <CheckCircleIcon className="h-5 w-5 text-teal-500" />,
      description: "Tamamlanan siparişler",
      color: "bg-teal-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className={`${card.color} p-4 rounded-lg shadow-sm`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-gray-600">{card.title}</span>
            {card.icon}
          </div>
          <div className="text-2xl font-bold mb-1">{card.value}</div>
          <div className="text-xs text-gray-500">{card.description}</div>
        </div>
      ))}
    </div>
  );
} 