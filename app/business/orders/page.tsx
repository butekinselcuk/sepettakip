"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import BusinessLayout from "@/app/components/layouts/BusinessLayout";
import { 
  Package, Clock, Calendar, ArrowUpDown, Search, 
  RefreshCw, Filter, CheckCircle, AlertTriangle, XCircle, 
  Truck, Receipt, MoreVertical, MapPin, User, Phone,
  Map as MapIcon, Settings
} from "lucide-react";
import RouteMap from "@/app/components/routes/RouteMap";
import Header from '@/app/components/common/Header';
import Link from 'next/link';

// Order status types
type OrderStatus = 
  | "PENDING" 
  | "PROCESSING" 
  | "PREPARING" 
  | "READY" 
  | "IN_TRANSIT" 
  | "DELIVERED" 
  | "CANCELED";

// Order item interface
interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

// Kurye tipi
interface Courier {
  id: string;
  name: string;
  phone: string;
  latitude?: number;
  longitude?: number;
  currentLatitude?: number;
  currentLongitude?: number;
}

// Order interface
interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  items: OrderItem[];
  totalPrice: number;
  notes: string;
  address: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  courier?: Courier;
}

// Pagination interface
interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// API'den gelecek rota veri tipi
interface RouteDataCourier {
  id: string;
  name: string;
  phone?: string;
  currentLatitude?: number;
  currentLongitude?: number;
}

// RouteMap bileşeninden gelen arayüzler
interface RouteDeliveryPoint {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  sequenceNumber: number;
  status: string;
  customerName: string;
  estimatedArrival?: string;
}

// Import edilmemiş RouteData tipini bizim oluşturduğumuz yapıya göre adapte ediyoruz
interface RouteMapData {
  courierId: string;
  courierName: string;
  deliveryPoints: RouteDeliveryPoint[];
  totalDistance: number;
  totalDuration: number;
  lastUpdated?: string;
}

