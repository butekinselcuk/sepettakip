"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Header from "@/components/Header";
import OrderHistoryFilters from "@/app/components/customer/OrderHistoryFilters";
import OrderHistoryList from "@/app/components/customer/OrderHistoryList";
import { Bookmark, History, AlertCircle } from "lucide-react";

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

interface Business {
  id: string;
  name: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface FilterOptions {
  startDate: string;
  endDate: string;
  minPrice: string;
  maxPrice: string;
  businessId: string;
  statusFilter: string[];
  sortBy: string;
  sortOrder: string;
}

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    startDate: "",
    endDate: "",
    minPrice: "",
    maxPrice: "",
    businessId: "",
    statusFilter: [],
    sortBy: "createdAt",
    sortOrder: "desc"
  });

  useEffect(() => {
    // Auth kontrolü
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    // Kullanıcı rolü kontrolü
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        router.push("/auth/login");
        return;
      }

      const userData = JSON.parse(storedUser);
      if (userData.role !== "CUSTOMER") {
        router.push("/auth/login");
        return;
      }

      // Siparişleri ve işletmeleri getir
      fetchOrders();
      fetchBusinesses();
    } catch (error) {
      console.error("Kullanıcı bilgisi işlenirken hata:", error);
      router.push("/auth/login");
    }
  }, [router]);

  // Sayfa değişikliğinde siparişleri getir
  useEffect(() => {
    if (pagination.page > 0) {
      fetchOrders();
    }
  }, [pagination.page]);

  // İşletmeleri getir
  const fetchBusinesses = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await axios.get('/api/businesses', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.businesses) {
        setBusinesses(response.data.businesses);
      }
    } catch (error) {
      console.error("İşletmeler alınırken hata:", error);
      setError("İşletmeler yüklenemedi. Lütfen daha sonra tekrar deneyin.");
    }
  };

  // Siparişleri getir
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth/login");
        return;
      }

      // URL parametrelerini oluştur
      let url = `/api/customer/orders?page=${pagination.page}&limit=${pagination.limit}`;
      
      // Filtre parametrelerini ekle
      if (activeFilters.startDate) {
        url += `&startDate=${activeFilters.startDate}`;
      }
      
      if (activeFilters.endDate) {
        url += `&endDate=${activeFilters.endDate}`;
      }
      
      if (activeFilters.minPrice) {
        url += `&minPrice=${activeFilters.minPrice}`;
      }
      
      if (activeFilters.maxPrice) {
        url += `&maxPrice=${activeFilters.maxPrice}`;
      }
      
      if (activeFilters.businessId) {
        url += `&businessId=${activeFilters.businessId}`;
      }
      
      if (activeFilters.statusFilter.length > 0) {
        url += `&status=${activeFilters.statusFilter[0]}`;
      }
      
      if (activeFilters.sortBy && activeFilters.sortOrder) {
        url += `&sortBy=${activeFilters.sortBy}&sortOrder=${activeFilters.sortOrder}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data) {
        // Aktif ve geçmiş siparişleri birleştir (geçmiş sayfasında hepsini gösteriyoruz)
        const allOrders = [
          ...(response.data.activeOrders || []),
          ...(response.data.pastOrders || [])
        ];
        
        setOrders(allOrders);
        
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
      
      setLoading(false);
      setError("");
    } catch (error) {
      console.error("Siparişler alınırken hata:", error);
      setError("Siparişler yüklenemedi. Lütfen daha sonra tekrar deneyin.");
      setLoading(false);
    }
  };

  // Filtre değişikliği
  const handleFilterChange = (filters: FilterOptions) => {
    setActiveFilters(filters);
    setPagination({
      ...pagination,
      page: 1 // Filtreleme yapıldığında ilk sayfaya dön
    });
    
    // useEffect pagination.page değişikliğini yakalayacak ve fetchOrders'ı çağıracak
  };

  // Filtreleri sıfırla
  const handleResetFilters = () => {
    setActiveFilters({
      startDate: "",
      endDate: "",
      minPrice: "",
      maxPrice: "",
      businessId: "",
      statusFilter: [],
      sortBy: "createdAt",
      sortOrder: "desc"
    });
    
    setPagination({
      ...pagination,
      page: 1
    });
    
    // useEffect pagination.page değişikliğini yakalayacak ve fetchOrders'ı çağıracak
  };

  // Sayfa değiştirme
  const handlePageChange = (newPage: number) => {
    setPagination({
      ...pagination,
      page: newPage
    });
  };

  // Sipariş detayına git
  const handleViewOrderDetails = (orderId: string) => {
    router.push(`/customer/orders/${orderId}`);
  };

  // Tekrar sipariş ver
  const handleReorder = (orderId: string) => {
    // Seçilen siparişi al
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    // Sepete ekle ve sepet sayfasına yönlendir
    // Bu işlevi uygulamanın sepet yönetim mantığına göre özelleştirin
    localStorage.setItem('reorderItems', JSON.stringify(order.items));
    localStorage.setItem('reorderBusinessId', order.business.id);
    
    router.push(`/business/${order.business.id}`);
  };

  // Sipariş değerlendir
  const handleRateOrder = (orderId: string) => {
    router.push(`/customer/orders/rate/${orderId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center mb-6">
          <History size={24} className="text-blue-500 mr-3" />
          <h1 className="text-2xl font-semibold text-gray-900">Sipariş Geçmişim</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <OrderHistoryFilters
          businesses={businesses}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        <OrderHistoryList
          orders={orders}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onOrderClick={handleViewOrderDetails}
          onReorder={handleReorder}
          onRateOrder={handleRateOrder}
        />
      </div>
    </div>
  );
} 