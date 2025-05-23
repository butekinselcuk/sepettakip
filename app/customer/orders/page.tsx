"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Clock,
  Package,
  Search,
  ArrowRight,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Truck,
  FileText,
  Info,
  Star,
  RefreshCw,
  Calendar as CalendarIcon,
  DollarSign,
  Building,
  ArrowDownUp,
  Repeat,
  ListFilter,
  History
} from "lucide-react";
import Header from "@/components/Header";
import OrderCard from "@/app/components/customer/OrderCard";

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
    currentLatitude?: number;
    currentLongitude?: number;
  };
}

export default function CustomerOrders() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("active"); // "active" veya "past"
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [orderToRate, setOrderToRate] = useState<string | null>(null);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [businessRating, setBusinessRating] = useState(5);
  const [ratingComment, setRatingComment] = useState("");

  useEffect(() => {
    setIsClient(true);
    
    // Auth kontrolü
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("Token bulunamadı, login sayfasına yönlendiriliyor");
      router.push("/auth/login");
      return;
    }
    
    // Kullanıcı bilgilerini kontrol et
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        console.log("Kullanıcı bilgisi bulunamadı, login sayfasına yönlendiriliyor");
        router.push("/auth/login");
        return;
      }
      
      const userData = JSON.parse(storedUser);
      if (userData.role !== "CUSTOMER") {
        console.log("Kullanıcı rolü CUSTOMER değil, login sayfasına yönlendiriliyor");
        router.push("/auth/login");
        return;
      }

      console.log("CUSTOMER kullanıcısı doğrulandı:", userData.email);
      
      // Siparişleri getir
      fetchOrders();
    } catch (error) {
      console.error("Kullanıcı bilgisi işlenirken hata:", error);
      router.push("/auth/login");
    }
  }, [router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await axios.get('/api/customer/orders', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.activeOrders) {
        setActiveOrders(response.data.activeOrders);
      }
      
      if (response.data && response.data.pastOrders) {
        setPastOrders(response.data.pastOrders);
      }
      
      setLoading(false);
      setRefreshing(false);
      setError("");
    } catch (error) {
      console.error("Siparişler alınırken hata:", error);
      
      setError("Siparişler yüklenemedi. Lütfen daha sonra tekrar deneyin.");
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleOrderClick = (orderId: string) => {
    router.push(`/customer/orders/${orderId}`);
  };

  const handleRateOrder = (orderId: string) => {
    const order = pastOrders.find(o => o.id === orderId);
    
    // Sadece teslim edilmiş siparişler değerlendirilebilir
    if (order && order.status === "DELIVERED") {
      setOrderToRate(orderId);
      setShowRateModal(true);
    }
  };

  const submitRating = async () => {
    if (!orderToRate) return;
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const ratingData = {
        deliveryRating,
        businessRating,
        comment: ratingComment
      };

      const response = await axios.post(
        `/api/customer/orders/${orderToRate}/rate`, 
        ratingData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        // Başarılı değerlendirme
        setShowRateModal(false);
        setOrderToRate(null);
        setRatingComment("");
        setDeliveryRating(5);
        setBusinessRating(5);
        
        // Siparişleri yeniden yükle
        fetchOrders();
      }
    } catch (error) {
      console.error("Değerlendirme gönderilirken hata:", error);
      setError("Değerlendirme gönderilemedi. Lütfen daha sonra tekrar deneyin.");
      
      // Kullanıcı deneyimi için yine de modalı kapat
      setShowRateModal(false);
      setOrderToRate(null);
    }
  };

  const refreshOrders = () => {
    fetchOrders();
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

  // Filtreleme fonksiyonu
  const filterOrders = (orders: Order[]) => {
    if (!searchTerm && statusFilter.length === 0) return orders;
    
    return orders.filter(order => {
      // Arama terimini kontrol et
      const searchMatch = searchTerm === "" || 
        order.business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())));
      
      // Durum filtresini kontrol et
      const statusMatch = statusFilter.length === 0 || statusFilter.includes(order.status);
      
      return searchMatch && statusMatch;
    });
  };

  // Durum filtresini toggle et
  const toggleStatusFilter = (status: string) => {
    if (statusFilter.includes(status)) {
      setStatusFilter(statusFilter.filter(s => s !== status));
    } else {
      setStatusFilter([...statusFilter, status]);
    }
  };

  if (!isClient) {
    return null;
  }

  const filteredActiveOrders = filterOrders(activeOrders);
  const filteredPastOrders = filterOrders(pastOrders);

  const renderStars = (count: number, onChange: (value: number) => void) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className="h-5 w-5"
              fill={star <= count ? "#FCD34D" : "none"}
              stroke={star <= count ? "#F59E0B" : "#9CA3AF"}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2 sm:mb-0">Siparişlerim</h1>
          
          <Link 
            href="/customer/orders/history" 
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <History size={16} className="mr-1" />
            Sipariş Geçmişim
          </Link>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
              Siparişlerim
            </h1>
          </div>
          <div className="mt-4 md:mt-0 md:ml-4">
            <button
              onClick={refreshOrders}
              disabled={refreshing}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${refreshing ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Yenileniyor...' : 'Yenile'}
            </button>
          </div>
        </div>
        
        {error && (
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
        
        {/* Arama ve Filtreler */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="İşletme adı, sipariş ID veya ürün ara..."
              />
            </div>
            
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filtreler
              {showFilters ? 
                <ChevronUp className="ml-2 h-4 w-4" /> : 
                <ChevronDown className="ml-2 h-4 w-4" />
              }
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Durum Filtresi</h3>
              <div className="flex flex-wrap gap-2">
                {["PENDING", "PREPARING", "READY", "IN_TRANSIT", "DELIVERED", "CANCELLED"].map((status) => (
                  <button
                    key={status}
                    onClick={() => toggleStatusFilter(status)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      statusFilter.includes(status) 
                        ? `${getStatusInfo(status).bgColor} ${getStatusInfo(status).textColor}` 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {getStatusInfo(status).icon}
                    <span className="ml-1">{getStatusInfo(status).label}</span>
                    {statusFilter.includes(status) && (
                      <XCircle className="ml-1 h-3 w-3" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Sekmeler */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("active")}
              className={`${
                activeTab === "active"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Aktif Siparişler
              {filteredActiveOrders.length > 0 && (
                <span className="ml-2 bg-indigo-100 text-indigo-600 py-0.5 px-2 rounded-full text-xs">
                  {filteredActiveOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`${
                activeTab === "past"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Geçmiş Siparişler
              {filteredPastOrders.length > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {filteredPastOrders.length}
                </span>
              )}
            </button>
          </nav>
        </div>
        
        {loading ? (
          <div className="flex flex-col space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white shadow rounded-lg p-6 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {/* Aktif Siparişler */}
            {activeTab === "active" && (
              <div className="space-y-4">
                {filteredActiveOrders.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aktif Sipariş Yok</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Şu anda aktif bir siparişiniz bulunmuyor.
                    </p>
                  </div>
                ) : (
                  filteredActiveOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onClick={() => handleOrderClick(order.id)}
                      isPastOrder={false}
                    />
                  ))
                )}
              </div>
            )}
            
            {/* Geçmiş Siparişler */}
            {activeTab === "past" && (
              <div className="space-y-4">
                {filteredPastOrders.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Geçmiş Sipariş Yok</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Henüz tamamlanmış veya iptal edilmiş siparişiniz bulunmuyor.
                    </p>
                  </div>
                ) : (
                  filteredPastOrders.map((order) => (
                    <div key={order.id} className="relative">
                      <OrderCard
                        order={order}
                        onClick={() => handleOrderClick(order.id)}
                        isPastOrder={true}
                      />
                      {order.status === "DELIVERED" && (
                        <div className="absolute top-4 right-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRateOrder(order.id);
                            }}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                          >
                            <Star className="mr-1 h-3 w-3" />
                            Değerlendir
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Değerlendirme Modal */}
      {showRateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            <button
              type="button"
              onClick={() => setShowRateModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-500"
            >
              <XCircle className="h-5 w-5" />
            </button>
            
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Siparişi Değerlendir</h3>
              <p className="text-sm text-gray-500">
                Deneyiminizi yıldızlarla puanlayarak değerlendirebilirsiniz.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kurye Değerlendirmesi
                </label>
                {renderStars(deliveryRating, setDeliveryRating)}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İşletme Değerlendirmesi
                </label>
                {renderStars(businessRating, setBusinessRating)}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yorum (İsteğe bağlı)
                </label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  rows={3}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                  placeholder="Deneyiminiz hakkında yorum yazabilirsiniz..."
                />
              </div>
              
              <div className="flex justify-end mt-5">
                <button
                  type="button"
                  onClick={() => setShowRateModal(false)}
                  className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={submitRating}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Değerlendir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 