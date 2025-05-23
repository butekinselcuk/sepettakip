"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  ArrowUp, 
  Clock,
  Wallet,
  Zap,
} from 'lucide-react';

interface DashboardMetrics {
  totalOrders: number;
  newOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  totalBusinesses?: number;
  activeBusinesses?: number;
  ordersByStatus: { status: string; count: number }[];
  revenueByPaymentMethod: { method: string; total: number }[];
  orderCompletionRate: number | null; // Null olabilir
  onTimeDeliveryRate: number | null;  // Null olabilir
  activeCouriers: number;
  totalCouriers: number;
  avgDeliveryTime: number;
  // Alternatif veri formatları için ilave alanlar
  orders?: {
    total: number;
    new: number;
    byStatus: { status: string; _count: { id: number } }[];
  };
  revenue?: {
    total: number;
    average: number;
    byMethod: { method: string; total: number }[];
  };
  customers?: {
    total: number;
    new: number;
    active: number;
  };
  businesses?: {
    total: number;
    active: number;
  };
  couriers?: {
    total: number;
    active: number;
  };
  deliveries?: {
    completionRate: number;
    onTimeRate: number;
    averageTime: number;
    averageDeliveryTime?: number;
  };
}

/**
 * Dashboard sayfası için veri getiren fonksiyon
 */
