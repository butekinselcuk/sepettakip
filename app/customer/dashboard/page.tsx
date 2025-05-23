"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import Header from "@/components/Header";

export default function CustomerDashboard() {
  const [isClient, setIsClient] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [nearbyBusinesses, setNearbyBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active"); // "active", "recent", "businesses"
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    
    // Auth kontrolü - cookie ve localStorage iki kaynaktan da kontrol et
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      console.log("Token bulunamadı, login sayfasına yönlendiriliyor");
      router.push("/auth/login");
      return;
    }
    
    // Kullanıcı bilgilerini kontrol et
    try {
      // localStorage'dan veya JWT'den kullanıcı bilgisini al
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.role !== "CUSTOMER") {
          console.log("Kullanıcı rolü CUSTOMER değil, login sayfasına yönlendiriliyor");
          router.push("/auth/login");
          return;
        }
        console.log("CUSTOMER kullanıcısı doğrulandı:", userData.email);
      } else {
        // Kullanıcı bilgisi bulunamadı, API ile kontrol et
        checkUserRole();
        return;
      }
      
      // Sipariş ve işletme bilgilerini getir
      fetchOrders();
      fetchNearbyBusinesses();
    } catch (error) {
      console.error("Kullanıcı bilgisi işlenirken hata:", error);
      router.push("/auth/login");
    }
  }, [router]);

  // Kullanıcı rolünü API'den kontrol et
  const checkUserRole = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      const response = await axios.get("/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.role === "CUSTOMER") {
        console.log("API'den CUSTOMER kullanıcısı doğrulandı:", response.data.email);
        // Kullanıcı bilgilerini localStorage'a kaydet
        localStorage.setItem("user", JSON.stringify(response.data));
        
        // Sipariş ve işletme bilgilerini getir
        fetchOrders();
        fetchNearbyBusinesses();
      } else {
        console.log("Kullanıcı rolü CUSTOMER değil, login sayfasına yönlendiriliyor");
        router.push("/auth/login");
      }
    } catch (error) {
      console.error("Kullanıcı rolü kontrol edilirken hata:", error);
      router.push("/auth/login");
    }
  };

  // Sipariş bilgilerini getir
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      const response = await axios.get("/api/customer/orders", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data) {
        // Aktif siparişleri kontrol et
        if (response.data.activeOrders && response.data.activeOrders.length > 0) {
          // En son aktif siparişi al
          setActiveOrder(response.data.activeOrders[0]);
        } else {
          setActiveOrder(null);
        }
        
        // Geçmiş siparişleri kontrol et
        if (response.data.pastOrders && response.data.pastOrders.length > 0) {
          setRecentOrders(response.data.pastOrders.slice(0, 4)); // İlk 4 siparişi al
        } else {
          setRecentOrders([]);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Sipariş bilgileri alınırken hata:", error);
      setActiveOrder(null);
      setRecentOrders([]);
      setLoading(false);
    }
  };

  // Yakındaki işletmeleri getir
  const fetchNearbyBusinesses = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      const response = await axios.get("/api/business", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.businesses) {
        setNearbyBusinesses(response.data.businesses.slice(0, 4)); // İlk 4 işletmeyi al
      } else {
        setNearbyBusinesses([]);
      }
    } catch (error) {
      console.error("Yakındaki işletmeler alınırken hata:", error);
      setNearbyBusinesses([]);
    }
  };

  // Sipariş iptal
  const cancelOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await axios.post(`/api/orders/${orderId}/cancel`, {}, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        // Siparişler listesini yenile
        fetchOrders();
      } else {
        console.error("Sipariş iptali başarısız");
      }
    } catch (error) {
      console.error("Sipariş iptal hatası:", error);
    }
  };

  // Tarih/saat formatla
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    // Bugün ise saat
    if (date.getDate() === now.getDate() && 
        date.getMonth() === now.getMonth() && 
        date.getFullYear() === now.getFullYear()) {
      return `Bugün, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Dün ise "Dün, saat"
    if (date.getDate() === yesterday.getDate() && 
        date.getMonth() === yesterday.getMonth() && 
        date.getFullYear() === yesterday.getFullYear()) {
      return `Dün, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Diğer durumlarda tam tarih
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth()+1).toString().padStart(2, '0')}.${date.getFullYear()}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Global Header */}
      <Header />
      
      {/* Local header */}
      <header className="bg-white shadow">
        <div className="mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Müşteri Paneli</h1>
          <button 
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              router.push("/auth/login");
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Çıkış Yap
          </button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Sekme butonları */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setTab("active")}
              className={`${
                tab === "active"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Aktif Sipariş
            </button>
            <button
              onClick={() => setTab("recent")}
              className={`${
                tab === "recent"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Önceki Siparişler
            </button>
            <button
              onClick={() => setTab("businesses")}
              className={`${
                tab === "businesses"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Yakındaki İşletmeler
            </button>
          </nav>
        </div>

        {/* Aktif Sipariş Sekmesi */}
        {tab === "active" && (
          <>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-3 text-gray-600">Sipariş bilgileri yükleniyor...</p>
              </div>
            ) : activeOrder ? (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Sipariş Detayları */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Aktif Sipariş</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                        ${activeOrder.status === "PENDING" ? "bg-yellow-100 text-yellow-800" : 
                          activeOrder.status === "PREPARING" ? "bg-blue-100 text-blue-800" : 
                          activeOrder.status === "DELIVERED" ? "bg-green-100 text-green-800" :
                          "bg-gray-100 text-gray-800"}`}>
                        {activeOrder.status === "PENDING" ? "Beklemede" : 
                         activeOrder.status === "PREPARING" ? "Hazırlanıyor" : 
                         activeOrder.status === "DELIVERED" ? "Teslim Edildi" :
                         activeOrder.status}
                      </span>
                    </div>
                    
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="text-md font-medium">{activeOrder.business?.name || "İşletme"}</h4>
                          <p className="text-sm text-gray-500 mt-1">Sipariş #{activeOrder.id}</p>
                          <p className="text-sm text-gray-500">Sipariş Zamanı: {formatDate(activeOrder.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-md font-medium">{activeOrder.totalPrice} TL</p>
                          <p className="text-sm text-gray-500 mt-1">Tahmini Teslimat: {formatDate(activeOrder.estimatedDelivery || '')}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700">Sipariş İçeriği</h5>
                        <ul className="mt-2 space-y-2">
                          {activeOrder.items?.map((item: any, index: number) => (
                            <li key={index} className="text-sm text-gray-600 flex justify-between">
                              <span>{item.name} x{item.quantity}</span>
                              <span>{(item.price * item.quantity).toFixed(2)} TL</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {activeOrder.status === "PENDING" && (
                        <div className="mt-6">
                          <button
                            onClick={() => cancelOrder(activeOrder.id)}
                            className="w-full bg-red-600 border border-transparent rounded-md py-2 px-4 flex justify-center text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Siparişi İptal Et
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Kurye/Teslimat Bilgileri */}
                {activeOrder.courier && (
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Teslimat Bilgileri</h3>
                      <div className="border-t border-gray-200 pt-4">
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700">Kurye</h4>
                          <p className="mt-1 text-sm text-gray-600">{activeOrder.courier.user?.name || "Kurye Adı"}</p>
                          <p className="text-sm text-gray-600">{activeOrder.courier.phone || "Telefon Yok"}</p>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700">Teslimat Adresi</h4>
                          <p className="mt-1 text-sm text-gray-600">{activeOrder.address}</p>
                        </div>

                        <div className="bg-gray-100 p-4 rounded-lg mb-4 h-32 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">Harita burada görüntülenecek</span>
                        </div>
                        
                        <div className="mt-4">
                          <a
                            href={`tel:${activeOrder.courier.phone}`}
                            className="w-full bg-indigo-600 border border-transparent rounded-md py-2 px-4 flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Kurye'yi Ara
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 className="mt-3 text-lg font-medium text-gray-900">Aktif Siparişiniz Yok</h3>
                <p className="mt-2 text-sm text-gray-500">Yeni bir sipariş vermek için yakındaki işletmeleri keşfedin.</p>
                <div className="mt-4">
                  <button
                    onClick={() => setTab("businesses")}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    İşletmeleri Keşfet
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Önceki Siparişler Sekmesi */}
        {tab === "recent" && (
          <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Önceki Siparişler</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Son siparişlerinizin listesi.</p>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-3 text-gray-600">Sipariş geçmişi yükleniyor...</p>
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <li key={order.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 font-medium">{order.business?.name?.charAt(0) || "İ"}</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-900">{order.business?.name || "İşletme"}</h4>
                            <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full mr-4 
                            ${order.status === "DELIVERED" ? "bg-green-100 text-green-800" : 
                              order.status === "CANCELLED" ? "bg-red-100 text-red-800" : 
                              "bg-gray-100 text-gray-800"}`}>
                            {order.status === "DELIVERED" ? "Teslim Edildi" : 
                             order.status === "CANCELLED" ? "İptal Edildi" : 
                             order.status}
                          </span>
                          <p className="text-sm font-medium text-gray-900">{order.totalPrice} TL</p>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => router.push(`/customer/order/${order.id}`)}
                          className="text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          Detayları Görüntüle
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Henüz sipariş geçmişiniz bulunmuyor.</p>
              </div>
            )}
          </div>
        )}

        {/* Yakındaki İşletmeler Sekmesi */}
        {tab === "businesses" && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Yakındaki İşletmeler</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Size en yakın restoranlar ve cafeler.</p>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-3 text-gray-600">İşletmeler yükleniyor...</p>
              </div>
            ) : nearbyBusinesses.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-4">
                {nearbyBusinesses.map((business) => (
                  <div key={business.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
                    <div className="h-36 bg-gray-200 relative">
                      {business.logoUrl ? (
                        <Image 
                          src={business.logoUrl} 
                          alt={business.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-gray-400">{business.name?.charAt(0) || "İ"}</span>
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-4">
                      <div className="flex justify-between items-start">
                        <h4 className="text-md font-medium text-gray-900">{business.name}</h4>
                        <div className="flex items-center">
                          <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                          <span className="ml-1 text-sm text-gray-600">{business.rating || "-"}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">{business.categories?.join(", ") || "Kategori yok"}</p>
                      </div>
                      
                      <div className="mt-2 flex justify-between items-center">
                        <button
                          onClick={() => router.push(`/customer/business/${business.id}`)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Menüyü Gör
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Yakınızda işletme bulunamadı.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
} 