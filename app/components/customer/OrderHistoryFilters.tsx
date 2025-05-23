import { useState, useEffect } from 'react';
import {
  Calendar,
  DollarSign,
  Building,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Package
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// Sipariş durumları
type OrderStatus = 
  'PENDING' | 
  'PROCESSING' | 
  'PREPARING' | 
  'READY' | 
  'IN_TRANSIT' | 
  'DELIVERED' | 
  'CANCELLED';

const statusNames = {
  PENDING: 'Beklemede',
  PROCESSING: 'İşleniyor',
  PREPARING: 'Hazırlanıyor',
  READY: 'Hazır',
  IN_TRANSIT: 'Yolda',
  DELIVERED: 'Teslim Edildi',
  CANCELLED: 'İptal Edildi'
};

interface BusinessOption {
  id: string;
  name: string;
}

interface FilterOptions {
  startDate: string;
  endDate: string;
  minPrice: string;
  maxPrice: string;
  businessId: string;
  statusFilter: OrderStatus[];
  sortBy: string;
  sortOrder: string;
}

interface Props {
  businesses: BusinessOption[];
  onFilterChange: (filters: FilterOptions) => void;
  onReset: () => void;
}

export default function OrderHistoryFilters({ businesses, onFilterChange, onReset }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: '',
    endDate: '',
    minPrice: '',
    maxPrice: '',
    businessId: '',
    statusFilter: [],
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Filter değişikliklerini kontrol et
  useEffect(() => {
    const hasFilters = 
      filters.startDate !== '' || 
      filters.endDate !== '' || 
      filters.minPrice !== '' || 
      filters.maxPrice !== '' || 
      filters.businessId !== '' || 
      filters.statusFilter.length > 0 ||
      filters.sortBy !== 'createdAt' ||
      filters.sortOrder !== 'desc';
    
    setHasActiveFilters(hasFilters);
  }, [filters]);

  // Filter değerlerini güncelle
  const handleFilterChange = (name: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Status filtre durumunu değiştir
  const toggleStatus = (status: OrderStatus) => {
    setFilters(prev => {
      const statusFilter = [...prev.statusFilter];
      const index = statusFilter.indexOf(status);
      
      if (index === -1) {
        statusFilter.push(status);
      } else {
        statusFilter.splice(index, 1);
      }
      
      return {
        ...prev,
        statusFilter
      };
    });
  };

  // Filtreleri uygula
  const applyFilters = () => {
    onFilterChange(filters);
  };

  // Filtreleri sıfırla
  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      minPrice: '',
      maxPrice: '',
      businessId: '',
      statusFilter: [],
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    onReset();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-gray-700 font-medium"
        >
          <Filter size={18} className="mr-2" />
          Filtreler
          {hasActiveFilters && (
            <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
              Aktif
            </span>
          )}
          {isExpanded ? <ChevronUp size={18} className="ml-2" /> : <ChevronDown size={18} className="ml-2" />}
        </button>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-sm text-red-600 hover:text-red-800 flex items-center"
          >
            <X size={14} className="mr-1" />
            Filtreleri Temizle
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tarih aralığı */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <Calendar size={16} className="mr-2" />
                Tarih Aralığı
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Başlangıç</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full p-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bitiş</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full p-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Fiyat aralığı */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <DollarSign size={16} className="mr-2" />
                Fiyat Aralığı
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">En Az</label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full p-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">En Çok</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    placeholder="1000"
                    min="0"
                    className="w-full p-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* İşletme seçimi */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <Building size={16} className="mr-2" />
                İşletme
              </label>
              <select
                value={filters.businessId}
                onChange={(e) => handleFilterChange('businessId', e.target.value)}
                className="w-full p-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Tüm İşletmeler</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sipariş durumu seçimi */}
          <div className="mt-4 pt-4 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Clock size={16} className="mr-2" />
              Sipariş Durumu
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusNames).map(([status, label]) => (
                <button
                  key={status}
                  onClick={() => toggleStatus(status as OrderStatus)}
                  className={`px-3 py-1.5 text-xs rounded-full flex items-center 
                    ${filters.statusFilter.includes(status as OrderStatus)
                      ? getStatusColor(status as OrderStatus, true)
                      : getStatusColor(status as OrderStatus, false)
                    }`}
                >
                  {getStatusIcon(status as OrderStatus, 14)}
                  <span className="ml-1">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sıralama seçimi */}
          <div className="mt-4 pt-4 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              Sıralama
            </label>
            <div className="grid grid-cols-2 gap-4">
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="p-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500"
              >
                <option value="createdAt">Sipariş Tarihi</option>
                <option value="totalPrice">Toplam Fiyat</option>
                <option value="status">Durum</option>
              </select>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="p-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500"
              >
                <option value="desc">Azalan</option>
                <option value="asc">Artan</option>
              </select>
            </div>
          </div>

          {/* Butonlar */}
          <div className="mt-4 pt-4 border-t flex justify-end space-x-3">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Sıfırla
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Filtreleri Uygula
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Sipariş durumuna göre renk ve ikon belirle
function getStatusColor(status: OrderStatus, isActive: boolean): string {
  if (isActive) {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500 text-white';
      case 'PROCESSING': return 'bg-blue-500 text-white';
      case 'PREPARING': return 'bg-indigo-500 text-white';
      case 'READY': return 'bg-purple-500 text-white';
      case 'IN_TRANSIT': return 'bg-cyan-500 text-white';
      case 'DELIVERED': return 'bg-green-500 text-white';
      case 'CANCELLED': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  } else {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'PREPARING': return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
      case 'READY': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'IN_TRANSIT': return 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200';
      case 'DELIVERED': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  }
}

function getStatusIcon(status: OrderStatus, size: number) {
  switch (status) {
    case 'PENDING': return <Clock size={size} />;
    case 'PROCESSING': return <Package size={size} />;
    case 'PREPARING': return <Package size={size} />;
    case 'READY': return <CheckCircle size={size} />;
    case 'IN_TRANSIT': return <Truck size={size} />;
    case 'DELIVERED': return <CheckCircle size={size} />;
    case 'CANCELLED': return <XCircle size={size} />;
    default: return <Clock size={size} />;
  }
} 