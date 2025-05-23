"use client";

import { useState, useEffect, useMemo } from "react";
import { format, parseISO, isAfter, isBefore } from "date-fns";
import { tr } from "date-fns/locale";
import axios from "axios";
import { useRouter } from "next/navigation";
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  ChevronDown, 
  AlertTriangle,
  Clock,
  Calendar,
  Loader2,
  Eye
} from "lucide-react";
import { toast } from "react-hot-toast";
import CancellationRequestDetail from "@/app/components/business/CancellationRequestDetail";

enum CancellationReason {
  CUSTOMER_CHANGED_MIND = "CUSTOMER_CHANGED_MIND",
  DUPLICATE_ORDER = "DUPLICATE_ORDER",
  DELIVERY_TOO_LONG = "DELIVERY_TOO_LONG",
  PRICE_ISSUES = "PRICE_ISSUES",
  RESTAURANT_CLOSED = "RESTAURANT_CLOSED",
  OUT_OF_STOCK = "OUT_OF_STOCK",
  OTHER = "OTHER"
}

const reasonLabels: Record<CancellationReason, string> = {
  [CancellationReason.CUSTOMER_CHANGED_MIND]: "Müşteri fikir değiştirdi",
  [CancellationReason.DUPLICATE_ORDER]: "Tekrarlanan sipariş",
  [CancellationReason.DELIVERY_TOO_LONG]: "Teslimat süresi uzun",
  [CancellationReason.PRICE_ISSUES]: "Fiyat sorunları",
  [CancellationReason.RESTAURANT_CLOSED]: "Restoran kapalı",
  [CancellationReason.OUT_OF_STOCK]: "Ürün(ler) tükendi",
  [CancellationReason.OTHER]: "Diğer"
};

enum CancellationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  AUTO_APPROVED = "AUTO_APPROVED",
}

const statusLabels: Record<CancellationStatus, string> = {
  [CancellationStatus.PENDING]: "Beklemede",
  [CancellationStatus.APPROVED]: "Onaylandı",
  [CancellationStatus.REJECTED]: "Reddedildi",
  [CancellationStatus.AUTO_APPROVED]: "Otomatik Onaylandı"
};

const statusColors: Record<CancellationStatus, { bg: string, text: string }> = {
  [CancellationStatus.PENDING]: { bg: "bg-yellow-100", text: "text-yellow-800" },
  [CancellationStatus.APPROVED]: { bg: "bg-green-100", text: "text-green-800" },
  [CancellationStatus.REJECTED]: { bg: "bg-red-100", text: "text-red-800" },
  [CancellationStatus.AUTO_APPROVED]: { bg: "bg-blue-100", text: "text-blue-800" }
};

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  items: OrderItem[];
  customer: Customer;
}

interface CancellationRequest {
  id: string;
  orderId: string;
  order: Order;
  status: CancellationStatus;
  reason: CancellationReason;
  otherReason?: string;
  customerNotes?: string;
  businessNotes?: string;
  cancellationFee?: number;
  createdAt: string;
  updatedAt: string;
  autoApproved?: boolean;
}

