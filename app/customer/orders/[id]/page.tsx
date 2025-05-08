"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Clock,
  Package,
  User,
  Phone,
  Truck,
  ArrowLeft,
  Navigation,
  AlertTriangle,
  Info,
  FileText,
  CheckCircle,
  XCircle
} from "lucide-react";
import Header from "@/components/Header";

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
  latitude?: number;
  longitude?: number;
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
    lastLocationUpdate?: string;
  };
}

export default function OrderDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const orderId = params.id;

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
      
      // Sipariş detayını getir
      fetchOrderDetails();
    } catch (error) {
      console.error("Kullanıcı bilgisi işlenirken hata:", error);
      router.push("/auth/login");
    }
  }, [router, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await axios.get(`/api/customer/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.order) {
        setOrder(response.data.order);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Sipariş detayları alınırken hata:", error);
      
      // For development, set mock data if API fails
      createMockOrderDetail();
      
      setError("Sipariş detayları yüklenemedi. Lütfen daha sonra tekrar deneyin.");
      setLoading(false);
    }
  };
  
  // Create mock data for development
  const createMockOrderDetail = () => {
    const mockOrder: Order = {
      id: orderId,
      status: "IN_TRANSIT",
      totalPrice: 120.50,
      address: "Bağdat Caddesi No:123, Kadıköy, İstanbul",
      notes: "Kapıda zili çalın, lütfen.",
      items: [
        { id: "i1", name: "Köfte Burger", quantity: 2, price: 45 },
        { id: "i2", name: "Patates Kızartması", quantity: 1, price: 15 },
        { id: "i3", name: "Cola", quantity: 2, price: 7.75 }
      ],
      estimatedDelivery: new Date(Date.now() + 30 * 60000).toISOString(),
      actualDelivery: null,
      createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 60000).toISOString(),
      latitude: 40.9792,
      longitude: 29.0546,
      business: {
        id: "b1",
        name: "Burger Dünyası",
        logoUrl: "https://via.placeholder.com/150",
        address: "Bağdat Caddesi No:100, Kadıköy, İstanbul"
      },
      courier: {
        id: "c1",
        user: {
          name: "Ahmet Yılmaz",
          email: "ahmet@example.com"
        },
        phone: "+90 555 123 4567",
        currentLatitude: 40.9762,
        currentLongitude: 29.0520,
        lastLocationUpdate: new Date(Date.now() - 5 * 60000).toISOString()
      }
    };
    
    setOrder(mockOrder);
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await axios.post(
        `/api/customer/orders/${orderId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        // Update the order status in the UI
        setOrder({
          ...order,
          status: "CANCELLED",
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Sipariş iptal hatası:", error);
      setError("Sipariş iptal edilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
      
      // For development, update the UI anyway
      if (order) {
        setOrder({
          ...order,
          status: "CANCELLED",
          updatedAt: new Date().toISOString()
        });
      }
    }
  };

  const handleViewOnMap = () => {
    if (!order) return;
    
    if (order.courier?.currentLatitude && order.courier?.currentLongitude && order.latitude && order.longitude) {
      // Open in Google Maps with route from courier to delivery address
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${order.courier.currentLatitude},${order.courier.currentLongitude}&destination=${order.latitude},${order.longitude}`,
        '_blank'
      );
    } else if (order.latitude && order.longitude) {
      // If no courier location, just show the delivery location
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`,
        '_blank'
      );
    }
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

  // Kurye son konum bilgisi
  const getLastUpdateInfo = (lastUpdate: string | undefined) => {
    if (!lastUpdate) return "Konum bilgisi yok";
    
    const updateTime = new Date(lastUpdate);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - updateTime.getTime()) / 60000);
    
    if (diffMinutes < 1) return "Az önce güncellendi";
    if (diffMinutes < 60) return `${diffMinutes} dakika önce güncellendi`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours} saat önce güncellendi`;
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-6">
          <Link href="/customer/orders" className="mr-4">
            <ArrowLeft className="h-5 w-5 text-gray-500 hover:text-gray-700" />
          </Link>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Sipariş Detayı
          </h1>
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
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : order ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Sipariş Bilgileri */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Sipariş #{order.id.substring(0, 8)}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  
                  <div className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusInfo(order.status).bgColor} ${getStatusInfo(order.status).textColor}`}>
                    {getStatusInfo(order.status).label}
                  </div>
                </div>
                
                <div className="border-t border-gray-200">
                  <dl>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">İşletme</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <div className="flex items-center">
                          {order.business.logoUrl && (
                            <div className="flex-shrink-0 h-10 w-10 mr-3">
                              <Image
                                src={order.business.logoUrl}
                                alt={order.business.name}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{order.business.name}</p>
                            <p className="text-gray-500">{order.business.address}</p>
                          </div>
                        </div>
                      </dd>
                    </div>
                    
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Teslimat Adresi</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                          {order.address}
                        </div>
                      </dd>
                    </div>
                    
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Tahmini Teslimat</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-gray-400 mr-2" />
                          {formatDate(order.estimatedDelivery)}
                        </div>
                      </dd>
                    </div>
                    
                    {order.actualDelivery && (
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Gerçekleşen Teslimat</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                            {formatDate(order.actualDelivery)}
                          </div>
                        </dd>
                      </div>
                    )}
                    
                    {order.notes && (
                      <div className="bg-yellow-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Sipariş Notu</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {order.notes}
                        </dd>
                      </div>
                    )}
                    
                    {order.courier && (
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Kurye Bilgileri</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <User className="h-5 w-5 text-gray-400 mr-2" />
                              {order.courier.user.name}
                            </div>
                            <div className="flex items-center mt-2">
                              <Phone className="h-5 w-5 text-gray-400 mr-2" />
                              <a href={`tel:${order.courier.phone}`} className="text-blue-600 hover:underline">
                                {order.courier.phone}
                              </a>
                            </div>
                            {order.courier.lastLocationUpdate && (
                              <div className="flex items-center mt-2">
                                <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                                <span className="text-gray-500">
                                  {getLastUpdateInfo(order.courier.lastLocationUpdate)}
                                </span>
                              </div>
                            )}
                          </div>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
              
              {/* Sipariş Öğeleri */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Sipariş Detayları
                  </h3>
                </div>
                
                <div className="border-t border-gray-200">
                  <ul className="divide-y divide-gray-200">
                    {order.items.map((item) => (
                      <li key={item.id} className="px-4 py-4">
                        <div className="flex justify-between">
                          <div className="flex items-center">
                            <span className="font-semibold text-gray-900 mr-2">
                              {item.quantity}x
                            </span>
                            <span className="text-gray-900">
                              {item.name}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="border-t border-gray-200 px-4 py-4">
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-500">Toplam</span>
                      <span className="text-gray-900">{formatCurrency(order.totalPrice)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sipariş Durumu ve Aksiyonlar */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Sipariş Durumu
                  </h3>
                </div>
                
                <div className="border-t border-gray-200 px-4 py-5">
                  <div className="flex items-center">
                    {getStatusInfo(order.status).icon}
                    <span className={`ml-2 font-medium ${getStatusInfo(order.status).textColor}`}>
                      {getStatusInfo(order.status).label}
                    </span>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    {(order.status === "IN_TRANSIT" || order.status === "READY") && (
                      <button
                        type="button"
                        onClick={handleViewOnMap}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Navigation className="h-5 w-5 mr-2" />
                        Haritada Göster
                      </button>
                    )}
                    
                    {(order.status === "PENDING" || order.status === "PROCESSING") && (
                      <button
                        type="button"
                        onClick={handleCancelOrder}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <XCircle className="h-5 w-5 mr-2" />
                        Siparişi İptal Et
                      </button>
                    )}
                    
                    <Link
                      href="/customer/orders"
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <ArrowLeft className="h-5 w-5 mr-2" />
                      Siparişlere Dön
                    </Link>
                    
                    {order.status === "DELIVERED" && (
                      <Link
                        href={`/customer/orders/${order.id}/rate`}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Değerlendir
                      </Link>
                    )}
                  </div>
                </div>
                
                {/* Teslimat Adımları */}
                <div className="border-t border-gray-200 px-4 py-5">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Teslimat Adımları
                  </h4>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-0.5 h-full bg-gray-200 mx-auto"></div>
                    </div>
                    
                    <div className="relative flex flex-col space-y-8">
                      {/* Sipariş Oluşturuldu */}
                      <div className="flex items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${order.status ? "bg-blue-500" : "bg-gray-200"}`}>
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <h5 className="text-sm font-medium text-gray-900">Sipariş Oluşturuldu</h5>
                          <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                      
                      {/* Sipariş Hazırlanıyor */}
                      <div className="flex items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${["PREPARING", "READY", "IN_TRANSIT", "DELIVERED"].includes(order.status) ? "bg-blue-500" : "bg-gray-200"}`}>
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <h5 className="text-sm font-medium text-gray-900">Hazırlanıyor</h5>
                          <p className="text-xs text-gray-500">
                            {order.status === "PREPARING" ? "Şu anda hazırlanıyor" : 
                             ["READY", "IN_TRANSIT", "DELIVERED"].includes(order.status) ? "Hazırlandı" : 
                             "Bekleniyor"}
                          </p>
                        </div>
                      </div>
                      
                      {/* Kurye Yolda */}
                      <div className="flex items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${["IN_TRANSIT", "DELIVERED"].includes(order.status) ? "bg-blue-500" : "bg-gray-200"}`}>
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <h5 className="text-sm font-medium text-gray-900">Yolda</h5>
                          <p className="text-xs text-gray-500">
                            {order.status === "IN_TRANSIT" ? "Kurye sipariş ile yolda" : 
                             order.status === "DELIVERED" ? "Teslim edildi" : 
                             "Bekleniyor"}
                          </p>
                        </div>
                      </div>
                      
                      {/* Teslim Edildi */}
                      <div className="flex items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${order.status === "DELIVERED" ? "bg-green-500" : "bg-gray-200"}`}>
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <h5 className="text-sm font-medium text-gray-900">Teslim Edildi</h5>
                          <p className="text-xs text-gray-500">
                            {order.status === "DELIVERED" ? `${formatDate(order.actualDelivery)}` : "Bekleniyor"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Sipariş Bulunamadı</h3>
            <p className="mt-1 text-gray-500">
              Aradığınız siparişe ulaşılamadı. Siparişlerinizi görmek için aşağıdaki butonu kullanabilirsiniz.
            </p>
            <div className="mt-6">
              <Link
                href="/customer/orders"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Siparişlere Dön
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 