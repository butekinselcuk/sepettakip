'use client'

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet varsayılan simgeleri için düzeltme
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
  });
}

export interface MapMarker {
  id: string;
  position: [number, number];
  status: 'active' | 'idle' | 'offline';
  title: string;
  description?: string;
}

interface MapComponentProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (id: string) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({
  markers,
  center = [41.0082, 28.9784], // Istanbul center coordinates
  zoom = 12,
  onMarkerClick
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    // Initialize map if it doesn't exist
    if (!mapRef.current && mapContainerRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when they change
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    // Add new markers
    markers.forEach(marker => {
      const iconUrl = getMarkerIconByStatus(marker.status);
      
      const customIcon = L.icon({
        iconUrl,
        shadowUrl: '/leaflet/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      const markerInstance = L.marker(marker.position, { icon: customIcon })
        .addTo(markersLayerRef.current as L.LayerGroup);
      
      // Add popup with info
      markerInstance.bindPopup(`
        <div>
          <strong>${marker.title}</strong>
          ${marker.description ? `<p>${marker.description}</p>` : ''}
          <p>Status: ${marker.status}</p>
        </div>
      `);
      
      // Handle click events
      if (onMarkerClick) {
        markerInstance.on('click', () => {
          onMarkerClick(marker.id);
        });
      }
    });
  }, [markers, onMarkerClick]);

  // Update center and zoom when they change
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView(center, zoom);
  }, [center, zoom]);

  const getMarkerIconByStatus = (status: string): string => {
    switch (status) {
      case 'active':
        return '/leaflet/marker-icon-green.png';
      case 'idle':
        return '/leaflet/marker-icon-blue.png';
      case 'offline':
        return '/leaflet/marker-icon-red.png';
      default:
        return '/leaflet/marker-icon.png';
    }
  };

  return (
    <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '400px' }} />
  );
};

export default MapComponent; 