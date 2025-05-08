'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Next.js
const icon = L.icon({
  iconUrl: '/images/marker-icon.png',
  iconRetinaUrl: '/images/marker-icon-2x.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface DeliveryZone {
  id: string;
  name: string;
  coordinates: [number, number][];
  color: string;
}

interface CourierLocation {
  id: string;
  name: string;
  position: [number, number];
  status: 'active' | 'idle' | 'offline';
  currentDelivery?: {
    id: string;
    address: string;
  };
}

interface InteractiveMapProps {
  deliveryZones: DeliveryZone[];
  courierLocations: CourierLocation[];
  center?: [number, number];
  zoom?: number;
}

// Map controller component to handle map updates
function MapController({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, map]);

  return null;
}

export default function InteractiveMap({
  deliveryZones,
  courierLocations,
  center = [41.0082, 28.9784], // Istanbul coordinates
  zoom = 13
}: InteractiveMapProps) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>İnteraktif Teslimat Haritası</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[600px] w-full">
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* Delivery Zones */}
            {deliveryZones.map((zone) => (
              <Polygon
                key={zone.id}
                positions={zone.coordinates}
                pathOptions={{
                  color: zone.color,
                  fillColor: zone.color,
                  fillOpacity: selectedZone === zone.id ? 0.4 : 0.2
                }}
                eventHandlers={{
                  click: () => setSelectedZone(zone.id),
                  mouseover: () => setSelectedZone(zone.id),
                  mouseout: () => setSelectedZone(null)
                }}
              >
                <Popup>
                  <div>
                    <h3 className="font-bold">{zone.name}</h3>
                    <p>Aktif Teslimatlar: {courierLocations.filter(c => {
                      const polygon = L.polygon(zone.coordinates);
                      const point = L.latLng(c.position);
                      return c.status === 'active' && polygon.getBounds().contains(point);
                    }).length}</p>
                  </div>
                </Popup>
              </Polygon>
            ))}

            {/* Courier Locations */}
            {courierLocations.map((courier) => (
              <Marker
                key={courier.id}
                position={courier.position}
                icon={icon}
                eventHandlers={{
                  click: () => setSelectedCourier(courier.id)
                }}
              >
                <Popup>
                  <div>
                    <h3 className="font-bold">{courier.name}</h3>
                    <p>Durum: {
                      courier.status === 'active' ? 'Aktif' :
                      courier.status === 'idle' ? 'Beklemede' : 'Çevrimdışı'
                    }</p>
                    {courier.currentDelivery && (
                      <div className="mt-2">
                        <p className="font-semibold">Mevcut Teslimat:</p>
                        <p>{courier.currentDelivery.address}</p>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            <MapController center={center} zoom={zoom} />
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
} 