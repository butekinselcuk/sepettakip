import { useState } from 'react'

type FilterProps = {
  onFilterChange: (filters: {
    status?: string
    platform?: string
    dateRange?: { start: string; end: string }
    search?: string
  }) => void
}

export default function OrderFilter({ onFilterChange }: FilterProps) {
  const [filters, setFilters] = useState({
    status: '',
    platform: '',
    dateRange: { start: '', end: '' },
    search: '',
  })

  const handleFilterChange = (key: string, value: string | { start: string; end: string }) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Status Filter */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700"
          >
            Durum
          </label>
          <select
            id="status"
            name="status"
            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="PENDING">Beklemede</option>
            <option value="ACCEPTED">Kabul Edildi</option>
            <option value="PREPARING">Hazırlanıyor</option>
            <option value="READY_FOR_PICKUP">Teslimata Hazır</option>
            <option value="PICKED_UP">Teslim Alındı</option>
            <option value="IN_TRANSIT">Yolda</option>
            <option value="DELIVERED">Teslim Edildi</option>
            <option value="CANCELLED">İptal Edildi</option>
          </select>
        </div>

        {/* Platform Filter */}
        <div>
          <label
            htmlFor="platform"
            className="block text-sm font-medium text-gray-700"
          >
            Platform
          </label>
          <select
            id="platform"
            name="platform"
            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            value={filters.platform}
            onChange={(e) => handleFilterChange('platform', e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="YEMEKSEPETI">Yemeksepeti</option>
            <option value="GETIR">Getir</option>
            <option value="TRENDYOL">Trendyol</option>
            <option value="MIGROS">Migros</option>
            <option value="MANUAL">Manuel</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <label
            htmlFor="date-start"
            className="block text-sm font-medium text-gray-700"
          >
            Başlangıç Tarihi
          </label>
          <input
            type="date"
            id="date-start"
            name="date-start"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={filters.dateRange.start}
            onChange={(e) =>
              handleFilterChange('dateRange', {
                ...filters.dateRange,
                start: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label
            htmlFor="date-end"
            className="block text-sm font-medium text-gray-700"
          >
            Bitiş Tarihi
          </label>
          <input
            type="date"
            id="date-end"
            name="date-end"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={filters.dateRange.end}
            onChange={(e) =>
              handleFilterChange('dateRange', {
                ...filters.dateRange,
                end: e.target.value,
              })
            }
          />
        </div>
      </div>

      {/* Search Filter */}
      <div className="mt-4">
        <label
          htmlFor="search"
          className="block text-sm font-medium text-gray-700"
        >
          Arama
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="search"
            name="search"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Sipariş no, müşteri adı..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
} 