export default function CancellationRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<CancellationRequest | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<CancellationStatus | "ALL">("ALL");
  const [dateRangeStart, setDateRangeStart] = useState<string>("");
  const [dateRangeEnd, setDateRangeEnd] = useState<string>("");
  
  // For testing while the API is being developed
  const useMockData = process.env.NODE_ENV === "development";
  
  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (useMockData) {
        // This is mock data for development
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
        
        const mockRequests: CancellationRequest[] = [
          {
            id: "1",
            orderId: "order1",
            status: CancellationStatus.PENDING,
            reason: CancellationReason.CUSTOMER_CHANGED_MIND,
            customerNotes: "Siparişimi yanlış verdim.",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            order: {
              id: "order1",
              orderNumber: "SP12345",
              status: "PROCESSING",
              totalPrice: 120.50,
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
              items: [
                { id: "item1", name: "Döner Dürüm", quantity: 2, price: 45.00 },
                { id: "item2", name: "Ayran", quantity: 2, price: 15.25 }
              ],
              customer: {
                id: "cust1",
                name: "Ahmet Yılmaz",
                email: "ahmet@example.com",
                phone: "05551234567"
              }
            }
          },
          {
            id: "2",
            orderId: "order2",
            status: CancellationStatus.APPROVED,
            reason: CancellationReason.OUT_OF_STOCK,
            businessNotes: "Ürünlerimiz tükendi, iptal talebi onaylandı.",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(), // 23 hours ago
            order: {
              id: "order2",
              orderNumber: "SP12346",
              status: "CANCELLED",
              totalPrice: 85.00,
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(), // 25 hours ago
              items: [
                { id: "item3", name: "Lahmacun", quantity: 5, price: 17.00 }
              ],
              customer: {
                id: "cust2",
                name: "Zeynep Kaya",
                email: "zeynep@example.com"
              }
            }
          },
          {
            id: "3",
            orderId: "order3",
            status: CancellationStatus.REJECTED,
            reason: CancellationReason.CUSTOMER_CHANGED_MIND,
            customerNotes: "Başka bir yerden sipariş vermek istiyorum.",
            businessNotes: "Siparişiniz hazırlanmaya başladığı için iptal edilemez.",
            cancellationFee: 10.00,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(), // 47 hours ago
            order: {
              id: "order3",
              orderNumber: "SP12347",
              status: "PREPARING",
              totalPrice: 150.75,
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 49).toISOString(), // 49 hours ago
              items: [
                { id: "item4", name: "İskender", quantity: 1, price: 120.00 },
                { id: "item5", name: "Şalgam", quantity: 1, price: 15.75 },
                { id: "item6", name: "Künefe", quantity: 1, price: 15.00 }
              ],
              customer: {
                id: "cust3",
                name: "Mehmet Demir",
                email: "mehmet@example.com",
                phone: "05559876543"
              }
            }
          },
          {
            id: "4",
            orderId: "order4",
            status: CancellationStatus.AUTO_APPROVED,
            reason: CancellationReason.DELIVERY_TOO_LONG,
            customerNotes: "Siparişim çok gecikti.",
            autoApproved: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
            order: {
              id: "order4",
              orderNumber: "SP12348",
              status: "CANCELLED",
              totalPrice: 200.50,
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(), // 14 hours ago
              items: [
                { id: "item7", name: "Pide Karışık", quantity: 2, price: 100.25 }
              ],
              customer: {
                id: "cust4",
                name: "Ayşe Şen",
                email: "ayse@example.com"
              }
            }
          }
        ];
        
        setRequests(mockRequests);
      } else {
        // Actual API call
        const response = await axios.get("/api/business/cancellation-requests");
        setRequests(response.data);
      }
    } catch (err) {
      console.error("İptal talepleri yüklenirken hata:", err);
      setError("İptal talepleri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRequests();
  }, []);
  
  const handleUpdateRequestStatus = async (
    requestId: string, 
    status: CancellationStatus, 
    notes?: string,
    cancellationFee?: number
  ) => {
    try {
      if (useMockData) {
        // Mock update in development
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        
        setRequests(prevRequests => 
          prevRequests.map(req => 
            req.id === requestId 
              ? { 
                  ...req, 
                  status, 
                  businessNotes: notes || req.businessNotes, 
                  cancellationFee: cancellationFee ?? req.cancellationFee,
                  updatedAt: new Date().toISOString() 
                } 
              : req
          )
        );
        
        const statusMessage = status === CancellationStatus.APPROVED 
          ? "İptal talebi başarıyla onaylandı." 
          : "İptal talebi reddedildi.";
        
        toast.success(statusMessage);
      } else {
        // Actual API call
        await axios.patch(`/api/business/cancellation-requests/${requestId}`, {
          status,
          businessNotes: notes,
          cancellationFee
        });
        
        // Refresh the data
        fetchRequests();
        
        const statusMessage = status === CancellationStatus.APPROVED 
          ? "İptal talebi başarıyla onaylandı." 
          : "İptal talebi reddedildi.";
        
        toast.success(statusMessage);
      }
    } catch (err) {
      console.error("İptal talebi güncellenirken hata:", err);
      toast.error("İptal talebi güncellenirken bir hata oluştu.");
    }
  };
  
  // Filter requests based on search term, status, and date range
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const orderNumberMatch = request.order.orderNumber.toLowerCase().includes(searchLower);
      const customerNameMatch = request.order.customer.name.toLowerCase().includes(searchLower);
      const customerEmailMatch = request.order.customer.email.toLowerCase().includes(searchLower);
      
      const matchesSearch = !searchTerm || 
        orderNumberMatch || 
        customerNameMatch || 
        customerEmailMatch;
      
      // Status filter
      const matchesStatus = statusFilter === "ALL" || request.status === statusFilter;
      
      // Date range filter
      let matchesDateRange = true;
      
      if (dateRangeStart) {
        const startDate = parseISO(dateRangeStart);
        matchesDateRange = matchesDateRange && isAfter(new Date(request.createdAt), startDate);
      }
      
      if (dateRangeEnd) {
        const endDate = parseISO(dateRangeEnd);
        matchesDateRange = matchesDateRange && isBefore(new Date(request.createdAt), endDate);
      }
      
      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }, [requests, searchTerm, statusFilter, dateRangeStart, dateRangeEnd]);
  
  // Format date helper
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: tr });
  };
  
  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount);
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">İptal Talepleri</h1>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Sipariş no veya müşteri bilgisi ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="w-full md:w-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as CancellationStatus | "ALL")}
              >
                <option value="ALL">Tüm durumlar</option>
                <option value={CancellationStatus.PENDING}>Beklemede</option>
                <option value={CancellationStatus.APPROVED}>Onaylandı</option>
                <option value={CancellationStatus.REJECTED}>Reddedildi</option>
                <option value={CancellationStatus.AUTO_APPROVED}>Otomatik Onaylandı</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
          
          {/* Date Range */}
          <div className="w-full md:w-auto flex flex-wrap md:flex-nowrap gap-2">
            <div className="relative w-full md:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
              />
            </div>
            <span className="hidden md:flex items-center px-2 text-gray-500">-</span>
            <div className="relative w-full md:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Requests List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="ml-2 text-gray-600">İptal talepleri yükleniyor...</span>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center p-12 text-red-500">
            <AlertTriangle className="h-6 w-6 mr-2" />
            <span>{error}</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center p-12 text-gray-500">
            {searchTerm || statusFilter !== "ALL" || dateRangeStart || dateRangeEnd ? (
              <div>
                <p className="font-medium">Filtrelere uygun sonuç bulunamadı.</p>
                <p className="mt-1">Lütfen filtreleri değiştirerek tekrar deneyin.</p>
              </div>
            ) : (
              <div>
                <p className="font-medium">Henüz iptal talebi bulunmuyor.</p>
                <p className="mt-1">Müşterileriniz iptal talebi gönderdiğinde burada listelenecektir.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sipariş No
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İptal Sebebi
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Toplam Tutar
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.order.orderNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.order.customer.name}</div>
                      <div className="text-xs text-gray-500">{request.order.customer.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{reasonLabels[request.reason as CancellationReason]}</div>
                      {request.reason === CancellationReason.OTHER && request.otherReason && (
                        <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                          "{request.otherReason}"
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[request.status].bg} ${statusColors[request.status].text}`}>
                        {statusLabels[request.status]}
                      </span>
                      {request.status === CancellationStatus.PENDING && (
                        <div className="text-xs text-gray-500 mt-1">
                          <Clock className="inline-block h-3 w-3 mr-1" />
                          <span>Yanıt bekliyor</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(request.order.totalPrice)}</div>
                      {request.cancellationFee !== undefined && request.cancellationFee > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          İptal ücreti: {formatCurrency(request.cancellationFee)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Detail Modal */}
      {selectedRequest && (
        <CancellationRequestDetail
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdateStatus={handleUpdateRequestStatus}
        />
      )}
    </div>
  );
} 