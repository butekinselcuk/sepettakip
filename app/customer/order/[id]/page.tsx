'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import Header from '@/components/Header';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);

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
      
      // Sipariş bilgisini getir
      fetchOrder();
    } catch (error) {
      console.error("Kullanıcı bilgisi işlenirken hata:", error);
      router.push("/auth/login");
    }
  }, [router, params.id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const orderId = params.id;
      const token = localStorage.getItem("token");
      
      // API'den sipariş detayını getir
      const response = await axios.get(`/api/customer/orders?id=${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && (response.data.activeOrders || response.data.pastOrders)) {
        // Siparişi aktif veya geçmiş siparişler arasında ara
        const allOrders = [...(response.data.activeOrders || []), ...(response.data.pastOrders || [])];
        const orderData = allOrders.find(o => o.id === orderId);
        
        if (orderData) {
          setOrder(orderData);
        } else {
          setError('Sipariş bulunamadı');
        }
      } else {
        setError('Sipariş bilgisi alınamadı');
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error("Sipariş detayı alınırken hata:", err);
      setError(err.response?.data?.error || 'Sipariş bilgisi alınamadı');
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: {[key: string]: string} = {
      PENDING: "Beklemede",
      CONFIRMED: "Onaylandı",
      PREPARING: "Hazırlanıyor",
      ASSIGNED: "Kurye Atandı",
      PICKED_UP: "Yolda",
      DELIVERED: "Teslim Edildi",
      CANCELLED: "İptal Edildi"
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const statusColorMap: {[key: string]: string} = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      PREPARING: "bg-indigo-100 text-indigo-800",
      ASSIGNED: "bg-purple-100 text-purple-800",
      PICKED_UP: "bg-cyan-100 text-cyan-800",
      DELIVERED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800"
    };
    return statusColorMap[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleReorder = () => {
    // Tekrar sipariş verme işlemi
    alert("Tekrar sipariş veriliyor...");
    router.push(`/customer/business/${order.business.id}`);
  };

  if (!isClient) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
          <div className="text-center">
            <div className="spinner"></div>
            <p className="mt-2 text-gray-600">Sipariş bilgileri yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xl font-medium text-red-600">Hata</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <button
              onClick={() => router.push('/customer/dashboard')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/customer/dashboard')}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Geri Dön
          </button>
        </div>
        
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Sipariş #{order.orderNumber}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Sipariş Bilgileri */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Sipariş Detayları</h3>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="mb-6">
                  <h4 className="text-md font-medium">{order.business.name}</h4>
                  <p className="text-sm text-gray-500">{order.business.address}</p>
                  <p className="text-sm text-gray-500">Tel: {order.business.phone}</p>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700">Teslimat Adresi</h4>
                  <p className="text-sm text-gray-500 mt-1">{order.address}</p>
                  
                  {order.notes && (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-gray-700">Sipariş Notu</h4>
                      <p className="text-sm text-gray-500 mt-1">{order.notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700">Sipariş Özeti</h4>
                  <div className="mt-2">
                    <ul className="divide-y divide-gray-200">
                      {order.items.map((item: any) => (
                        <li key={item.id} className="py-3 flex justify-between">
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {item.quantity}x {item.name}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">{formatCurrency(item.price * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="flex justify-between">
                        <span className="text-base font-medium text-gray-900">Toplam</span>
                        <span className="text-base font-medium text-gray-900">{formatCurrency(order.totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {order.status === 'DELIVERED' && (
                  <button
                    onClick={handleReorder}
                    className="w-full bg-indigo-600 text-white py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Tekrar Sipariş Ver
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Sipariş Durumu ve Takip */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Sipariş Takibi</h3>
              
              {/* Teslimat Haritası - Gerçek bir uygulama için harita entegrasyonu yapılabilir */}
              {(order.status === 'ASSIGNED' || order.status === 'PICKED_UP') && (
                <div className="h-56 bg-gray-200 rounded-lg mb-6 flex items-center justify-center relative">
                  <p className="text-gray-500">Teslimat haritası burada görüntülenecek</p>
                </div>
              )}
              
              {/* Kurye Bilgisi */}
              {(order.status === 'ASSIGNED' || order.status === 'PICKED_UP' || order.status === 'DELIVERED') && order.courier && (
                <div className="mb-6 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Kurye Bilgisi</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium text-white">{order.courier.name.charAt(0)}</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{order.courier.name}</p>
                      </div>
                    </div>
                    {order.status !== 'DELIVERED' && (
                      <a
                        href={`tel:${order.courier.phone.replace(/\s+/g, '')}`}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium"
                      >
                        Ara
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              {/* Sipariş Takip Geçmişi */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Sipariş Durumu</h4>
                <ol className="relative border-l border-gray-200 ml-3">
                  {order.trackingHistory && order.trackingHistory.map((event: any, index: number) => (
                    <li key={index} className="mb-6 ml-6">
                      <span className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ${
                        index === order.trackingHistory.length - 1 ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                      </span>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{event.description}</h3>
                          <p className="text-xs text-gray-500">{formatDate(event.time)}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(event.status)}`}>
                          {getStatusText(event.status)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 