"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import BusinessLayout from "@/app/components/layouts/BusinessLayout";
import { 
  Package, Clock, Calendar, ArrowUpDown, Search, 
  RefreshCw, Filter, CheckCircle, AlertTriangle, XCircle, 
  Truck, Receipt, MoreVertical, MapPin, User, Phone,
  Map as MapIcon
} from "lucide-react";
import RouteMap from "@/app/components/routes/RouteMap";
import type { RouteData } from "@/app/components/routes/RouteMap";

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
  courier: {
    id: string;
    name: string;
    phone: string;
  } | null;
}

// Pagination interface
interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
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
  const [selectedOrderRoute, setSelectedOrderRoute] = useState<RouteData | undefined>(undefined);
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
        setSelectedOrderRoute(response.data.route);
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

  return (
    <BusinessLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Sipariş Yönetimi</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tüm siparişlerinizi görüntüleyin, yönetin ve durumlarını güncelleyin.
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          {/* Filtreler */}
          <div className="bg-white shadow rounded-lg p-4 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="relative rounded-md shadow-sm w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Sipariş veya müşteri ara..."
                    className="px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 block w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Durum:</span>
                  <select
                    className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={selectedStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                  >
                    <option value="all">Tüm Siparişler</option>
                    <option value="PENDING">Bekleyen</option>
                    <option value="PROCESSING">İşleniyor</option>
                    <option value="PREPARING">Hazırlanıyor</option>
                    <option value="READY">Hazır</option>
                    <option value="IN_TRANSIT">Yolda</option>
                    <option value="DELIVERED">Teslim Edildi</option>
                    <option value="CANCELED">İptal Edildi</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => fetchOrders(pagination.page, selectedStatus)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Yenile
              </button>
            </div>
          </div>
          
          {/* Yükleniyor */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {/* Hata */}
          {error && !loading && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Sipariş Listesi */}
          {!loading && !error && orders.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <li key={order.id}>
                    <div className="block hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col sm:flex-row sm:items-center">
                            <p className="text-sm font-medium text-blue-600 truncate mr-2">
                              Sipariş #{order.orderNumber}
                            </p>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <button
                              onClick={() => handleViewOrderDetails(order)}
                              className="px-3 py-1 text-xs text-blue-700 hover:text-blue-500"
                            >
                              Detaylar
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <div className="flex items-center text-sm text-gray-500 mr-6">
                              <User className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              {order.customer.name}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 mr-6">
                              <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              {order.address.substring(0, 30)}...
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <Receipt className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              {formatCurrency(order.totalPrice)}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <p className="whitespace-nowrap">
                              {formatDate(order.createdAt)} {formatTime(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Sipariş İşlemleri */}
                        {(order.status === "PENDING" || order.status === "PROCESSING" || order.status === "PREPARING") && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {order.status === "PENDING" && (
                              <button
                                onClick={() => updateOrderStatus(order.id, "PROCESSING")}
                                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Siparişi İşleme Al
                              </button>
                            )}
                            
                            {order.status === "PROCESSING" && (
                              <button
                                onClick={() => updateOrderStatus(order.id, "PREPARING")}
                                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Hazırlamaya Başla
                              </button>
                            )}
                            
                            {order.status === "PREPARING" && (
                              <button
                                onClick={() => updateOrderStatus(order.id, "READY")}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Hazır İşaretle
                              </button>
                            )}
                            
                            {order.status !== "CANCELED" && order.status !== "DELIVERED" && (
                              <button
                                onClick={() => updateOrderStatus(order.id, "CANCELED")}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                İptal Et
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Toplam <span className="font-medium">{pagination.total}</span> sipariş,{" "}
                        <span className="font-medium">{pagination.page}</span>/{pagination.pages} sayfa
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => fetchOrders(pagination.page - 1, selectedStatus)}
                          disabled={pagination.page === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                            pagination.page === 1 ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                          }`}
                        >
                          <span className="sr-only">Önceki</span>
                          &laquo; Önceki
                        </button>
                        <button
                          onClick={() => fetchOrders(pagination.page + 1, selectedStatus)}
                          disabled={pagination.page === pagination.pages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                            pagination.page === pagination.pages ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                          }`}
                        >
                          <span className="sr-only">Sonraki</span>
                          Sonraki &raquo;
                        </button>
                      </nav>
                    </div>
                  </div>
                  <div className="flex sm:hidden justify-between w-full">
                    <button
                      onClick={() => fetchOrders(pagination.page - 1, selectedStatus)}
                      disabled={pagination.page === 1}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
                        pagination.page === 1 ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                      }`}
                    >
                      Önceki
                    </button>
                    <button
                      onClick={() => fetchOrders(pagination.page + 1, selectedStatus)}
                      disabled={pagination.page === pagination.pages}
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
                        pagination.page === pagination.pages ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                      }`}
                    >
                      Sonraki
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Sipariş Bulunamadı */}
          {!loading && !error && orders.length === 0 && (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Sipariş bulunamadı</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedStatus === "all" 
                  ? "Henüz hiç sipariş bulunmuyor." 
                  : `${selectedStatus} durumunda sipariş bulunmuyor.`}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Sipariş Detay Modal */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full md:max-w-xl lg:max-w-2xl">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        Sipariş Detayı #{selectedOrder.orderNumber}
                      </h3>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Müşteri Bilgileri</h4>
                          <p className="mt-1 text-sm text-gray-900">{selectedOrder.customer.name}</p>
                          <p className="mt-1 text-sm text-gray-900">{selectedOrder.customer.phone}</p>
                          <p className="mt-1 text-sm text-gray-900">{selectedOrder.customer.email}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Teslimat Bilgileri</h4>
                          <p className="mt-1 text-sm text-gray-900">{selectedOrder.address}</p>
                          {selectedOrder.courier ? (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-500">Kurye</p>
                              <p className="mt-1 text-sm text-gray-900">{selectedOrder.courier.name}</p>
                              <p className="mt-1 text-sm text-gray-900">{selectedOrder.courier.phone}</p>
                              
                              {/* Rota bilgisi ve harita butonunu göster */}
                              <button
                                onClick={() => setShowRouteView(true)}
                                className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <MapIcon className="h-4 w-4 mr-1" />
                                Rotayı Görüntüle
                              </button>
                            </div>
                          ) : (
                            <p className="mt-1 text-sm text-gray-500">Henüz kurye atanmadı</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Teslimat Rotası Görünümü */}
                      {showRouteView && (
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium text-gray-500">Teslimat Rotası</h4>
                            <button
                              onClick={handleCloseRouteView}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              Kapat ×
                            </button>
                          </div>
                          <div className="h-[300px] border border-gray-200 rounded-md overflow-hidden">
                            <RouteMap
                              route={selectedOrderRoute}
                              loading={isLoadingRoute}
                              className="h-full"
                            />
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Not: Harita üzerindeki noktalar, teslimat rotasını göstermektedir.
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-500">Sipariş Detayları</h4>
                        <div className="mt-2 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                          <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Ürün</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Adet</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Fiyat</th>
                                <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 sm:pr-6">Toplam</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {selectedOrder.items.map((item, index) => (
                                <tr key={index}>
                                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">{item.name}</td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.quantity}</td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatCurrency(item.price)}</td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right sm:pr-6">{formatCurrency(item.price * item.quantity)}</td>
                                </tr>
                              ))}
                              <tr className="bg-gray-50">
                                <td colSpan={3} className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 text-right sm:pl-6">Toplam</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900 text-right sm:pr-6">{formatCurrency(selectedOrder.totalPrice)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {selectedOrder.notes && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-500">Sipariş Notu</h4>
                          <p className="mt-1 text-sm text-gray-900">{selectedOrder.notes}</p>
                        </div>
                      )}
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Sipariş Tarihi</h4>
                          <p className="mt-1 text-sm text-gray-900">
                            {formatDate(selectedOrder.createdAt)} {formatTime(selectedOrder.createdAt)}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Tahmini Teslimat</h4>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedOrder.estimatedDelivery ? (
                              <>
                                {formatDate(selectedOrder.estimatedDelivery)} {formatTime(selectedOrder.estimatedDelivery)}
                              </>
                            ) : (
                              "Belirtilmemiş"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedOrder.status === "PENDING" && (
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => updateOrderStatus(selectedOrder.id, "PROCESSING")}
                  >
                    Siparişi İşleme Al
                  </button>
                )}
                
                {selectedOrder.status === "PROCESSING" && (
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => updateOrderStatus(selectedOrder.id, "PREPARING")}
                  >
                    Hazırlamaya Başla
                  </button>
                )}
                
                {selectedOrder.status === "PREPARING" && (
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => updateOrderStatus(selectedOrder.id, "READY")}
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Hazır İşaretle
                  </button>
                )}
                
                {selectedOrder.status !== "CANCELED" && selectedOrder.status !== "DELIVERED" && (
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => updateOrderStatus(selectedOrder.id, "CANCELED")}
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    İptal Et
                  </button>
                )}
                
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={closeOrderDetail}
                >
                  Kapat
                </button>
              </div>
            </div>
      </div>
    </div>
      )}
    </BusinessLayout>
  );
} 