export default function BusinessOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showRouteView, setShowRouteView] = useState(false);
  const [selectedOrderRoute, setSelectedOrderRoute] = useState<RouteMapData | undefined>(undefined);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const router = useRouter();

  // Siparişleri getir
  const fetchOrders = async (page = 1, status = selectedStatus) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth/login");
        return;
      }

      // URL parametrelerini oluştur
      let url = `/api/business/orders?page=${page}&limit=${pagination.limit}`;
      
      // Durum filtresi
      if (status !== "all") {
        url += `&status=${status}`;
      }
      
      // API çağrısı
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
      } else {
        setError("Siparişler yüklenirken bir hata oluştu.");
      }
    } catch (error) {
      console.error("Siparişler yüklenirken hata:", error);
      setError("Veriler yüklenemedi. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  // Component yüklendiğinde siparişleri getir
  useEffect(() => {
    fetchOrders();
  }, []);

  // Durum değiştiğinde siparişleri getir
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    fetchOrders(1, status);
  };

  // Sipariş durumunu güncelle
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await axios.put(
        `/api/business/orders`, 
        { 
          orderId,
          status: newStatus
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {
        // Başarılı yanıt durumunda yerel veriyi güncelle
        fetchOrders(pagination.page, selectedStatus);
        
        // Detay ekranı açıksa, seçili siparişi güncelle
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({
            ...selectedOrder,
            status: newStatus,
            updatedAt: new Date().toISOString()
          });
        }
      } else {
        setError("Sipariş durumu güncellenirken bir hata oluştu.");
      }
    } catch (error) {
      console.error("Sipariş durumu güncellenirken hata:", error);
      setError("İşlem gerçekleştirilemedi. Lütfen daha sonra tekrar deneyin.");
    }
  };

  // Sipariş detaylarını göster
  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
    
    // Eğer kuryesi atanmışsa, rotasını yükle
    if (order.courier) {
      fetchOrderRoute(order.id);
    }
  };

  // Sipariş rotasını yükle
  const fetchOrderRoute = async (orderId: string) => {
    try {
      setIsLoadingRoute(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth/login");
        return;
      }

      // API çağrısı
      const response = await axios.get(`/api/route-optimization?orderId=${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200 && response.data.route) {
        // API'den gelen veriyi RouteMap'in beklediği formata dönüştür
        const routeData: RouteMapData = {
          courierId: response.data.route.courier?.id || '',
          courierName: response.data.route.courier?.name || '',
          deliveryPoints: response.data.route.deliveryPoints || [],
          totalDistance: response.data.route.totalDistance || 0,
          totalDuration: response.data.route.totalDuration || 0,
          lastUpdated: new Date().toISOString()
        };
        setSelectedOrderRoute(routeData);
      } else {
        console.error("Rota bilgisi alınamadı");
        setSelectedOrderRoute(undefined);
        setError("Teslimat rotası alınamadı. Lütfen tekrar deneyin.");
      }
    } catch (error) {
      console.error("Rota yüklenirken hata:", error);
      setSelectedOrderRoute(undefined);
      setError("Rota bilgisi alınamadı. Kurye bilgileri eksik olabilir veya bir sunucu hatası oluşmuş olabilir.");
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Harita görünümünü aç
  const handleViewRoute = () => {
    if (!selectedOrder) return;
    
    // Eğer rota yüklenmemişse, yükle
    if (!selectedOrderRoute && selectedOrder.courier) {
      fetchOrderRoute(selectedOrder.id);
    }
    
    // Harita görünümünü aç
    setShowRouteView(true);
  };

  // Harita görünümünü kapat
  const handleCloseRouteView = () => {
    setShowRouteView(false);
  };

  // Sipariş detay modal'ını kapat
  const closeOrderDetail = () => {
    setShowOrderDetail(false);
    setSelectedOrder(null);
    setSelectedOrderRoute(undefined);
  };

  // Tarih formatla
  const formatDate = (dateString: string) => {
    if (!dateString) return "--";
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric" 
    });
  };

  // Saat formatla
  const formatTime = (dateString: string) => {
    if (!dateString) return "--";
    const date = new Date(dateString);
    return date.toLocaleTimeString("tr-TR", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  // Para birimi formatla
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount);
  };

  // Durum badge'i görüntüle
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Beklemede
          </span>
        );
      case "PROCESSING":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            İşleniyor
          </span>
        );
      case "PREPARING":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
            Hazırlanıyor
          </span>
        );
      case "READY":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
            Hazır
          </span>
        );
      case "IN_TRANSIT":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800">
            Yolda
          </span>
        );
      case "DELIVERED":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Teslim Edildi
          </span>
        );
      case "CANCELED":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            İptal Edildi
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  // Sipariş detay modalı
  const OrderDetailModal = () => {
    if (!selectedOrder) return null;

    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Sipariş #{selectedOrder.orderNumber}
            </h3>
            <div className="flex items-center space-x-4">
              {selectedOrder.courier && (
                <button
                  onClick={handleViewRoute}
                  className="flex items-center space-x-2 py-2 px-4 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  <MapIcon size={18} />
                  <span>Rotayı Görüntüle</span>
                </button>
              )}
              <button
                onClick={closeOrderDetail}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={24} />
              </button>
            </div>
          </div>

          {/* Content with scrolling */}
          <div className="p-4 overflow-y-auto flex-grow">
            {/* Status Info */}
            <div className="flex flex-wrap items-center justify-between mb-6 p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium text-gray-500">Durum:</span>
                <span className="ml-2">{getStatusBadge(selectedOrder.status)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500">Tarih:</span>
                <span className="ml-2">{formatDate(selectedOrder.createdAt)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500">Saat:</span>
                <span className="ml-2">{formatTime(selectedOrder.createdAt)}</span>
              </div>
            </div>

            {/* Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-lg mb-3 flex items-center">
                    <User size={18} className="mr-2" />
                    Müşteri Bilgileri
                  </h4>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium text-gray-500">İsim:</span>{" "}
                      {selectedOrder.customer.name}
                    </p>
                    <p>
                      <span className="font-medium text-gray-500">Telefon:</span>{" "}
                      {selectedOrder.customer.phone}
                    </p>
                    <p>
                      <span className="font-medium text-gray-500">E-posta:</span>{" "}
                      {selectedOrder.customer.email}
                    </p>
                  </div>
                </div>

                {/* Address Info */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-lg mb-3 flex items-center">
                    <MapPin size={18} className="mr-2" />
                    Teslimat Adresi
                  </h4>
                  <p className="whitespace-pre-wrap">{selectedOrder.address}</p>
                </div>

                {/* Courier Info if assigned */}
                {selectedOrder.courier && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-lg mb-3 flex items-center">
                      <Truck size={18} className="mr-2" />
                      Kurye Bilgileri
                    </h4>
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium text-gray-500">İsim:</span>{" "}
                        {selectedOrder.courier.name}
                      </p>
                      <p>
                        <span className="font-medium text-gray-500">Telefon:</span>{" "}
                        {selectedOrder.courier.phone}
                      </p>
                      {selectedOrderRoute && (
                        <div className="mt-3">
                          <p className="font-medium text-gray-500">Teslimat Tahmini:</p>
                          <div className="flex space-x-3 mt-1">
                            <span className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                              <Clock size={14} className="mr-1" /> 
                              {Math.floor(selectedOrderRoute.totalDuration / 60)}s {selectedOrderRoute.totalDuration % 60}d
                            </span>
                            <span className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                              <MapPin size={14} className="mr-1" /> 
                              {selectedOrderRoute.totalDistance.toFixed(1)} km
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Order Items */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-lg mb-3 flex items-center">
                    <Package size={18} className="mr-2" />
                    Sipariş İçeriği
                  </h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center border-b pb-2 last:border-0"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.quantity} adet x {formatCurrency(item.price)}
                          </p>
                          {item.notes && (
                            <p className="text-sm italic text-gray-500">
                              Not: {item.notes}
                            </p>
                          )}
                        </div>
                        <div className="font-medium">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t flex justify-between items-center">
                    <span className="font-semibold">Toplam Tutar:</span>
                    <span className="font-bold text-xl text-green-600">
                      {formatCurrency(selectedOrder.totalPrice)}
                    </span>
                  </div>
                </div>

                {/* Notes if any */}
                {selectedOrder.notes && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-lg mb-3">Sipariş Notları</h4>
                    <p className="whitespace-pre-wrap">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Status Update Buttons */}
                {!["DELIVERED", "CANCELED"].includes(selectedOrder.status) && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-lg">Durum Güncelle</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedOrder.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => updateOrderStatus(selectedOrder.id, "PROCESSING")}
                            className="py-2 px-3 rounded-md bg-blue-500 text-white text-sm hover:bg-blue-600"
                          >
                            Hazırlanıyor
                          </button>
                          <button
                            onClick={() => updateOrderStatus(selectedOrder.id, "CANCELED")}
                            className="py-2 px-3 rounded-md bg-red-500 text-white text-sm hover:bg-red-600"
                          >
                            İptal Et
                          </button>
                        </>
                      )}
                      {selectedOrder.status === "PROCESSING" && (
                        <>
                          <button
                            onClick={() => updateOrderStatus(selectedOrder.id, "PREPARING")}
                            className="py-2 px-3 rounded-md bg-yellow-500 text-white text-sm hover:bg-yellow-600"
                          >
                            Hazırlanıyor
                          </button>
                          <button
                            onClick={() => updateOrderStatus(selectedOrder.id, "CANCELED")}
                            className="py-2 px-3 rounded-md bg-red-500 text-white text-sm hover:bg-red-600"
                          >
                            İptal Et
                          </button>
                        </>
                      )}
                      {selectedOrder.status === "PREPARING" && (
                        <>
                          <button
                            onClick={() => updateOrderStatus(selectedOrder.id, "READY")}
                            className="py-2 px-3 rounded-md bg-emerald-500 text-white text-sm hover:bg-emerald-600"
                          >
                            Hazır
                          </button>
                          <button
                            onClick={() => updateOrderStatus(selectedOrder.id, "CANCELED")}
                            className="py-2 px-3 rounded-md bg-red-500 text-white text-sm hover:bg-red-600"
                          >
                            İptal Et
                          </button>
                        </>
                      )}
                      {selectedOrder.status === "READY" && selectedOrder.courier && (
                        <button
                          onClick={() => updateOrderStatus(selectedOrder.id, "IN_TRANSIT")}
                          className="py-2 px-3 rounded-md bg-blue-500 text-white text-sm hover:bg-blue-600 col-span-2"
                        >
                          Teslimat Başladı
                        </button>
                      )}
                      {selectedOrder.status === "IN_TRANSIT" && (
                        <button
                          onClick={() => updateOrderStatus(selectedOrder.id, "DELIVERED")}
                          className="py-2 px-3 rounded-md bg-green-500 text-white text-sm hover:bg-green-600 col-span-2"
                        >
                          Teslim Edildi
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Rota Görüntüleme Modalı
  const RouteViewModal = () => {
    if (!showRouteView || !selectedOrderRoute) return null;

    // Kurye konumu için kontrol - önce courier nesnesinde varsa, yoksa API yanıtında varsa
    const courierPosition = selectedOrder?.courier?.currentLatitude && selectedOrder?.courier?.currentLongitude ? 
      {
        latitude: selectedOrder.courier.currentLatitude,
        longitude: selectedOrder.courier.currentLongitude
      } : selectedOrder?.courier?.latitude && selectedOrder?.courier?.longitude ? 
      {
        latitude: selectedOrder.courier.latitude,
        longitude: selectedOrder.courier.longitude
      } : undefined;

    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Truck size={20} className="mr-2" />
              {selectedOrder?.orderNumber ? `Sipariş #${selectedOrder.orderNumber} - Teslimat Rotası` : 'Teslimat Rotası'}
            </h3>
            <button
              onClick={handleCloseRouteView}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle size={24} />
            </button>
          </div>
          
          {/* Map and Route Info */}
          <div className="flex flex-col md:flex-row flex-grow h-[70vh]">
            {/* Map */}
            <div className="flex-grow h-full relative">
              <RouteMap 
                route={selectedOrderRoute} 
                courierPosition={courierPosition}
                loading={isLoadingRoute}
                className="h-full"
              />
            </div>
            
            {/* Sidebar with Route Info */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l overflow-y-auto">
              <div className="p-4">
                <h4 className="font-medium text-lg mb-3 flex items-center">
                  <MapPin size={18} className="mr-2" />
                  Teslimat Noktaları
                </h4>
                
                {/* Route Summary */}
                <div className="bg-blue-50 p-3 rounded mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Toplam Mesafe:</span>
                    <span>{selectedOrderRoute.totalDistance.toFixed(1)} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Tahmini Süre:</span>
                    <span>{Math.floor(selectedOrderRoute.totalDuration / 60)}s {selectedOrderRoute.totalDuration % 60}d</span>
                  </div>
                </div>
                
                {/* Courier Info */}
                {selectedOrder?.courier && (
                  <div className="border rounded p-3 mb-4">
                    <h5 className="font-medium mb-2">Kurye Bilgileri</h5>
                    <p><span className="text-gray-500">İsim:</span> {selectedOrder.courier.name}</p>
                    <p><span className="text-gray-500">Telefon:</span> {selectedOrder.courier.phone}</p>
                  </div>
                )}
                
                {/* Delivery Points */}
                <div className="space-y-3">
                  {selectedOrderRoute.deliveryPoints.map((point) => (
                    <div key={point.id} className="border rounded p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white font-bold text-sm">
                          {point.sequenceNumber}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          point.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                          point.status === 'PICKUP' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {point.status === 'PICKUP' ? 'Alım Noktası' : 
                           point.status === 'DELIVERED' ? 'Teslim Edildi' : 
                           'Teslim Edilecek'}
                        </span>
                      </div>
                      <p className="font-medium">{point.customerName}</p>
                      <p className="text-sm text-gray-600 truncate">{point.address}</p>
                      {point.estimatedArrival && (
                        <p className="text-xs text-gray-500 mt-1">
                          Tahmini Varış: {new Date(point.estimatedArrival).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <BusinessLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-between">
            <Header title="Siparişler" />
            <Link href="/business/policies" className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
              <Settings className="h-4 w-4 mr-2" />
              İade ve İptal Politikaları
            </Link>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Sipariş Yönetimi</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tüm siparişlerinizi görüntüleyin, yönetin ve durumlarını güncelleyin.
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          <div className="mb-6">
            {/* Üst menü -> filtreleme, arama vb. */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Sipariş durumu filtreleme */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleStatusChange("all")}
                    className={`px-3 py-2 text-sm rounded-md ${
                      selectedStatus === "all"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Tümü
                  </button>
                  <button
                    onClick={() => handleStatusChange("PENDING")}
                    className={`px-3 py-2 text-sm rounded-md ${
                      selectedStatus === "PENDING"
                        ? "bg-yellow-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Bekleyen
                  </button>
                  <button
                    onClick={() => handleStatusChange("PROCESSING")}
                    className={`px-3 py-2 text-sm rounded-md ${
                      selectedStatus === "PROCESSING"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    İşleme Alınan
                  </button>
                  <button
                    onClick={() => handleStatusChange("PREPARING")}
                    className={`px-3 py-2 text-sm rounded-md ${
                      selectedStatus === "PREPARING"
                        ? "bg-indigo-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Hazırlanıyor
                  </button>
                  <button
                    onClick={() => handleStatusChange("READY")}
                    className={`px-3 py-2 text-sm rounded-md ${
                      selectedStatus === "READY"
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Hazır
                  </button>
                  <button
                    onClick={() => handleStatusChange("IN_TRANSIT")}
                    className={`px-3 py-2 text-sm rounded-md ${
                      selectedStatus === "IN_TRANSIT"
                        ? "bg-cyan-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Yolda
                  </button>
                  <button
                    onClick={() => handleStatusChange("DELIVERED")}
                    className={`px-3 py-2 text-sm rounded-md ${
                      selectedStatus === "DELIVERED"
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Teslim Edildi
                  </button>
                  <button
                    onClick={() => handleStatusChange("CANCELED")}
                    className={`px-3 py-2 text-sm rounded-md ${
                      selectedStatus === "CANCELED"
                        ? "bg-red-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    İptal Edildi
                  </button>
                </div>
                
                {/* Arama ve yenile butonları */}
                <div className="flex gap-2 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <input
                      type="text"
                      placeholder="Sipariş veya müşteri ara..."
                      className="block w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                  <button
                    onClick={() => fetchOrders(pagination.page, selectedStatus)}
                    className="p-2 rounded-md border border-gray-300 hover:bg-gray-50"
                    title="Yenile"
                  >
                    <RefreshCw size={20} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Hata mesajı */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                {error}
              </div>
            )}
            
            {/* Sipariş listesi */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="inline-flex rounded-full bg-yellow-100 p-4 mb-4">
                    <Package className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Sipariş Bulunamadı</h3>
                  <p className="mt-2 text-gray-500">
                    Seçilen filtre kriterlerine uygun sipariş bulunamadı. Lütfen filtreleri değiştirerek tekrar deneyin.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center space-x-1 cursor-pointer">
                            <span>Sipariş No</span>
                            <ArrowUpDown size={14} />
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center space-x-1 cursor-pointer">
                            <span>Tarih</span>
                            <ArrowUpDown size={14} />
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center space-x-1 cursor-pointer">
                            <span>Müşteri</span>
                            <ArrowUpDown size={14} />
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center space-x-1 cursor-pointer">
                            <span>Tutar</span>
                            <ArrowUpDown size={14} />
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center space-x-1 cursor-pointer">
                            <span>Durum</span>
                            <ArrowUpDown size={14} />
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kurye
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                            <div className="text-xs text-gray-500">{formatTime(order.createdAt)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                            <div className="text-xs text-gray-500">{order.customer.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">{formatCurrency(order.totalPrice)}</div>
                            <div className="text-xs text-gray-500">{order.items.length} ürün</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {order.courier ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900">{order.courier.name}</div>
                                <div className="text-xs text-gray-500">{order.courier.phone}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">Atanmadı</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewOrderDetails(order)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Detaylar
                            </button>
                            {order.courier && (
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  fetchOrderRoute(order.id);
                                  setShowRouteView(true);
                                }}
                                className="text-green-600 hover:text-green-900 inline-flex items-center"
                              >
                                <MapIcon size={16} className="mr-1" />
                                Rota
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Pagination */}
              {!loading && orders.length > 0 && (
                <div className="px-6 py-3 bg-gray-50 border-t flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Toplam {pagination.total} sipariş, {pagination.pages} sayfa
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fetchOrders(pagination.page - 1, selectedStatus)}
                      disabled={pagination.page === 1}
                      className={`px-3 py-1 rounded border text-sm ${
                        pagination.page === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Önceki
                    </button>
                    <div className="px-3 py-1 text-sm font-medium">
                      Sayfa {pagination.page} / {pagination.pages}
                    </div>
                    <button
                      onClick={() => fetchOrders(pagination.page + 1, selectedStatus)}
                      disabled={pagination.page === pagination.pages || pagination.pages === 0}
                      className={`px-3 py-1 rounded border text-sm ${
                        pagination.page === pagination.pages || pagination.pages === 0
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Sonraki
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Sipariş detay modalı */}
        {showOrderDetail && <OrderDetailModal />}
        
        {/* Rota görüntüleme modalı */}
        {showRouteView && <RouteViewModal />}
      </div>
    </BusinessLayout>
  );
} 