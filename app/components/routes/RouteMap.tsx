'use client'

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

// Ensure Leaflet icons work properly - moved to inside component for safety
// Leaflet is dynamically imported to avoid window is not defined error

// Interface for delivery point in route
export interface RouteDeliveryPoint {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  sequenceNumber: number;
  status: string;
  customerName: string;
  estimatedArrival?: string;
}

// Interface for route data
export interface RouteData {
  courierId: string;
  courierName: string;
  deliveryPoints: RouteDeliveryPoint[];
  totalDistance: number;
  totalDuration: number;
  lastUpdated?: string;
}

interface RouteMapProps {
  route?: RouteData;
  courierPosition?: {
    latitude: number;
    longitude: number;
  };
  loading?: boolean;
  onDeliveryPointClick?: (pointId: string) => void;
  className?: string;
  shouldRecenter?: boolean;
  onRecentered?: () => void;
}

// Create a map component that only loads on the client side
const RouteMapComponent: React.FC<RouteMapProps> = ({ 
  route, 
  courierPosition, 
  loading = false,
  onDeliveryPointClick,
  className = '',
  shouldRecenter = false,
  onRecentered
}) => {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const routeLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const courierMarkerRef = useRef<any>(null);
  const router = useRouter();
  
  const [isMapReady, setIsMapReady] = useState(false);
  const [L, setL] = useState<any>(null);

  // Load Leaflet dynamically
  useEffect(() => {
    async function loadLeaflet() {
      try {
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');
        
        // Configure Leaflet icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '/leaflet/marker-icon-2x.png',
          iconUrl: '/leaflet/marker-icon.png',
          shadowUrl: '/leaflet/marker-shadow.png',
        });
        
        setL(L);
      } catch (error) {
        console.error('Error loading Leaflet:', error);
      }
    }
    
    loadLeaflet();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!L || !mapContainerRef.current || mapRef.current) return;

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      center: [41.0082, 28.9784], // Istanbul coordinates
      zoom: 13,
      zoomControl: false
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add zoom control to the top-right corner
    L.control.zoom({
      position: 'topright'
    }).addTo(map);

    // Create layers for routes and markers
    routeLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    // Store map instance in ref
    mapRef.current = map;
    setIsMapReady(true);

    // Cleanup on unmount
    return () => {
      map.remove();
      mapRef.current = null;
      routeLayerRef.current = null;
      markersLayerRef.current = null;
    };
  }, [L]);

  // Update route on the map
  useEffect(() => {
    if (!L || !isMapReady || !mapRef.current || !routeLayerRef.current || !markersLayerRef.current) return;

    // Clear previous route
    routeLayerRef.current.clearLayers();
    markersLayerRef.current.clearLayers();

    if (!route || route.deliveryPoints.length === 0) return;

    // Sort delivery points by sequence number
    const sortedPoints = [...route.deliveryPoints].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    // Extract coordinates for polyline
    const polylinePoints = sortedPoints.map((point) => [point.latitude, point.longitude]);

    // Create polyline
    const routeLine = L.polyline(polylinePoints as [number, number][], {
      color: '#3B82F6',
      weight: 5,
      opacity: 0.7,
      lineJoin: 'round'
    }).addTo(routeLayerRef.current);

    // Add markers for each delivery point
    sortedPoints.forEach((point, index) => {
      let iconHtml = '';
      let iconClass = '';

      // Different icons based on point type/status
      if (point.status === 'PICKUP') {
        iconHtml = `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white font-bold border-2 border-white">${point.sequenceNumber}</div>`;
        iconClass = 'pickup-marker';
      } else if (point.status === 'CURRENT') {
        iconHtml = `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white font-bold border-2 border-white">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>`;
        iconClass = 'current-marker';
      } else if (point.status === 'DELIVERED') {
        iconHtml = `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-500 text-white font-bold border-2 border-white">${point.sequenceNumber}</div>`;
        iconClass = 'delivered-marker';
      } else {
        iconHtml = `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white font-bold border-2 border-white">${point.sequenceNumber}</div>`;
        iconClass = 'pending-marker';
      }

      const icon = L.divIcon({
        html: iconHtml,
        className: `custom-div-icon ${iconClass}`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([point.latitude, point.longitude], { icon }).addTo(markersLayerRef.current);

      // Add popup with delivery info
      marker.bindPopup(`
        <div class="p-2">
          <p class="font-bold">${point.customerName}</p>
          <p>${point.address}</p>
          ${point.estimatedArrival ? `<p>Tahmini Varış: ${point.estimatedArrival}</p>` : ''}
          <p>Sıra: ${point.sequenceNumber}</p>
        </div>
      `);

      // Add click handler
      if (onDeliveryPointClick) {
        marker.on('click', () => onDeliveryPointClick(point.id));
      }
    });

    // Fit map to route bounds
    if (polylinePoints.length > 0) {
      mapRef.current.fitBounds(polylinePoints as [number, number][]);
    }
  }, [L, isMapReady, route, onDeliveryPointClick]);

  // Update the courier's position on the map
  useEffect(() => {
    if (!L || !courierPosition || !mapRef.current || !markersLayerRef.current) return;

    // Remove previous courier marker if it exists
    if (courierMarkerRef.current) {
      markersLayerRef.current.removeLayer(courierMarkerRef.current);
      courierMarkerRef.current = null;
    }

    // Add new marker at the courier's position
    const courierIcon = L.divIcon({
      html: `<div class="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white border-2 border-white shadow-lg animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>`,
      className: 'courier-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    courierMarkerRef.current = L.marker(
      [courierPosition.latitude, courierPosition.longitude], 
      { icon: courierIcon, zIndexOffset: 1000 }
    ).addTo(markersLayerRef.current);

    // Center map on courier position if requested
    if (shouldRecenter && onRecentered) {
      mapRef.current.setView([courierPosition.latitude, courierPosition.longitude], 15);
      onRecentered();
    }
  }, [L, courierPosition, shouldRecenter, onRecentered, isMapReady]);

  if (loading) {
    return (
      <div className={`bg-gray-100 rounded-lg overflow-hidden relative ${className}`} style={{ minHeight: "400px" }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainerRef} 
      className={`rounded-lg overflow-hidden ${className}`} 
      style={{ height: '100%', minHeight: "400px" }}
    />
  );
};

// Dynamically load the component without SSR
const RouteMap = dynamic(() => Promise.resolve(RouteMapComponent), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 rounded-lg overflow-hidden relative" style={{ minHeight: "400px" }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    </div>
  ),
});

export default RouteMap;