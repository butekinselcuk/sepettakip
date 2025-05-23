import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Clock,
  Package,
  ChevronRight,
  Calendar,
  Building,
  MapPin,
  RefreshCw,
  Search,
  FileText,
  Repeat,
  Star,
  ArrowRight,
  CheckCircle,
  XCircle,
  Truck
} from 'lucide-react';

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

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface Props {
  orders: Order[];
  loading: boolean;
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onOrderClick: (orderId: string) => void;
  onReorder: (orderId: string) => void;
  onRateOrder: (orderId: string) => void;
}

export default function OrderHistoryList({
  orders,
  loading,
  pagination,
  onPageChange,
  onOrderClick,
  onReorder,
  onRateOrder
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  // Arama terimine göre siparişleri filtrele
  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.business.name.toLowerCase().includes(searchLower) ||
      order.id.toLowerCase().includes(searchLower) ||
      order.items.some(item => item.name.toLowerCase().includes(searchLower))
    );
  });

  // Boş ekran (arama sonucu veya sipariş yoksa)
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-lg shadow-sm border">
      <div className="h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center mb-4">
        <FileText className="h-12 w-12 text-blue-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Sipariş Bulunamadı</h3>
      <p className="text-sm text-gray-500 text-center max-w-md mb-6">
        {searchTerm
          ? 'Arama kriterlerinize uygun sipariş bulunamadı. Lütfen farklı bir arama terimi deneyin.'
          : 'Henüz bir sipariş geçmişiniz bulunmuyor. Sipariş vermeye başlamak için hemen alışveriş yapabilirsiniz.'}
      </p>
      {searchTerm ? (
        <button
          onClick={() => setSearchTerm('')}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100"
        >
          <RefreshCw size={16} className="mr-2" />
          Aramayı Temizle
        </button>
      ) : (
        <Link
          href="/customer/dashboard"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
        >
          <ArrowRight size={16} className="mr-2" />
          Alışverişe Başla
        </Link>
      )}
    </div>
  );

  // Yükleniyor durumu
  const renderLoading = () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  // Sipariş özeti (item listesi)
  const getOrderSummary = (items: OrderItem[]) => {
    if (items.length === 0) return "Sipariş detayı bulunamadı";
    
    if (items.length === 1) {
      return `${items[0].quantity}x ${items[0].name}`;
    }
    
    return `${items[0].quantity}x ${items[0].name} ve ${items.length - 1} diğer ürün`;
  };

  // Tarih formatla
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'd MMMM yyyy', { locale: tr });
    } catch (e) {
      return dateString;
    }
  };

  // Siparişten bu yana geçen süre
  const getTimeAgo = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: tr });
    } catch (e) {
      return '';
    }
  };

  // Durum gösterge rengi
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500';
      case 'PROCESSING': return 'bg-blue-500';
      case 'PREPARING': return 'bg-indigo-500';
      case 'READY': return 'bg-purple-500';
      case 'IN_TRANSIT': return 'bg-cyan-500';
      case 'DELIVERED': return 'bg-green-500';
      case 'CANCELLED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Durum metni
  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Beklemede';
      case 'PROCESSING': return 'İşleniyor';
      case 'PREPARING': return 'Hazırlanıyor';
      case 'READY': return 'Hazır';
      case 'IN_TRANSIT': return 'Yolda';
      case 'DELIVERED': return 'Teslim Edildi';
      case 'CANCELLED': return 'İptal Edildi';
      default: return status;
    }
  };
  
  // Durum ikonu
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock size={16} />;
      case 'PROCESSING': return <Package size={16} />;
      case 'PREPARING': return <Package size={16} />;
      case 'READY': return <CheckCircle size={16} />;
      case 'IN_TRANSIT': return <Truck size={16} />;
      case 'DELIVERED': return <CheckCircle size={16} />;
      case 'CANCELLED': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  // Para birimi formatla
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  // Sayfalama düğmeleri
  const renderPagination = () => {
    const { page, pages } = pagination;
    
    if (pages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-4">
        <div className="hidden sm:block">
          <p className="text-sm text-gray-700">
            <span className="font-medium">{pagination.total}</span> sipariş içinden{' '}
            <span className="font-medium">{(page - 1) * pagination.limit + 1}</span>-
            <span className="font-medium">
              {Math.min(page * pagination.limit, pagination.total)}
            </span>{' '}
            arası gösteriliyor
          </p>
        </div>
        <div className="flex flex-1 justify-between sm:justify-end">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              page === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            } mr-3`}
          >
            Önceki
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === pages}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              page === pages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Sonraki
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Arama */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Sipariş ara (işletme adı, sipariş ID veya ürün adı)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
      </div>

      {/* Yükleniyor, boş durum veya sipariş listesi */}
      {loading ? (
        renderLoading()
      ) : filteredOrders.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Üst kısım: Sipariş özeti */}
              <div className="p-4 cursor-pointer" onClick={() => onOrderClick(order.id)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className={`h-3 w-3 rounded-full ${getStatusColor(order.status)} mr-2`}></div>
                    <span className="text-sm font-medium">{getStatusText(order.status)}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    Sipariş #{order.id.substring(0, 8)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Sol taraf: İşletme bilgisi ve sipariş içeriği */}
                  <div className="flex">
                    <div className="relative h-16 w-16 rounded-md overflow-hidden bg-gray-100 mr-3 flex-shrink-0">
                      {order.business.logoUrl ? (
                        <Image
                          src={order.business.logoUrl}
                          alt={order.business.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full w-full bg-blue-50">
                          <Building className="h-8 w-8 text-blue-500" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-medium">{order.business.name}</h3>
                      <p className="text-sm text-gray-700 mt-1 line-clamp-1">{getOrderSummary(order.items)}</p>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <Calendar size={12} className="mr-1" />
                        <span>{formatDate(order.createdAt)}</span>
                        <span className="mx-1">•</span>
                        <span>{getTimeAgo(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Sağ taraf: Adres ve fiyat */}
                  <div>
                    <div className="flex items-start">
                      <MapPin size={16} className="text-gray-400 mt-0.5 mr-1 flex-shrink-0" />
                      <span className="text-sm text-gray-600 line-clamp-2">{order.address}</span>
                    </div>
                    <p className="text-lg font-semibold text-green-600 mt-2">
                      {formatCurrency(order.totalPrice)}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end mt-2">
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
              </div>
              
              {/* Alt kısım: Eylemler */}
              {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
                <div className="px-4 py-3 bg-gray-50 border-t flex flex-wrap gap-2">
                  <button
                    onClick={() => onReorder(order.id)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100"
                  >
                    <Repeat size={14} className="mr-1" />
                    Tekrar Sipariş Ver
                  </button>
                  
                  {order.status === 'DELIVERED' && (
                    <button
                      onClick={() => onRateOrder(order.id)}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 rounded-md hover:bg-yellow-100"
                    >
                      <Star size={14} className="mr-1" />
                      Değerlendir
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {/* Sayfalama */}
          {renderPagination()}
        </div>
      )}
    </div>
  );
} 