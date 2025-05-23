"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Image from "next/image";
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
  DollarSign,
  ImageIcon,
  Package
} from "lucide-react";
import { toast } from "react-hot-toast";

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

const statusColors: Record<RefundStatus, { bg: string, text: string, icon: JSX.Element }> = {
  [RefundStatus.PENDING]: { 
    bg: "bg-yellow-100", 
    text: "text-yellow-800", 
    icon: <Clock className="h-5 w-5 text-yellow-500" /> 
  },
  [RefundStatus.APPROVED]: { 
    bg: "bg-green-100", 
    text: "text-green-800", 
    icon: <CheckCircle className="h-5 w-5 text-green-500" /> 
  },
  [RefundStatus.PARTIAL_APPROVED]: { 
    bg: "bg-blue-100", 
    text: "text-blue-800", 
    icon: <CheckCircle className="h-5 w-5 text-blue-500" /> 
  },
  [RefundStatus.REJECTED]: { 
    bg: "bg-red-100", 
    text: "text-red-800", 
    icon: <XCircle className="h-5 w-5 text-red-500" /> 
  },
  [RefundStatus.AUTO_APPROVED]: { 
    bg: "bg-teal-100", 
    text: "text-teal-800", 
    icon: <CheckCircle className="h-5 w-5 text-teal-500" /> 
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

interface RefundRequestDetailProps {
  request: RefundRequest;
  onClose: () => void;
  onUpdateStatus: (requestId: string, status: RefundStatus, notes?: string, approvedRefundAmount?: number) => void;
}

export default function RefundRequestDetail({
  request,
  onClose,
  onUpdateStatus
}: RefundRequestDetailProps) {
  const [businessNotes, setBusinessNotes] = useState(request.businessNotes || "");
  const [approveType, setApproveType] = useState<"FULL" | "PARTIAL">("FULL");
  const [approvedRefundAmount, setApprovedRefundAmount] = useState(
    request.approvedRefundAmount || request.totalRefundAmount
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMMM yyyy, HH:mm", { locale: tr });
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount);
  };
  
  const handleStatusUpdate = async (status: RefundStatus) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Calculate final approved amount
      let finalApprovedAmount = undefined;
      if (status === RefundStatus.APPROVED) {
        finalApprovedAmount = request.totalRefundAmount;
      } else if (status === RefundStatus.PARTIAL_APPROVED) {
        finalApprovedAmount = approvedRefundAmount;
      } else if (status === RefundStatus.REJECTED) {
        finalApprovedAmount = 0;
      }
      
      // Send request
      await onUpdateStatus(
        request.id, 
        status, 
        businessNotes.trim() || undefined, 
        finalApprovedAmount
      );
      
      // Close the modal after success
      onClose();
      
    } catch (error) {
      console.error("İade talebi güncellenirken hata:", error);
      toast.error("İade talebi güncellenirken bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
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
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex justify-between items-start">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      İade Talebi Detayı - #{request.order.orderNumber}
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Left column - Customer and Order Details */}
                      <div className="col-span-1">
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
                        
                        {/* Refund Request Details */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                            İade Talebi Bilgileri
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
                              <span className="text-gray-500 text-sm min-w-28">İade Sebebi:</span>
                              <span className="text-gray-900 text-sm">{reasonLabels[request.reason as RefundReason]}</span>
                            </div>
                            
                            {request.reason === RefundReason.OTHER && request.otherReason && (
                              <div className="flex items-start">
                                <span className="text-gray-500 text-sm min-w-28">Diğer Sebep:</span>
                                <span className="text-gray-900 text-sm">"{request.otherReason}"</span>
                              </div>
                            )}
                            
                            <div className="flex items-start">
                              <span className="text-gray-500 text-sm min-w-28">Talep Tutarı:</span>
                              <span className="text-gray-900 text-sm font-medium">{formatCurrency(request.totalRefundAmount)}</span>
                            </div>
                            
                            {request.approvedRefundAmount !== undefined && (
                              <div className="flex items-start">
                                <span className="text-gray-500 text-sm min-w-28">Onaylanan:</span>
                                <span className="text-gray-900 text-sm font-medium">{formatCurrency(request.approvedRefundAmount)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Middle column - Refund Items */}
                      <div className="col-span-1">
                        <div className="bg-gray-50 rounded-lg p-4 h-full">
                          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                            <Package className="h-4 w-4 mr-1 text-gray-500" />
                            İade Edilen Ürünler
                          </h4>
                          
                          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                            {request.refundItems.map((item) => (
                              <div key={item.orderItemId} className="bg-white p-3 rounded border border-gray-200">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{item.orderItem.name}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      <span className="font-medium">Adet: </span>
                                      <span>{item.quantity} / {item.orderItem.quantity}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      <span className="font-medium">Sebep: </span>
                                      <span className="text-gray-900">{item.reason}</span>
                                    </div>
                                  </div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatCurrency(item.orderItem.price * item.quantity)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Right column - Evidence Images and Action Buttons */}
                      <div className="col-span-1">
                        {/* Customer Notes */}
                        {request.customerNotes && (
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                              Müşteri Notu
                            </h4>
                            <div className="bg-white p-3 rounded border border-gray-200 text-sm text-gray-900">
                              {request.customerNotes}
                            </div>
                          </div>
                        )}
                        
                        {/* Evidence Images */}
                        {request.evidenceUrls && request.evidenceUrls.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                              <ImageIcon className="h-4 w-4 mr-1 text-gray-500" />
                              Kanıt Görselleri
                            </h4>
                            
                            <div className="grid grid-cols-2 gap-2">
                              {request.evidenceUrls.map((url, index) => (
                                <button
                                  key={index}
                                  className="relative h-24 bg-gray-100 rounded border border-gray-200 overflow-hidden"
                                  onClick={() => setSelectedImageUrl(url)}
                                >
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Image
                                      src={url}
                                      alt={`Kanıt ${index + 1}`}
                                      fill
                                      sizes="(max-width: 768px) 100vw, 33vw"
                                      className="object-cover"
                                    />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Action Panel for Pending Requests */}
                        {request.status === RefundStatus.PENDING && (
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">
                              İade Talebini Değerlendir
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
                              
                              {/* Approval Type */}
                              <div className="space-y-2">
                                <div className="text-sm font-medium text-gray-700 mb-1">
                                  İade Tipi
                                </div>
                                <div className="flex space-x-4">
                                  <div className="flex items-center">
                                    <input
                                      id="full-refund"
                                      name="refund-type"
                                      type="radio"
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                      checked={approveType === "FULL"}
                                      onChange={() => {
                                        setApproveType("FULL");
                                        setApprovedRefundAmount(request.totalRefundAmount);
                                      }}
                                    />
                                    <label htmlFor="full-refund" className="ml-2 block text-sm text-gray-900">
                                      Tam İade ({formatCurrency(request.totalRefundAmount)})
                                    </label>
                                  </div>
                                  <div className="flex items-center">
                                    <input
                                      id="partial-refund"
                                      name="refund-type"
                                      type="radio"
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                      checked={approveType === "PARTIAL"}
                                      onChange={() => {
                                        setApproveType("PARTIAL");
                                      }}
                                    />
                                    <label htmlFor="partial-refund" className="ml-2 block text-sm text-gray-900">
                                      Kısmi İade
                                    </label>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Approved Amount (for partial refunds) */}
                              {approveType === "PARTIAL" && (
                                <div>
                                  <label htmlFor="approvedAmount" className="block text-sm font-medium text-gray-700 mb-1">
                                    Onaylanan İade Tutarı (TL)
                                  </label>
                                  <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                      <span className="text-gray-500 sm:text-sm">₺</span>
                                    </div>
                                    <input
                                      type="number"
                                      name="approvedAmount"
                                      id="approvedAmount"
                                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-8 pr-12 sm:text-sm border-gray-300 rounded-md"
                                      placeholder="0.00"
                                      min="0"
                                      max={request.totalRefundAmount}
                                      step="0.01"
                                      value={approvedRefundAmount}
                                      onChange={(e) => setApprovedRefundAmount(parseFloat(e.target.value) || 0)}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                      <span className="text-gray-500 sm:text-sm">TL</span>
                                    </div>
                                  </div>
                                  <p className="mt-1 text-xs text-gray-500">
                                    Maksimum iade tutarı: {formatCurrency(request.totalRefundAmount)}
                                  </p>
                                </div>
                              )}
                              
                              {/* Action Buttons */}
                              <div className="flex space-x-3 mt-6">
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                  onClick={() => handleStatusUpdate(RefundStatus.REJECTED)}
                                  disabled={isSubmitting}
                                >
                                  <XCircle className="h-4 w-4 mr-1.5" />
                                  Reddet
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                  onClick={() => handleStatusUpdate(
                                    approveType === "FULL" ? RefundStatus.APPROVED : RefundStatus.PARTIAL_APPROVED
                                  )}
                                  disabled={isSubmitting}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1.5" />
                                  {approveType === "FULL" ? "Tam Onayla" : "Kısmi Onayla"}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* View Business Notes for non-pending requests */}
                        {request.status !== RefundStatus.PENDING && request.businessNotes && (
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
      
      {/* Full image modal */}
      {selectedImageUrl && (
        <Transition appear show={true} as={Fragment}>
          <Dialog as="div" className="relative z-20" onClose={() => setSelectedImageUrl(null)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/80" />
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
                  <Dialog.Panel className="relative w-full max-w-3xl transform overflow-hidden transition-all">
                    <button
                      type="button"
                      className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                      onClick={() => setSelectedImageUrl(null)}
                    >
                      <X className="h-8 w-8" />
                    </button>
                    
                    <div className="relative h-[70vh]">
                      <Image
                        src={selectedImageUrl}
                        alt="Kanıt görseli"
                        fill
                        sizes="100vw"
                        className="object-contain"
                      />
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      )}
    </>
  );
} 