async function fetchDashboardData(token: string, period: string = 'today') {
  // URI parametresi olarak dönemi gönder
  const url = `/api/admin/dashboard?period=${period}`;
  
  console.log('Fetching dashboard data with token:', token.substring(0, 15) + '...');
  
  try {
  const metricsResponse = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  });

  // API yanıtı detaylı kontrolü
  if (!metricsResponse.ok) {
    let errorBody = 'Sunucu hatası';
    try {
      errorBody = await metricsResponse.text();
      console.error('API Error:', metricsResponse.status, metricsResponse.statusText);
    console.error('API Error Body:', errorBody);
    } catch (e) {
      console.error('API Error Body okuma hatası:', e);
    }
      
      // Özel hata mesajları
      if (metricsResponse.status === 401) {
        throw new Error('Oturum süresi dolmuş veya geçersiz. Lütfen tekrar giriş yapın.');
      } else if (metricsResponse.status === 403) {
        throw new Error('Bu sayfaya erişim yetkiniz bulunmuyor.');
      } else if (metricsResponse.status === 404) {
        throw new Error('İstenen veri bulunamadı.');
      } else {
      throw new Error(`Sunucu hatası: ${metricsResponse.statusText || 'Bilinmeyen hata'}`);
      }
  }

  const data = await metricsResponse.json();
  console.log('Dashboard data received:', data);
  return data;
  } catch (error: any) {
    console.error('Fetch error:', error);
    if (error.message.includes('fetch')) {
      throw new Error('Sunucu bağlantısı kurulamadı. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dataFetched, setDataFetched] = useState(false);
  
  useEffect(() => {
    // Prevent recursive calls by checking if data has already been fetched
    if (dataFetched && !isLoading) return;
    
    const getDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // localStorage veya sessionStorage'dan token'ı al
        let token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (!token) {
          console.warn('No token found in storage');
          // Token yoksa kullanıcıyı login sayfasına yönlendir
          window.location.href = '/auth/login?callbackUrl=/admin/dashboard';
            return;
        }
        
        // API'den veri al
        try {
          const responseData = await fetchDashboardData(token, dateRange);
          setMetrics(responseData.metrics);
          setDataFetched(true);
        } catch (apiError: any) {
          console.error('API fetch failed:', apiError);
          
          // Oturum hatası durumunda login'e yönlendir
          if (apiError.message.includes('Oturum süresi dolmuş') || apiError.message.includes('erişim yetkiniz bulunmuyor')) {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            window.location.href = '/auth/login?callbackUrl=/admin/dashboard';
            return;
          }
          
          setError(apiError.message || 'Sunucu ile bağlantı kurulamadı.');
          setDataFetched(true);
        }
      } catch (err) {
        console.error('Dashboard verilerini yüklerken hata:', err);
        setError('Sunucu ile bağlantı kurulamadı. Lütfen internet bağlantınızı kontrol edin.');
        setDataFetched(true);
      } finally {
        setIsLoading(false);
      }
    };

    getDashboardData();
  }, [dateRange, dataFetched, isLoading]);

  // Tarih aralığını değiştirme fonksiyonu
  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    // Reset data fetched state to allow refetching when date range changes
    setDataFetched(false);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500">İstatistikler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500">Veri bulunamadı.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        {/* Tarih filtresi */}
        <div className="flex space-x-2">
          <button 
            onClick={() => handleDateRangeChange('today')}
            className={`px-3 py-1 rounded ${dateRange === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Bugün
          </button>
          <button 
            onClick={() => handleDateRangeChange('week')}
            className={`px-3 py-1 rounded ${dateRange === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Bu Hafta
          </button>
          <button 
            onClick={() => handleDateRangeChange('month')}
            className={`px-3 py-1 rounded ${dateRange === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Bu Ay
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Sipariş Kartı */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Toplam Siparişler</p>
              <p className="text-2xl font-bold">{metrics.orders?.total || metrics.totalOrders || 0}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-500 font-medium">12.5%</span>
            <span className="text-gray-500 ml-1">geçen haftaya göre</span>
          </div>
        </div>
        
        {/* Yeni Siparişler Kartı */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Yeni Siparişler</p>
              <p className="text-2xl font-bold">{metrics.orders?.new || metrics.newOrders || 0}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-500 font-medium">8.2%</span>
            <span className="text-gray-500 ml-1">geçen güne göre</span>
          </div>
        </div>
        
        {/* Müşteriler Kartı */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Toplam Müşteriler</p>
              <p className="text-2xl font-bold">{metrics.customers?.total || metrics.totalCustomers || 0}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-500 font-medium">5.3%</span>
            <span className="text-gray-500 ml-1">geçen aya göre</span>
          </div>
        </div>
        
        {/* Gelir Kartı */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Toplam Gelir</p>
              <p className="text-2xl font-bold">₺{(metrics.revenue?.total || metrics.totalRevenue || 0).toLocaleString()}</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-full">
              <Wallet className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-500 font-medium">15.8%</span>
            <span className="text-gray-500 ml-1">geçen haftaya göre</span>
          </div>
        </div>
      </div>
      
      {/* Kuryeler ve İşletmeler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Kuryeler</h2>
          <div className="flex justify-between mb-2">
            <div>
              <p className="text-sm text-gray-500">Toplam Kuryeler</p>
              <p className="text-xl font-bold">{metrics.couriers?.total || metrics.totalCouriers || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Aktif Kuryeler</p>
              <p className="text-xl font-bold">{metrics.couriers?.active || metrics.activeCouriers || 0}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-1">Kuryeler Aktiflik Oranı</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${(((metrics.couriers?.active || metrics.activeCouriers) || 0) / ((metrics.couriers?.total || metrics.totalCouriers) || 1)) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">İşletmeler</h2>
          <div className="flex justify-between mb-2">
            <div>
              <p className="text-sm text-gray-500">İşletmeler</p>
              <p className="text-2xl font-bold">{metrics.businesses?.total || metrics.totalBusinesses || 0}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-full">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Aktif: </span>
            <span className="text-gray-900 ml-1 font-medium">{metrics.businesses?.active || metrics.activeBusinesses || 0}</span>
          </div>
        </div>
            </div>
      
      {/* İşletme Metrikler */}
      <div className="p-4 rounded-lg shadow mb-4">
        <h3 className="font-medium mb-3 text-gray-700">İşletme Metrikleri</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Aktif İşletmeler:</span>
            <span className="font-medium">{metrics.businesses?.active || metrics.activeBusinesses || 0} / {metrics.businesses?.total || metrics.totalBusinesses || 0}</span>
          </div>
        </div>
      </div>
      
      {/* Performans Metrikleri */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center mb-2">
            <Clock className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold">Ortalama Teslimat Süresi</h2>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Ortalama Teslimat Süresi:</span>
            <span className="font-medium">
              {metrics.deliveries?.averageTime || metrics.avgDeliveryTime || 0} dk
            </span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center mb-2">
            <ShoppingCart className="h-5 w-5 text-green-600 mr-2" />
            <h2 className="text-lg font-semibold">Sipariş Tamamlanma Oranı</h2>
          </div>
          <p className="text-3xl font-bold mb-1">%{(metrics.deliveries?.completionRate || metrics.orderCompletionRate || 0).toString()}</p>
          <p className="text-sm text-gray-500">Başarıyla tamamlanan siparişler</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center mb-2">
            <Zap className="h-5 w-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold">Zamanında Teslimat</h2>
          </div>
          <p className="text-3xl font-bold mb-1">%{(metrics.onTimeDeliveryRate || 0).toString()}</p>
          <p className="text-sm text-gray-500">Zamanında teslim edilen siparişler</p>
        </div>
      </div>
    </div>
  );
} 