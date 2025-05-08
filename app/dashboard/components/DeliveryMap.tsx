'use client';

import { useState, useEffect, useRef } from 'react';
import { FilterState } from './DashboardFilters';

interface DeliveryMapProps {
  filters: FilterState | null;
  loading?: boolean;
}

interface DeliveryLocation {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  address: string;
  courierId: string;
  courierName: string;
  timestamp: string;
}

export function DeliveryMap({ filters, loading = false }: DeliveryMapProps) {
  const [mapLoading, setMapLoading] = useState(false);
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // Harita yükleme fonksiyonu
    const loadMap = async () => {
      if (!mapRef.current || typeof window === 'undefined') return;
      
      if (!window.google) {
        // Gerçek uygulamada Google Maps script'ini yükleyin
        console.error('Google Maps API yüklenmedi');
        return;
      }

      if (mapInstanceRef.current) return;

      // İstanbul koordinatları
      const center = { lat: 41.0082, lng: 28.9784 };
      
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 12,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });
    };

    loadMap();

    return () => {
      // Marker'ları temizle
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  useEffect(() => {
    // Filtrelere göre teslimat lokasyonlarını yükle
    const fetchLocations = async () => {
      if (!filters || !mapInstanceRef.current) return;
      
      setMapLoading(true);
      
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
        const response = await fetch(`/api/dashboard/delivery-locations?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Teslimat lokasyonları alınamadı');
        }
        
        const responseData = await response.json();
        setLocations(responseData);
        
        // Mevcut marker'ları temizle
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
        
        // Yeni marker'ları oluştur
        responseData.forEach((location: DeliveryLocation) => {
          const position = { 
            lat: location.latitude, 
            lng: location.longitude 
          };
          
          const iconUrl = getMarkerIcon(location.status);
          
          const marker = new window.google.maps.Marker({
            position,
            map: mapInstanceRef.current,
            title: location.address,
            icon: {
              url: iconUrl,
              scaledSize: new window.google.maps.Size(30, 30)
            }
          });
          
          // Marker için info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <p class="font-semibold">${location.address}</p>
                <p class="text-sm">Kurye: ${location.courierName}</p>
                <p class="text-sm">Durum: ${getStatusText(location.status)}</p>
                <p class="text-sm">Zaman: ${new Date(location.timestamp).toLocaleString('tr-TR')}</p>
              </div>
            `
          });
          
          marker.addListener('click', () => {
            infoWindow.open(mapInstanceRef.current, marker);
          });
          
          markersRef.current.push(marker);
        });
        
        // Haritayı tüm marker'ları gösterecek şekilde ayarla
        if (markersRef.current.length > 0) {
          const bounds = new window.google.maps.LatLngBounds();
          markersRef.current.forEach(marker => {
            bounds.extend(marker.getPosition());
          });
          mapInstanceRef.current.fitBounds(bounds);
        }
      } catch (error) {
        console.error('Teslimat lokasyonları yüklenirken hata oluştu:', error);
      } finally {
        setMapLoading(false);
      }
    };
    
    fetchLocations();
  }, [filters]);
  
  // Duruma göre marker icon'u döndür
  const getMarkerIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '/images/marker-green.png';
      case 'in_progress':
        return '/images/marker-blue.png';
      case 'cancelled':
        return '/images/marker-red.png';
      case 'delayed':
        return '/images/marker-yellow.png';
      default:
        return '/images/marker-gray.png';
    }
  };
  
  // Duruma göre durum metni döndür
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'cancelled':
        return 'İptal Edildi';
      case 'delayed':
        return 'Gecikme';
      default:
        return 'Bilinmiyor';
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">Teslimat Haritası</h3>
      {/* Harita yüklenirken loader göster */}
      {(loading || mapLoading) && (
        <div className="absolute inset-0 bg-white bg-opacity-70 z-10 flex items-center justify-center">
          <div className="text-gray-500">Harita yükleniyor...</div>
        </div>
      )}
      
      {/* Harita için placeholder */}
      <div 
        ref={mapRef}
        className="w-full h-[500px] bg-gray-100 relative rounded overflow-hidden"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500">
            Google Maps API anahtarı gerekiyor.
            <br />
            Gerçek bir uygulamada burada harita görünecek.
          </p>
        </div>
      </div>
      
      {/* Harita Açıklaması */}
      <div className="mt-4 flex flex-wrap gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
          <span className="text-sm">Tamamlandı ({locations.filter(l => l.status === 'completed').length})</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
          <span className="text-sm">Devam Ediyor ({locations.filter(l => l.status === 'in_progress').length})</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
          <span className="text-sm">İptal Edildi ({locations.filter(l => l.status === 'cancelled').length})</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
          <span className="text-sm">Gecikme ({locations.filter(l => l.status === 'delayed').length})</span>
        </div>
      </div>
    </div>
  );
} 