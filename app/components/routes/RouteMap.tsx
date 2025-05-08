'use client'

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/navigation';

// Ensure Leaflet icons work properly
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
  });
}

// Define interfaces for route data
export interface RouteDeliveryPoint {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  sequenceNumber: number;
  estimatedArrival?: string;
  status?: string;
  customerName?: string;
}

export interface RouteData {
  courierId: string;
  courierName?: string;
  deliveryPoints: RouteDeliveryPoint[];
  totalDistance: number;
  totalDuration: number;
  lastUpdated?: string;
}

interface RouteMapProps {
  route?: RouteData;
  courierPosition?: { latitude: number; longitude: number };
  loading?: boolean;
  onDeliveryPointClick?: (pointId: string) => void;
  className?: string;
}

const RouteMap: React.FC<RouteMapProps> = ({
  route,
  courierPosition,
  loading = false,
  onDeliveryPointClick,
  className = '',
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const courierMarkerRef = useRef<L.Marker | null>(null);
  const router = useRouter();
  
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize the map
  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      // Default to Istanbul center if no route is provided
      const defaultCenter: [number, number] = [41.0082, 28.9784];
      
      mapRef.current = L.map(mapContainerRef.current).setView(defaultCenter, 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      // Create layers for routes and markers
      routeLayerRef.current = L.layerGroup().addTo(mapRef.current);
      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);

      // Add controls
      L.control.zoom({
        position: 'bottomright'
      }).addTo(mapRef.current);

      setIsMapReady(true);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setIsMapReady(false);
      }
    };
  }, []);

  // Draw route and delivery points when route data changes
  useEffect(() => {
    if (!isMapReady || !mapRef.current || !routeLayerRef.current || !markersLayerRef.current) return;
    
    // Clear existing route and markers
    routeLayerRef.current.clearLayers();
    markersLayerRef.current.clearLayers();

    if (!route || !route.deliveryPoints || route.deliveryPoints.length === 0) {
      // If no route, center on Istanbul
      mapRef.current.setView([41.0082, 28.9784], 12);
      return;
    }

    // Sort delivery points by sequence number
    const sortedPoints = [...route.deliveryPoints].sort((a, b) => 
      (a.sequenceNumber || 0) - (b.sequenceNumber || 0)
    );

    // Extract coordinates for the polyline
    const routeCoordinates = sortedPoints.map(point => 
      [point.latitude, point.longitude] as [number, number]
    );

    // Draw the route polyline
    const routeLine = L.polyline(routeCoordinates, {
      color: '#3B82F6', // Blue color
      weight: 4,
      opacity: 0.7,
      lineJoin: 'round'
    }).addTo(routeLayerRef.current);

    // Add markers for each delivery point
    sortedPoints.forEach((point, index) => {
      // Create custom icon with sequence number
      const deliveryIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #3B82F6; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; font-weight: bold; border: 2px solid white;">${index + 1}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      // Create marker
      const marker = L.marker([point.latitude, point.longitude], { 
        icon: deliveryIcon,
        title: point.address
      }).addTo(markersLayerRef.current as L.LayerGroup);

      // Add popup with delivery info
      marker.bindPopup(`
        <div class="p-2">
          <p class="font-bold">${point.customerName || 'Müşteri'}</p>
          <p>${point.address}</p>
          <p>Sıra: ${index + 1}</p>
          ${point.estimatedArrival ? `<p>Tahmini Varış: ${point.estimatedArrival}</p>` : ''}
          ${point.status ? `<p>Durum: ${point.status}</p>` : ''}
        </div>
      `);

      // Handle click event
      if (onDeliveryPointClick) {
        marker.on('click', () => {
          onDeliveryPointClick(point.id);
        });
      }
    });

    // Fit map to show all points
    if (routeCoordinates.length > 0) {
      mapRef.current.fitBounds(routeCoordinates);
    }
  }, [isMapReady, route, onDeliveryPointClick]);

  // Update courier position when it changes
  useEffect(() => {
    if (!isMapReady || !mapRef.current || !markersLayerRef.current) return;

    // Remove existing courier marker
    if (courierMarkerRef.current) {
      courierMarkerRef.current.remove();
      courierMarkerRef.current = null;
    }

    // Add new courier marker if position is available
    if (courierPosition && courierPosition.latitude && courierPosition.longitude) {
      // Create custom icon for courier
      const courierIcon = L.icon({
        iconUrl: '/leaflet/marker-icon-green.png',
        shadowUrl: '/leaflet/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      // Create marker and add to map
      courierMarkerRef.current = L.marker(
        [courierPosition.latitude, courierPosition.longitude], 
        { icon: courierIcon }
      ).addTo(mapRef.current);

      // Add popup
      courierMarkerRef.current.bindPopup(`
        <div class="p-2">
          <p class="font-bold">Kurye Konumu</p>
          <p>Şu anki konum</p>
        </div>
      `);
    }
  }, [isMapReady, courierPosition]);

  return (
    <div className={`relative rounded-lg overflow-hidden border border-gray-200 shadow-md ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 z-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full min-h-[400px]" />
      <div className="absolute top-4 left-4 z-10 bg-white p-2 rounded-md shadow-md text-sm">
        {route ? (
          <div>
            <p><strong>Toplam Mesafe:</strong> {route.totalDistance.toFixed(1)} km</p>
            <p><strong>Tahmini Süre:</strong> {Math.floor(route.totalDuration / 60)}s {route.totalDuration % 60}d</p>
            <p><strong>Teslimat Sayısı:</strong> {route.deliveryPoints.length}</p>
            {route.lastUpdated && (
              <p className="text-xs text-gray-500 mt-1">
                Son Güncelleme: {route.lastUpdated}
              </p>
            )}
          </div>
        ) : (
          <p>Rota bilgisi yükleniyor...</p>
        )}
      </div>
    </div>
  );
};

export default RouteMap; 