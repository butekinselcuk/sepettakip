'use client';

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { KuryeKonum } from '@/components/kurye/KonumTakip'

// Dynamically import KonumTakip component
const KonumTakip = dynamic(() => import('@/components/kurye/KonumTakip'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-96 bg-gray-100">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )
})

export default function KuryeKonumPage() {
  const [zoneFilter, setZoneFilter] = useState<string | undefined>(undefined)
  const [selectedKurye, setSelectedKurye] = useState<KuryeKonum | null>(null)

  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Kurye Konum Takibi</h1>
        <p className="text-gray-600">Aktif kuryelerin canlı konum takibi yapın.</p>
      </header>

      <div className="mb-4">
        <label htmlFor="zone" className="block text-sm font-medium text-gray-700">Bölge Filtresi</label>
        <select
          id="zone"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={zoneFilter || ''}
          onChange={(e) => setZoneFilter(e.target.value || undefined)}
        >
          <option value="">Tüm Bölgeler</option>
          <option value="kadikoy">Kadıköy</option>
          <option value="besiktas">Beşiktaş</option>
          <option value="sisli">Şişli</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden" style={{ height: '600px' }}>
          <KonumTakip 
            zoneId={zoneFilter} 
            refreshInterval={10000}
            onKuryeSelect={setSelectedKurye}
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 h-fit">
          <h2 className="text-xl font-bold mb-4">Kurye Detayları</h2>
          
          {selectedKurye ? (
            <div>
              <div className="mb-4 pb-3 border-b">
                <h3 className="font-bold text-lg">{selectedKurye.name}</h3>
                <p className="text-sm">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mr-2 ${
                    selectedKurye.status === 'active' ? 'bg-green-100 text-green-800' : 
                    selectedKurye.status === 'idle' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedKurye.status === 'active' ? 'Aktif' : 
                     selectedKurye.status === 'idle' ? 'Beklemede' : 'Çevrimdışı'}
                  </span>
                  <span>Son güncelleme: {new Date(selectedKurye.lastUpdate).toLocaleTimeString()}</span>
                </p>
              </div>

              {selectedKurye.currentDelivery ? (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Mevcut Teslimat</h4>
                  <p><span className="font-medium">Müşteri:</span> {selectedKurye.currentDelivery.customer}</p>
                  <p><span className="font-medium">Adres:</span> {selectedKurye.currentDelivery.address}</p>
                  <p>
                    <span className="font-medium">Tahmini Varış:</span> {' '}
                    {new Date(selectedKurye.currentDelivery.estimatedArrival).toLocaleTimeString()}
                  </p>
                </div>
              ) : (
                <p className="mb-4 italic text-gray-500">Aktif teslimat bulunmuyor</p>
              )}

              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Detaylar
                </button>
                <button className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                  Ara
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">Detayları görüntülemek için haritadan bir kurye seçin</p>
          )}
        </div>
      </div>
    </div>
  )
} 