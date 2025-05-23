"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  X, 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  AlertTriangle,
  FileText,
  Clock,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign
} from "lucide-react";
import { toast } from "react-hot-toast";

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

const statusColors: Record<CancellationStatus, { bg: string, text: string, icon: JSX.Element }> = {
  [CancellationStatus.PENDING]: { 
    bg: "bg-yellow-100", 
    text: "text-yellow-800", 
    icon: <Clock className="h-5 w-5 text-yellow-500" /> 
  },
  [CancellationStatus.APPROVED]: { 
    bg: "bg-green-100", 
    text: "text-green-800", 
    icon: <CheckCircle className="h-5 w-5 text-green-500" /> 
  },
  [CancellationStatus.REJECTED]: { 
    bg: "bg-red-100", 
    text: "text-red-800", 
    icon: <XCircle className="h-5 w-5 text-red-500" /> 
  },
  [CancellationStatus.AUTO_APPROVED]: { 
    bg: "bg-blue-100", 
    text: "text-blue-800", 
    icon: <CheckCircle className="h-5 w-5 text-blue-500" /> 
  }
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

interface CancellationRequestDetailProps {
  request: CancellationRequest;
  onClose: () => void;
  onUpdateStatus: (requestId: string, status: CancellationStatus, notes?: string, cancellationFee?: number) => void;
}

export default function CancellationRequestDetail({
  request,
  onClose,
  onUpdateStatus
}: CancellationRequestDetailProps) {
  const [businessNotes, setBusinessNotes] = useState(request.businessNotes || "");
  const [cancellationFee, setCancellationFee] = useState(request.cancellationFee || 0);
  const [isApplyCancellationFee, setIsApplyCancellationFee] = useState(request.cancellationFee !== undefined && request.cancellationFee > 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMMM yyyy, HH:mm", { locale: tr });
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount);
  };
  
  const handleStatusUpdate = async (status: CancellationStatus) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Calculate cancellation fee if needed
      const finalCancellationFee = isApplyCancellationFee ? cancellationFee : 0;
      
      // Send request
      await onUpdateStatus(
        request.id, 
        status, 
        businessNotes.trim() || undefined, 
        isApplyCancellationFee ? finalCancellationFee : undefined
      );
      
      // Close the modal after success
      onClose();
      
    } catch (error) {
      console.error("İptal talebi güncellenirken hata:", error);
      toast.error("İptal talebi güncellenirken bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-start">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    İptal Talebi Detayı - #{request.order.orderNumber}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Kapat</span>
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="mt-4">
                  {/* Status badge */}
                  <div className="flex items-center mb-6">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${statusColors[request.status].bg} ${statusColors[request.status].text}`}>
                      {statusColors[request.status].icon}
                      <span className="ml-1.5">{statusLabels[request.status]}</span>
                    </div>
                    
                    {request.autoApproved && (
                      <span className="ml-2 text-sm text-gray-500">
                        (Otomatik onaylandı)
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left column - Customer and Order Details */}
                    <div>
                      {/* Customer Information */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                          <User className="h-4 w-4 mr-1 text-gray-500" />
                          Müşteri Bilgileri
                        </h4>
                        
                        <div className="space-y-2">
                          <div className="flex items-start">
                            <span className="text-gray-500 text-sm min-w-28">İsim:</span>
                            <span className="text-gray-900 text-sm font-medium">{request.order.customer.name}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 text-sm min-w-28">E-posta:</span>
                            <span className="text-gray-900 text-sm">{request.order.customer.email}</span>
                          </div>
                          {request.order.customer.phone && (
                            <div className="flex items-start">
                              <span className="text-gray-500 text-sm min-w-28">Telefon:</span>
                              <span className="text-gray-900 text-sm">{request.order.customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Order Information */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                          <FileText className="h-4 w-4 mr-1 text-gray-500" />
                          Sipariş Bilgileri
                        </h4>
                        
                        <div className="space-y-2">
                          <div className="flex items-start">
                            <span className="text-gray-500 text-sm min-w-28">Sipariş No:</span>
                            <span className="text-gray-900 text-sm font-medium">{request.order.orderNumber}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 text-sm min-w-28">Toplam Tutar:</span>
                            <span className="text-gray-900 text-sm font-medium">{formatCurrency(request.order.totalPrice)}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 text-sm min-w-28">Sipariş Tarihi:</span>
                            <span className="text-gray-900 text-sm">{formatDate(request.order.createdAt)}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 text-sm min-w-28">Sipariş Durumu:</span>
                            <span className="text-gray-900 text-sm">{request.order.status}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Order Items */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          Sipariş Ürünleri
                        </h4>
                        
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                          {request.order.items.map((item) => (
                            <div key={item.id} className="flex justify-between border-b border-gray-200 pb-2 last:border-b-0 last:pb-0">
                              <div className="flex items-start">
                                <span className="text-gray-900 text-sm font-medium">{item.quantity}x</span>
                                <span className="text-gray-900 text-sm ml-2">{item.name}</span>
                              </div>
                              <span className="text-gray-900 text-sm font-medium">
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Right column - Cancellation Details and Actions */}
                    <div>
                      {/* Cancellation Request Details */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                          <XCircle className="h-4 w-4 mr-1 text-gray-500" />
                          İptal Talebi Detayları
                        </h4>
                        
                        <div className="space-y-2">
                          <div className="flex items-start">
                            <span className="text-gray-500 text-sm min-w-28">Talep Tarihi:</span>
                            <span className="text-gray-900 text-sm">{formatDate(request.createdAt)}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 text-sm min-w-28">Son Güncelleme:</span>
                            <span className="text-gray-900 text-sm">{formatDate(request.updatedAt)}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 text-sm min-w-28">İptal Sebebi:</span>
                            <span className="text-gray-900 text-sm">{reasonLabels[request.reason as CancellationReason]}</span>
                          </div>
                          
                          {request.reason === CancellationReason.OTHER && request.otherReason && (
                            <div className="flex items-start">
                              <span className="text-gray-500 text-sm min-w-28">Diğer Sebep:</span>
                              <span className="text-gray-900 text-sm">"{request.otherReason}"</span>
                            </div>
                          )}
                          
                          {request.customerNotes && (
                            <div className="mt-3">
                              <span className="text-gray-500 text-sm block mb-1">Müşteri Notu:</span>
                              <div className="bg-white p-2 rounded border border-gray-200 text-sm text-gray-900">
                                {request.customerNotes}
                              </div>
                            </div>
                          )}
                          
                          {request.cancellationFee !== undefined && request.cancellationFee > 0 && (
                            <div className="flex items-start mt-3">
                              <span className="text-gray-500 text-sm min-w-28">İptal Ücreti:</span>
                              <span className="text-gray-900 text-sm font-medium">{formatCurrency(request.cancellationFee)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Panel for Pending Requests */}
                      {request.status === CancellationStatus.PENDING && (
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">
                            İptal Talebini Değerlendir
                          </h4>
                          
                          <div className="space-y-4">
                            {/* Business Notes */}
                            <div>
                              <label htmlFor="businessNotes" className="block text-sm font-medium text-gray-700 mb-1">
                                İşletme Notu (Opsiyonel)
                              </label>
                              <textarea
                                id="businessNotes"
                                rows={3}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="Talep hakkında notunuzu buraya yazabilirsiniz..."
                                value={businessNotes}
                                onChange={(e) => setBusinessNotes(e.target.value)}
                              />
                            </div>
                            
                            {/* Cancellation Fee */}
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <input
                                  id="apply-fee"
                                  name="apply-fee"
                                  type="checkbox"
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  checked={isApplyCancellationFee}
                                  onChange={(e) => setIsApplyCancellationFee(e.target.checked)}
                                />
                                <label htmlFor="apply-fee" className="ml-2 block text-sm text-gray-900">
                                  İptal ücreti uygula
                                </label>
                              </div>
                              
                              {isApplyCancellationFee && (
                                <div>
                                  <label htmlFor="cancellationFee" className="block text-sm font-medium text-gray-700 mb-1">
                                    İptal Ücreti (TL)
                                  </label>
                                  <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                      <span className="text-gray-500 sm:text-sm">₺</span>
                                    </div>
                                    <input
                                      type="number"
                                      name="cancellationFee"
                                      id="cancellationFee"
                                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-8 pr-12 sm:text-sm border-gray-300 rounded-md"
                                      placeholder="0.00"
                                      min="0"
                                      step="0.01"
                                      value={cancellationFee}
                                      onChange={(e) => setCancellationFee(parseFloat(e.target.value) || 0)}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                      <span className="text-gray-500 sm:text-sm">TL</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex space-x-3 mt-6">
                              <button
                                type="button"
                                className="inline-flex items-center justify-center flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                onClick={() => handleStatusUpdate(CancellationStatus.REJECTED)}
                                disabled={isSubmitting}
                              >
                                <XCircle className="h-4 w-4 mr-1.5" />
                                Reddet
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center justify-center flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                onClick={() => handleStatusUpdate(CancellationStatus.APPROVED)}
                                disabled={isSubmitting}
                              >
                                <CheckCircle className="h-4 w-4 mr-1.5" />
                                Onayla
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* View Business Notes for non-pending requests */}
                      {request.status !== CancellationStatus.PENDING && request.businessNotes && (
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            İşletme Notu
                          </h4>
                          <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm text-gray-900">
                            {request.businessNotes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 