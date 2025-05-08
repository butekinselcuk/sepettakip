'use client'

import React from 'react';
import { X, MapPin, Clock, Phone, Info, Package, Navigation } from 'lucide-react';

export interface DeliveryDetailData {
  id: string;
  customerName: string;
  customerPhone?: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
  estimatedArrival?: string;
  orderItems?: Array<{
    id: string;
    name: string;
    quantity: number;
    price?: number;
  }>;
  notes?: string;
  sequenceNumber: number;
}

interface DeliveryDetailsProps {
  delivery: DeliveryDetailData | null;
  onClose: () => void;
  onNavigate?: (lat: number, lng: number) => void;
  onStatusChange?: (id: string, status: string) => void;
  isOpen: boolean;
  className?: string;
}

const DeliveryDetails: React.FC<DeliveryDetailsProps> = ({
  delivery,
  onClose,
  onNavigate,
  onStatusChange,
  isOpen,
  className = '',
}) => {
  if (!isOpen || !delivery) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PROCESSING':
      case 'PREPARING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'READY':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleNavigate = () => {
    if (onNavigate && delivery.latitude && delivery.longitude) {
      onNavigate(delivery.latitude, delivery.longitude);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(delivery.id, newStatus);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return '';
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY' 
    }).format(amount);
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Teslimat Detayları</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-grow overflow-auto p-4">
          {/* Status Badge */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <div className={`text-sm px-3 py-1 rounded-full border ${getStatusColor(delivery.status)}`}>
                {delivery.status}
              </div>
              {delivery.sequenceNumber && (
                <div className="ml-2 bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-medium">
                  {delivery.sequenceNumber}
                </div>
              )}
            </div>
            
            <button 
              onClick={handleNavigate}
              className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm flex items-center hover:bg-blue-100"
            >
              <Navigation size={16} className="mr-1" />
              Yol Tarifi
            </button>
          </div>
          
          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <h4 className="font-medium text-gray-800 mb-2">{delivery.customerName}</h4>
            
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin size={16} className="mr-2 flex-shrink-0" />
              <span>{delivery.address}</span>
            </div>
            
            {delivery.customerPhone && (
              <div className="flex items-center text-gray-600 mb-2">
                <Phone size={16} className="mr-2 flex-shrink-0" />
                <a 
                  href={`tel:${delivery.customerPhone}`}
                  className="text-blue-600 hover:underline"
                >
                  {delivery.customerPhone}
                </a>
              </div>
            )}
            
            {delivery.estimatedArrival && (
              <div className="flex items-center text-gray-600">
                <Clock size={16} className="mr-2 flex-shrink-0" />
                <span>Tahmini Varış: {delivery.estimatedArrival}</span>
              </div>
            )}
          </div>
          
          {/* Order Items */}
          {delivery.orderItems && delivery.orderItems.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                <Package size={16} className="mr-2" />
                Sipariş İçeriği
              </h4>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ürün
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Adet
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fiyat
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {delivery.orderItems.map(item => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 text-right">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 text-right">
                          {formatCurrency(item.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Notes */}
          {delivery.notes && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                <Info size={16} className="mr-2" />
                Notlar
              </h4>
              <div className="bg-yellow-50 rounded-lg p-3 text-sm text-gray-800">
                {delivery.notes}
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="p-4 border-t bg-gray-50">
          <div className="grid grid-cols-2 gap-3">
            {delivery.status !== 'DELIVERED' && (
              <button
                onClick={() => handleStatusChange('DELIVERED')}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium"
              >
                Teslim Edildi
              </button>
            )}
            
            {delivery.status !== 'IN_TRANSIT' && delivery.status !== 'DELIVERED' && (
              <button
                onClick={() => handleStatusChange('IN_TRANSIT')}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium"
              >
                Yolda
              </button>
            )}
            
            {delivery.status !== 'CANCELLED' && (
              <button
                onClick={() => handleStatusChange('CANCELLED')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md text-sm font-medium"
              >
                İptal Et
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetails; 