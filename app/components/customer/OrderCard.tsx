import React from 'react';
import Image from "next/image";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  MapPin,
  Calendar,
  Clock,
  Package,
  ArrowRight,
  CheckCircle,
  XCircle,
  Truck,
  Info
} from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  status: string;
  totalPrice: number;
  address: string;
  notes: string | null;
  items: OrderItem[];
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  createdAt: string;
  updatedAt: string;
  business: {
    id: string;
    name: string;
    logoUrl?: string;
    address: string;
  };
  courier?: {
    id: string;
    user: {
      name: string;
      email: string;
    };
    phone: string;
  };
}

interface OrderCardProps {
  order: Order;
  onClick: (orderId: string) => void;
  isPastOrder?: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onClick, isPastOrder = false }) => {
  
  // Durum etiketi ve renkleri
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          label: "Beklemede",
          color: "yellow",
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-800",
          icon: <Info className="h-5 w-5 text-yellow-500" />
        };
      case "PROCESSING":
      case "PREPARING":
        return {
          label: "Hazırlanıyor",
          color: "blue",
          bgColor: "bg-blue-100",
          textColor: "text-blue-800",
          icon: <Package className="h-5 w-5 text-blue-500" />
        };
      case "READY":
        return {
          label: "Hazır",
          color: "purple",
          bgColor: "bg-purple-100",
          textColor: "text-purple-800",
          icon: <CheckCircle className="h-5 w-5 text-purple-500" />
        };
      case "IN_TRANSIT":
        return {
          label: "Yolda",
          color: "indigo",
          bgColor: "bg-indigo-100",
          textColor: "text-indigo-800",
          icon: <Truck className="h-5 w-5 text-indigo-500" />
        };
      case "DELIVERED":
        return {
          label: "Teslim Edildi",
          color: "green",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          icon: <CheckCircle className="h-5 w-5 text-green-500" />
        };
      case "CANCELLED":
        return {
          label: "İptal Edildi",
          color: "red",
          bgColor: "bg-red-100",
          textColor: "text-red-800",
          icon: <XCircle className="h-5 w-5 text-red-500" />
        };
      default:
        return {
          label: status,
          color: "gray",
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
          icon: <Info className="h-5 w-5 text-gray-500" />
        };
    }
  };

  // Sipariş içeriği özetini göster
  const getOrderSummary = (items: OrderItem[]) => {
    if (items.length === 0) return "";
    
    if (items.length === 1) {
      return `${items[0].quantity}x ${items[0].name}`;
    }
    
    const firstItem = `${items[0].quantity}x ${items[0].name}`;
    const otherCount = items.length - 1;
    
    return `${firstItem} ve ${otherCount} diğer ürün`;
  };

  // Tarih/saat formatla
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    
    return format(new Date(dateString), "dd MMMM yyyy, HH:mm", { locale: tr });
  };

  // Para birimi formatla
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount);
  };
  
  return (
    <div 
      className="bg-white shadow rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick(order.id)}
    >
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
            {order.business.logoUrl && (
              <div className="flex-shrink-0 h-12 w-12 mr-4">
                <Image
                  src={order.business.logoUrl}
                  alt={order.business.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              </div>
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-900">{order.business.name}</h3>
              <p className="text-sm text-gray-500">Sipariş #{order.id.substring(0, 8)}</p>
            </div>
          </div>
          <div className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusInfo(order.status).bgColor} ${getStatusInfo(order.status).textColor}`}>
            {getStatusInfo(order.status).label}
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-2 sm:mb-0">
              <p className="text-sm font-medium text-gray-900">{getOrderSummary(order.items)}</p>
              <p className="mt-1 text-sm text-gray-500">
                <span className="font-medium">{formatCurrency(order.totalPrice)}</span>
              </p>
            </div>
            
            <div className="flex items-center text-sm text-gray-500">
              {isPastOrder ? (
                // Geçmiş siparişler için teslim veya iptal tarihi
                order.status === "DELIVERED" && order.actualDelivery ? (
                  <div className="flex items-center mr-4">
                    <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                    <span>
                      Teslim: {format(new Date(order.actualDelivery), "dd MMM, HH:mm", { locale: tr })}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center mr-4">
                    <XCircle className="mr-1 h-4 w-4 text-red-500" />
                    <span>
                      İptal: {format(new Date(order.updatedAt), "dd MMM, HH:mm", { locale: tr })}
                    </span>
                  </div>
                )
              ) : (
                // Aktif siparişler için tahmini teslimat
                order.estimatedDelivery && (
                  <div className="flex items-center mr-4">
                    <Clock className="mr-1 h-4 w-4 text-gray-400" />
                    <span>
                      Tahmini: {format(new Date(order.estimatedDelivery), "HH:mm", { locale: tr })}
                    </span>
                  </div>
                )
              )}
              
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4 text-gray-400" />
                <span>
                  {format(new Date(order.createdAt), "dd MMM", { locale: tr })}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <MapPin className="mr-1 h-4 w-4 text-gray-400" />
            <span className="truncate">{order.address}</span>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <div className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Detaylar
            <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard; 