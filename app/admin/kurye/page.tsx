'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface Courier {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  zone: string;
  deliveries: number;
  rating: number;
}

export default function CouriersPage() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');

  useEffect(() => {
    fetchCouriers();
  }, []);

  const fetchCouriers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await axios.get('/api/couriers', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && Array.isArray(response.data.couriers)) {
        // API'den gelen veriyi uygun formata dönüştür
        const formattedCouriers = response.data.couriers.map((courier: any) => ({
          id: courier.id,
          name: courier.user?.name || 'İsimsiz Kurye',
          email: courier.user?.email || 'E-posta yok',
          phone: courier.phone || 'Telefon yok',
          status: courier.status?.toLowerCase() || 'offline',
          zone: courier.zone?.name || 'Belirtilmemiş',
          deliveries: courier.deliveryCount || 0,
          rating: courier.ratings || 0
        }));
        
        setCouriers(formattedCouriers);
      } else {
        setCouriers([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Kuryeleri getirme hatası:', error);
      setLoading(false);
      // Hata durumunda boş liste göster
      setCouriers([]);
    }
  };

  // Arama ve filtreleme işlemleri
  const filteredCouriers = couriers.filter(courier => {
    const matchesSearch = 
      courier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      courier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      courier.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || courier.status === statusFilter;
    
    const matchesZone = zoneFilter === 'all' || courier.zone === zoneFilter;
    
    return matchesSearch && matchesStatus && matchesZone;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Aktif</span>;
      case 'idle': 
        return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">Boşta</span>;
      case 'offline':
        return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">Çevrimdışı</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">Bilinmiyor</span>;
    }
  };

  // Bölge listesini oluştur
  const zones = Array.from(new Set(couriers.map(courier => courier.zone)));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Kuryeler</h1>
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="İsim, e-posta veya telefon ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[300px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-[180px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="idle">Boşta</option>
            <option value="offline">Çevrimdışı</option>
          </select>
          
          <select 
            value={zoneFilter} 
            onChange={(e) => setZoneFilter(e.target.value)}
            className="w-[180px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tüm Bölgeler</option>
            {zones.map(zone => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={() => window.location.href = '/admin/couriers/add'} 
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Yeni Kurye Ekle
        </button>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Kurye Listesi</h2>
          <button 
            onClick={fetchCouriers}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Yenile
          </button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredCouriers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İsim</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-posta</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bölge</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teslimat</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCouriers.map((courier) => (
                    <tr key={courier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{courier.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{courier.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{courier.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {courier.zone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{courier.deliveries}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-yellow-500">★</span>
                          <span className="ml-1">{courier.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(courier.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button 
                          onClick={() => window.location.href = `/admin/couriers/${courier.id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          Detaylar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium">Kurye Bulunamadı</h3>
              <p className="text-sm text-gray-500 mt-1">
                Arama kriterlerinize uygun kurye bulunmamaktadır.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 