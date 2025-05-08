'use client'

import React from 'react';
import { RouteData, RouteDeliveryPoint } from './RouteMap';

interface DeliverySequencePanelProps {
  route?: RouteData;
  loading?: boolean;
  onDeliveryClick?: (pointId: string) => void;
  className?: string;
}

const DeliverySequencePanel: React.FC<DeliverySequencePanelProps> = ({
  route,
  loading = false,
  onDeliveryClick,
  className = '',
}) => {
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
        <h3 className="text-lg font-semibold mb-4">Teslimat Sırası</h3>
        <div className="flex justify-center my-6">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(index => (
            <div key={index} className="bg-gray-100 p-3 rounded-md animate-pulse h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!route || !route.deliveryPoints || route.deliveryPoints.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
        <h3 className="text-lg font-semibold mb-4">Teslimat Sırası</h3>
        <p className="text-gray-500 py-4 text-center">Henüz teslimat bilgisi yok.</p>
      </div>
    );
  }

  // Sort deliveries by sequence number
  const sortedDeliveries = [...route.deliveryPoints].sort((a, b) => 
    (a.sequenceNumber || 0) - (b.sequenceNumber || 0)
  );

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Teslimat Sırası</h3>
        <div className="text-sm text-gray-500">
          {route.lastUpdated && `Son Güncelleme: ${route.lastUpdated}`}
        </div>
      </div>
      
      {/* Route Summary */}
      <div className="bg-blue-50 p-3 rounded-md mb-4 text-sm">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="font-medium">Teslimat</div>
            <div className="text-blue-700 font-bold">{sortedDeliveries.length}</div>
          </div>
          <div className="text-center">
            <div className="font-medium">Mesafe</div>
            <div className="text-blue-700 font-bold">{route.totalDistance.toFixed(1)} km</div>
          </div>
          <div className="text-center">
            <div className="font-medium">Süre</div>
            <div className="text-blue-700 font-bold">
              {Math.floor(route.totalDuration / 60)}s {route.totalDuration % 60}d
            </div>
          </div>
        </div>
      </div>
      
      {/* Delivery List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {sortedDeliveries.map((delivery, index) => (
          <DeliveryItem 
            key={delivery.id} 
            delivery={delivery} 
            index={index} 
            onClick={() => onDeliveryClick && onDeliveryClick(delivery.id)}
            isLast={index === sortedDeliveries.length - 1}
            nextDelivery={index < sortedDeliveries.length - 1 ? sortedDeliveries[index + 1] : undefined}
          />
        ))}
      </div>
    </div>
  );
};

interface DeliveryItemProps {
  delivery: RouteDeliveryPoint;
  index: number;
  onClick: () => void;
  isLast: boolean;
  nextDelivery?: RouteDeliveryPoint;
}

const DeliveryItem: React.FC<DeliveryItemProps> = ({ 
  delivery, 
  index, 
  onClick, 
  isLast,
  nextDelivery
}) => {
  // Get delivery status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-500';
      case 'IN_TRANSIT':
        return 'bg-blue-500';
      case 'PROCESSING':
      case 'PREPARING':
        return 'bg-yellow-500';
      case 'CANCELLED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Calculate distance to next point if available
  const distanceToNext = nextDelivery ? 
    calculateDistance(
      delivery.latitude, 
      delivery.longitude, 
      nextDelivery.latitude, 
      nextDelivery.longitude
    ) : null;

  return (
    <div 
      className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Sequence Number */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
          {index + 1}
        </div>
        
        {/* Delivery Info */}
        <div className="flex-grow">
          <div className="font-medium">{delivery.customerName || 'Müşteri'}</div>
          <div className="text-sm text-gray-600 mb-1">{delivery.address}</div>
          
          <div className="flex justify-between text-xs">
            <div>
              {delivery.estimatedArrival && (
                <span className="text-gray-500">
                  Tahmini Varış: {delivery.estimatedArrival}
                </span>
              )}
            </div>
            {delivery.status && (
              <div className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-1 ${getStatusColor(delivery.status)}`}></span>
                <span>{delivery.status}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Show distance to next point if not the last one */}
      {!isLast && distanceToNext && (
        <div className="mt-2 pt-2 border-t border-dashed border-gray-200 flex justify-center text-xs text-gray-500">
          <span>Sonraki Durak: {distanceToNext.toFixed(1)} km</span>
        </div>
      )}
    </div>
  );
};

// Helper function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in km
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

export default DeliverySequencePanel; 