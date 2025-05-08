'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarIcon } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Calendar } from '../../../components/ui/calendar';
import { Checkbox } from '../../../components/ui/checkbox';
import {
  Select, 
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../components/ui/select';

export interface FilterState {
  dateRange: {
    from: Date;
    to: Date;
  };
  region: string;
  courier: string;
  status: string;
  platform: string;
  orderType: string;
  minAmount: number | null;
  maxAmount: number | null;
  freeText: string;
  onlyLate: boolean;
}

interface DashboardFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  loading?: boolean;
}

interface RegionOption {
  id: string;
  name: string;
}

interface CourierOption {
  id: string;
  name: string;
}

interface PlatformOption {
  id: string;
  name: string;
}

export function DashboardFilters({ onFilterChange, loading = false }: DashboardFiltersProps) {
  // Varsayılan değerler
  const defaultFilters: FilterState = {
    dateRange: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // son 7 gün
      to: new Date(),
    },
    region: 'all',
    courier: 'all',
    status: 'all',
    platform: 'all',
    orderType: 'all',
    minAmount: null,
    maxAmount: null,
    freeText: '',
    onlyLate: false,
  };

  // State tanımlamaları
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [regionOptions, setRegionOptions] = useState<RegionOption[]>([]);
  const [courierOptions, setCourierOptions] = useState<CourierOption[]>([]);
  const [platformOptions, setPlatformOptions] = useState<PlatformOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Filtre seçeneklerini yükleme
  useEffect(() => {
    const loadFilterOptions = async () => {
      setLoadingOptions(true);
      try {
        // API'den seçenekleri yükleme simülasyonu (gerçek uygulamada burası API çağrısı olacak)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Örnek veriler
        setRegionOptions([
          { id: 'region1', name: 'Kadıköy' },
          { id: 'region2', name: 'Üsküdar' },
          { id: 'region3', name: 'Beşiktaş' },
          { id: 'region4', name: 'Şişli' },
          { id: 'region5', name: 'Maltepe' },
        ]);
        
        setCourierOptions([
          { id: 'courier1', name: 'Ahmet Yılmaz' },
          { id: 'courier2', name: 'Mehmet Demir' },
          { id: 'courier3', name: 'Ayşe Kaya' },
          { id: 'courier4', name: 'Fatma Çelik' },
          { id: 'courier5', name: 'Ali Öztürk' },
        ]);
        
        setPlatformOptions([
          { id: 'platform1', name: 'Yemeksepeti' },
          { id: 'platform2', name: 'Trendyol' }, 
          { id: 'platform3', name: 'Getir' },
          { id: 'platform4', name: 'Migros' },
        ]);
      } catch (error) {
        console.error('Filtre seçenekleri yüklenirken hata oluştu:', error);
      } finally {
        setLoadingOptions(false);
      }
    };
    
    loadFilterOptions();
  }, []);

  // Filtre değişikliklerini üst bileşene bildirme (debounce ile)
  const debouncedFilterChange = useCallback(
    debounce((newFilters: FilterState) => {
      onFilterChange(newFilters);
    }, 300),
    [onFilterChange]
  );

  // Herhangi bir filtre değiştiğinde tetiklenir
  useEffect(() => {
    debouncedFilterChange(filters);
  }, [filters, debouncedFilterChange]);

  // Tarihleri formatla
  const formatDateRange = () => {
    const from = filters.dateRange.from.toLocaleDateString();
    const to = filters.dateRange.to.toLocaleDateString();
    return `${from} - ${to}`;
  };

  // Tüm filtreleri sıfırla
  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  // Filtre değişikliklerini handle et
  const handleFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Tutar filtreleri için input değişikliklerini handle et
  const handleAmountFilterChange = (key: 'minAmount' | 'maxAmount', value: string) => {
    const numValue = value ? parseFloat(value) : null;
    handleFilterChange(key, numValue as FilterState[typeof key]);
  };

  if (loading) {
    return <div className="p-4 bg-gray-50 rounded animate-pulse">Filtreler yükleniyor...</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tarih Aralığı */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tarih Aralığı</label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal bg-white"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{
                  from: filters.dateRange.from,
                  to: filters.dateRange.to,
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    handleFilterChange('dateRange', {
                      from: range.from,
                      to: range.to,
                    });
                    setIsCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Bölge */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bölge</label>
          <Select
            value={filters.region}
            onValueChange={(value) => handleFilterChange('region', value)}
            disabled={loadingOptions}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Tüm bölgeler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm bölgeler</SelectItem>
              {regionOptions.map((region) => (
                <SelectItem key={region.id} value={region.id}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Kurye */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kurye</label>
          <Select
            value={filters.courier}
            onValueChange={(value) => handleFilterChange('courier', value)}
            disabled={loadingOptions}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Tüm kuryeler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm kuryeler</SelectItem>
              {courierOptions.map((courier) => (
                <SelectItem key={courier.id} value={courier.id}>
                  {courier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Durum */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Tüm durumlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm durumlar</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
              <SelectItem value="in_progress">Devam Ediyor</SelectItem>
              <SelectItem value="cancelled">İptal Edildi</SelectItem>
              <SelectItem value="delayed">Gecikti</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Platform */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
          <Select
            value={filters.platform}
            onValueChange={(value) => handleFilterChange('platform', value)}
            disabled={loadingOptions}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Tüm platformlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm platformlar</SelectItem>
              {platformOptions.map((platform) => (
                <SelectItem key={platform.id} value={platform.id}>
                  {platform.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sipariş Tipi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sipariş Tipi</label>
          <Select
            value={filters.orderType}
            onValueChange={(value) => handleFilterChange('orderType', value)}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Tüm tipler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm tipler</SelectItem>
              <SelectItem value="food">Yemek</SelectItem>
              <SelectItem value="market">Market</SelectItem>
              <SelectItem value="package">Paket</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Minimum Tutar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min. Tutar (₺)</label>
          <Input
            type="number"
            placeholder="Min tutar"
            value={filters.minAmount || ''}
            onChange={(e) => handleAmountFilterChange('minAmount', e.target.value)}
            className="bg-white"
          />
        </div>

        {/* Maksimum Tutar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max. Tutar (₺)</label>
          <Input
            type="number"
            placeholder="Max tutar"
            value={filters.maxAmount || ''}
            onChange={(e) => handleAmountFilterChange('maxAmount', e.target.value)}
            className="bg-white"
          />
        </div>

        {/* Arama */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Arama</label>
          <Input
            placeholder="Sipariş kodu, müşteri adı..."
            value={filters.freeText}
            onChange={(e) => handleFilterChange('freeText', e.target.value)}
            className="bg-white"
          />
        </div>
      </div>

      <div className="flex justify-between items-center pt-2">
        <div className="flex items-center">
          <Checkbox
            id="onlyLate"
            checked={filters.onlyLate}
            onCheckedChange={(checked) => 
              handleFilterChange('onlyLate', checked === true)
            }
          />
          <label
            htmlFor="onlyLate"
            className="ml-2 text-sm font-medium text-gray-700"
          >
            Sadece geciken teslimatları göster
          </label>
        </div>
        <Button variant="outline" onClick={resetFilters}>
          Filtreleri Sıfırla
        </Button>
      </div>
    </div>
  );
}

// Yardımcı fonksiyon: debounce
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
} 