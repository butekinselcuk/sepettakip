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
  Eye,
  DollarSign
} from "lucide-react";
import { toast } from "react-hot-toast";
import RefundRequestDetail from "@/app/components/business/RefundRequestDetail";

enum RefundReason {
  DAMAGED_PRODUCT = "DAMAGED_PRODUCT",
  WRONG_PRODUCT = "WRONG_PRODUCT",
  QUALITY_ISSUES = "QUALITY_ISSUES",
  LATE_DELIVERY = "LATE_DELIVERY",
  MISSING_ITEMS = "MISSING_ITEMS",
  OTHER = "OTHER"
}

const reasonLabels: Record<RefundReason, string> = {
  [RefundReason.DAMAGED_PRODUCT]: "Hasarlı ürün",
  [RefundReason.WRONG_PRODUCT]: "Yanlış ürün",
  [RefundReason.QUALITY_ISSUES]: "Kalite sorunları",
  [RefundReason.LATE_DELIVERY]: "Geç teslimat",
  [RefundReason.MISSING_ITEMS]: "Eksik ürünler",
  [RefundReason.OTHER]: "Diğer"
};

enum RefundStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  PARTIAL_APPROVED = "PARTIAL_APPROVED",
  REJECTED = "REJECTED",
  AUTO_APPROVED = "AUTO_APPROVED",
}

const statusLabels: Record<RefundStatus, string> = {
  [RefundStatus.PENDING]: "Beklemede",
  [RefundStatus.APPROVED]: "Onaylandı (Tam)",
  [RefundStatus.PARTIAL_APPROVED]: "Onaylandı (Kısmi)",
  [RefundStatus.REJECTED]: "Reddedildi",
  [RefundStatus.AUTO_APPROVED]: "Otomatik Onaylandı"
};

const statusColors: Record<RefundStatus, { bg: string, text: string }> = {
  [RefundStatus.PENDING]: { bg: "bg-yellow-100", text: "text-yellow-800" },
  [RefundStatus.APPROVED]: { bg: "bg-green-100", text: "text-green-800" },
  [RefundStatus.PARTIAL_APPROVED]: { bg: "bg-blue-100", text: "text-blue-800" },
  [RefundStatus.REJECTED]: { bg: "bg-red-100", text: "text-red-800" },
  [RefundStatus.AUTO_APPROVED]: { bg: "bg-teal-100", text: "text-teal-800" }
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

interface RefundItem {
  orderItemId: string;
  orderItem: OrderItem;
  quantity: number;
  reason: string;
}

interface RefundRequest {
  id: string;
  orderId: string;
  order: Order;
  status: RefundStatus;
  reason: RefundReason;
  otherReason?: string;
  customerNotes?: string;
  businessNotes?: string;
  refundItems: RefundItem[];
  totalRefundAmount: number;
  approvedRefundAmount?: number;
  evidenceUrls?: string[];
  createdAt: string;
  updatedAt: string;
  autoApproved?: boolean;
}

export default function RefundRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<RefundStatus | "ALL">("ALL");
  const [dateRangeStart, setDateRangeStart] = useState<string>("");
  const [dateRangeEnd, setDateRangeEnd] = useState<string>("");
  
  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Actual API call
      const response = await axios.get("/api/business/refund-requests");
      setRequests(response.data);
    } catch (err) {
      console.error("İade talepleri yüklenirken hata:", err);
      setError("İade talepleri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRequests();
  }, []);
  
  const handleUpdateRequestStatus = async (
    requestId: string, 
    status: RefundStatus, 
    notes?: string,
    approvedRefundAmount?: number
  ) => {
    try {
      // Actual API call
      await axios.patch(`/api/business/refund-requests/${requestId}`, {
        status,
        businessNotes: notes,
        approvedRefundAmount
      });
      
      // Refresh the data
      fetchRequests();
      
      let statusMessage = "";
      if (status === RefundStatus.APPROVED) {
        statusMessage = "İade talebi tam olarak onaylandı.";
      } else if (status === RefundStatus.PARTIAL_APPROVED) {
        statusMessage = "İade talebi kısmi olarak onaylandı.";
      } else {
        statusMessage = "İade talebi reddedildi.";
      }
      
      toast.success(statusMessage);
    } catch (err) {
      console.error("İade talebi güncellenirken hata:", err);
      toast.error("İade talebi güncellenirken bir hata oluştu.");
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">İade Talepleri</h1>
      
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
                onChange={(e) => setStatusFilter(e.target.value as RefundStatus | "ALL")}
              >
                <option value="ALL">Tüm durumlar</option>
                <option value={RefundStatus.PENDING}>Beklemede</option>
                <option value={RefundStatus.APPROVED}>Onaylandı (Tam)</option>
                <option value={RefundStatus.PARTIAL_APPROVED}>Onaylandı (Kısmi)</option>
                <option value={RefundStatus.REJECTED}>Reddedildi</option>
                <option value={RefundStatus.AUTO_APPROVED}>Otomatik Onaylandı</option>
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
            <span className="ml-2 text-gray-600">İade talepleri yükleniyor...</span>
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
                <p className="font-medium">Henüz iade talebi bulunmuyor.</p>
                <p className="mt-1">Müşterileriniz iade talebi gönderdiğinde burada listelenecektir.</p>
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
                    İade Sebebi
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutar
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
                      <div className="text-xs text-gray-500">{request.refundItems.length} ürün</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.order.customer.name}</div>
                      <div className="text-xs text-gray-500">{request.order.customer.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{reasonLabels[request.reason as RefundReason]}</div>
                      {request.reason === RefundReason.OTHER && request.otherReason && (
                        <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                          "{request.otherReason}"
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[request.status].bg} ${statusColors[request.status].text}`}>
                        {statusLabels[request.status]}
                      </span>
                      {request.status === RefundStatus.PENDING && (
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
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(request.totalRefundAmount)}
                      </div>
                      {(request.status === RefundStatus.APPROVED || request.status === RefundStatus.PARTIAL_APPROVED || request.status === RefundStatus.AUTO_APPROVED) && 
                       request.approvedRefundAmount !== undefined && (
                        <div className="text-xs text-gray-500 mt-1">
                          <DollarSign className="inline-block h-3 w-3 mr-1" />
                          Onaylanan: {formatCurrency(request.approvedRefundAmount)}
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
        <RefundRequestDetail
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdateStatus={handleUpdateRequestStatus}
        />
      )}
    </div>
  );
} 