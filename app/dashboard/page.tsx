'use client';

import { useState, useEffect } from 'react';
import { DashboardFilters, FilterState } from './components/DashboardFilters';
import { SummaryCards } from './components/SummaryCards';
import { TrendChart } from './components/TrendChart';
import { RegionPerformanceChart } from './components/RegionPerformanceChart';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../../components/ui/tabs';

export default function DashboardPage() {
  const [filters, setFilters] = useState<FilterState | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Aktif filtre sayısını hesapla
  useEffect(() => {
    if (!filters) return;
    
    let count = 0;
    
    if (filters.region !== 'all') count++;
    if (filters.courier !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.platform !== 'all') count++;
    if (filters.orderType !== 'all') count++;
    if (filters.minAmount !== null) count++;
    if (filters.maxAmount !== null) count++;
    if (filters.freeText.trim() !== '') count++;
    if (filters.onlyLate) count++;
    
    setActiveFilterCount(count);
  }, [filters, setActiveFilterCount]);

  // Filtre değişikliklerini işle
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setLoading(true);
    
    // API çağrısı simülasyonu
    setTimeout(() => {
      setLoading(false);
      setLastUpdated(new Date());
    }, 500);
  };

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h1 className="text-2xl font-bold">Teslimat Yönetim Paneli</h1>
        <div className="flex items-center mt-2 sm:mt-0">
          {activeFilterCount > 0 && (
            <span className="text-sm mr-4 bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {activeFilterCount} aktif filtre
            </span>
          )}
          <span className="text-sm text-gray-500">
            Son güncelleme: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Filtreler */}
      <DashboardFilters onFilterChange={handleFilterChange} loading={loading} />

      {/* İstatistik Kartları */}
      <SummaryCards filters={filters} loading={loading} />

      {/* Grafikler ve Tablolar */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="trends">Trendler</TabsTrigger>
          <TabsTrigger value="regions">Bölgeler</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends" className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-4">Haftalık Teslimat Trendi</h3>
            <TrendChart filters={filters} loading={loading} />
          </div>
        </TabsContent>
        
        <TabsContent value="regions" className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-4">Bölge Performansı</h3>
            <RegionPerformanceChart filters={filters} loading={loading} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 