'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface FilterProps {
  onFilterChange: (filters: FilterValues) => void;
}

export interface FilterValues {
  startDate: string;
  endDate: string;
  zoneId?: string;
  courierId?: string;
  status?: string;
}

export default function AnalyticsFilter({ onFilterChange }: FilterProps) {
  const [filters, setFilters] = useState<FilterValues>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newFilters = {
      ...filters,
      [e.target.name]: e.target.value
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Başlangıç Tarihi</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bitiş Tarihi</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bölge</label>
            <select
              name="zoneId"
              value={filters.zoneId || ''}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Tüm Bölgeler</option>
              {/* Bölge listesi API'den gelecek */}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kurye</label>
            <select
              name="courierId"
              value={filters.courierId || ''}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Tüm Kuryeler</option>
              {/* Kurye listesi API'den gelecek */}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Durum</label>
            <select
              name="status"
              value={filters.status || ''}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Tüm Durumlar</option>
              <option value="COMPLETED">Tamamlandı</option>
              <option value="FAILED">Başarısız</option>
              <option value="PENDING">Beklemede</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 