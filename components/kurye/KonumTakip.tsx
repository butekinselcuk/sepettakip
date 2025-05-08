'use client'

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { MapMarker } from './MapComponent';

// Dynamically import MapComponent because it uses browser APIs
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-64 bg-gray-100">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )
});

export interface KuryeKonum {
  id: string;
  name: string;
  position: [number, number];
  status: 'active' | 'idle' | 'offline';
  lastUpdate: string;
  currentDelivery?: {
    id: string;
    address: string;
    customer: string;
    estimatedArrival: string;
  };
}

export interface KonumTakipProps {
  zoneId?: string;
  refreshInterval?: number;
  onKuryeSelect?: (kurye: KuryeKonum | null) => void;
}

export default function KonumTakip({ 
  zoneId, 
  refreshInterval = 30000, 
  onKuryeSelect 
}: KonumTakipProps) {
  const [kuryeler, setKuryeler] = useState<KuryeKonum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKurye, setSelectedKurye] = useState<string | null>(null);

  // Fetch courier locations
  const fetchKuryeKonumlar = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/kurye/konumlar', window.location.origin);
      
      // Add zone filter if provided
      if (zoneId) {
        url.searchParams.append('zoneId', zoneId);
      }
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      setKuryeler(data);
      setError(null);
    } catch (err) {
      console.error('Kurye konumları alınamadı:', err);
      setError('Kurye konumları yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and refresh interval
  useEffect(() => {
    fetchKuryeKonumlar();
    
    // Set up refresh interval
    const intervalId = setInterval(fetchKuryeKonumlar, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [zoneId, refreshInterval]);

  // Handle marker click
  const handleMarkerClick = (id: string) => {
    const newSelected = id === selectedKurye ? null : id;
    setSelectedKurye(newSelected);
    
    // Call the parent callback with the selected courier
    if (onKuryeSelect) {
      const selectedKuryeData = newSelected ? kuryeler.find(k => k.id === newSelected) || null : null;
      onKuryeSelect(selectedKuryeData);
    }
  };

  // Convert courier data to map markers
  const mapMarkers: MapMarker[] = kuryeler.map(kurye => ({
    id: kurye.id,
    position: kurye.position,
    status: kurye.status,
    title: kurye.name,
    description: kurye.currentDelivery 
      ? `Teslimat: ${kurye.currentDelivery.address}`
      : 'Aktif teslimat yok'
  }));

  if (loading && kuryeler.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && kuryeler.length === 0) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <button 
          onClick={fetchKuryeKonumlar}
          className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
        >
          Yeniden Dene
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" style={{ minHeight: '500px' }}>
      {loading && (
        <div className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md z-10">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      <MapComponent 
        markers={mapMarkers}
        onMarkerClick={handleMarkerClick}
      />
      
      {kuryeler.length === 0 && !loading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded shadow-md">
          <p className="text-gray-700">Bu bölgede aktif kurye bulunmuyor.</p>
        </div>
      )}
    </div>
  );
} 