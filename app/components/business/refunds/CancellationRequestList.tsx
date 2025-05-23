"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Check,
  X,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

// İptal talebi durumları
const requestStatusMap = {
  PENDING: { label: 'Bekliyor', color: 'yellow' },
  APPROVED: { label: 'Onaylandı', color: 'green' },
  REJECTED: { label: 'Reddedildi', color: 'red' },
  AUTO_APPROVED: { label: 'Otomatik Onaylandı', color: 'green' },
};

// İptal nedenleri
const cancellationReasons = {
  CUSTOMER_CHANGED_MIND: 'Müşteri Fikir Değiştirdi',
  DUPLICATE_ORDER: 'Çift Sipariş',
  DELIVERY_TOO_LONG: 'Teslimat Süresi Çok Uzun',
  PRICE_ISSUES: 'Fiyat Sorunları',
  RESTAURANT_CLOSED: 'İşletme Kapalı',
  OUT_OF_STOCK: 'Stokta Yok',
  OTHER: 'Diğer',
};

interface CancellationRequest {
  id: string;
  orderId: string;
  customerId: string;
  businessId: string;
  status: string;
  reason: string;
  otherReason?: string;
  customerNotes?: string;
  businessNotes?: string;
  cancellationFee: number;
  autoProcessed: boolean;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  customer?: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  order?: {
    id: string;
    status: string;
    totalPrice: number;
    createdAt: string;
  };
}

const CancellationRequestList = () => {
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<CancellationRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [actionStatus, setActionStatus] = useState('APPROVED');
  const [cancellationFee, setCancellationFee] = useState('');
  const [businessNotes, setBusinessNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // İptal taleplerini getir
  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/business/cancellation-requests');
      setRequests(response.data.requests);
    } catch (err: any) {
      setError(err.response?.data?.error || 'İptal talepleri yüklenirken bir hata oluştu');
      toast.error('İptal talepleri yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Component yüklendiğinde talepleri getir
  useEffect(() => {
    fetchRequests();
  }, []);

  // Talebi görüntüle
  const viewRequestDetails = (request: CancellationRequest) => {
    setSelectedRequest(request);
    setIsDetailOpen(true);
  };

  // İşlem diyaloğunu aç
  const openProcessDialog = (request: CancellationRequest) => {
    setSelectedRequest(request);
    setActionStatus('APPROVED');
    setCancellationFee(request.cancellationFee.toString());
    setBusinessNotes('');
    setIsProcessDialogOpen(true);
  };

  // İptal talebini işle
  const processCancellationRequest = async () => {
    if (!selectedRequest) return;

    setIsSubmitting(true);
    try {
      const requestData = {
        status: actionStatus,
        businessNotes,
        cancellationFee: parseFloat(cancellationFee) || 0
      };

      await axios.patch(`/api/business/cancellation-requests/${selectedRequest.id}`, requestData);
      
      toast.success(`İptal talebi ${requestStatusMap[actionStatus as keyof typeof requestStatusMap].label.toLowerCase()} olarak işaretlendi`);
      
      setIsProcessDialogOpen(false);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'İptal talebi işlenirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Para birimini formatla
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  // Duruma göre badge rengi
  const getStatusBadge = (status: string) => {
    const statusInfo = requestStatusMap[status as keyof typeof requestStatusMap];
    if (!statusInfo) return <Badge>Bilinmiyor</Badge>;

    return (
      <Badge variant={statusInfo.color as any}>{statusInfo.label}</Badge>
    );
  };

  // Yüklenirken gösterilecek içerik
  if (isLoading && requests.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={`skeleton-${i}`}>
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Hata durumunda gösterilecek içerik
  if (error && requests.length === 0) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Hata Oluştu
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={fetchRequests} variant="outline" size="sm">
            Yeniden Dene
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Talep yoksa gösterilecek içerik
  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>İptal Talepleri</CardTitle>
          <CardDescription>
            Henüz bekleyen iptal talebi bulunmuyor
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-primary/10 p-3 mb-4">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium">Talep yok</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-2">
            Şu anda işlenmemiş iptal talebi bulunmuyor. Müşterileriniz iptal talebinde bulunduğunda burada görüntüleyebilirsiniz.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {`Sipariş #${request.orderId.slice(0, 8)}`}
                  </CardTitle>
                  <CardDescription>
                    {request.customer?.user?.name} tarafından {format(new Date(request.createdAt), 'PPP', { locale: tr })} tarihinde
                  </CardDescription>
                </div>
                {getStatusBadge(request.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Neden</h4>
                  <p className="text-sm text-muted-foreground">
                    {cancellationReasons[request.reason as keyof typeof cancellationReasons]}
                    {request.otherReason && `: ${request.otherReason}`}
                  </p>
                </div>
                {request.cancellationFee > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">İptal Ücreti</h4>
                    <p className="text-sm font-semibold flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                      {formatCurrency(request.cancellationFee)}
                    </p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium mb-1">Durum</h4>
                  <p className="text-sm">
                    {request.status === 'PENDING' ? (
                      <span className="flex items-center text-yellow-600">
                        <Clock className="h-4 w-4 mr-1" />
                        Yanıt bekleniyor
                      </span>
                    ) : request.status === 'APPROVED' || request.status === 'AUTO_APPROVED' ? (
                      <span className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {request.autoProcessed ? 'Otomatik onaylandı' : 'Onaylandı'}
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600">
                        <XCircle className="h-4 w-4 mr-1" />
                        Reddedildi
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-0">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => viewRequestDetails(request)}>
                  Detaylar
                </Button>
                {request.status === 'PENDING' && (
                  <Button size="sm" onClick={() => openProcessDialog(request)}>
                    İşlem Yap
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Detay Diyaloğu */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              İptal Talebi Detayları
            </DialogTitle>
            <DialogDescription>
              Sipariş #{selectedRequest?.orderId.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Genel Bilgiler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Talep Bilgileri</h4>
                  <ul className="text-sm space-y-2">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Durum:</span>
                      <span>{getStatusBadge(selectedRequest.status)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Talep Tarihi:</span>
                      <span>{format(new Date(selectedRequest.createdAt), 'PPP', { locale: tr })}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Sipariş Tarihi:</span>
                      <span>{format(new Date(selectedRequest.order?.createdAt || ''), 'PPP', { locale: tr })}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Neden:</span>
                      <span>{cancellationReasons[selectedRequest.reason as keyof typeof cancellationReasons]}</span>
                    </li>
                    {selectedRequest.otherReason && (
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Diğer Neden:</span>
                        <span>{selectedRequest.otherReason}</span>
                      </li>
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Müşteri ve Sipariş Bilgileri</h4>
                  <ul className="text-sm space-y-2">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Müşteri:</span>
                      <span>{selectedRequest.customer?.user?.name}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">E-posta:</span>
                      <span>{selectedRequest.customer?.user?.email}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Sipariş Tutarı:</span>
                      <span>{formatCurrency(selectedRequest.order?.totalPrice || 0)}</span>
                    </li>
                    {selectedRequest.cancellationFee > 0 && (
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">İptal Ücreti:</span>
                        <span>{formatCurrency(selectedRequest.cancellationFee)}</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Notlar */}
              <div className="space-y-4">
                {selectedRequest.customerNotes && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Müşteri Notu</h4>
                    <div className="p-3 bg-gray-50 rounded-md text-sm">
                      {selectedRequest.customerNotes}
                    </div>
                  </div>
                )}
                
                {selectedRequest.businessNotes && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">İşletme Notu</h4>
                    <div className="p-3 bg-gray-50 rounded-md text-sm">
                      {selectedRequest.businessNotes}
                    </div>
                  </div>
                )}
              </div>

              {/* İşlem Bilgileri */}
              <div>
                <h4 className="text-sm font-medium mb-2">İşlem Bilgileri</h4>
                <ul className="text-sm space-y-2">
                  {selectedRequest.autoProcessed && (
                    <li className="flex items-center text-blue-600">
                      <Badge variant="outline" className="mr-2">Otomatik</Badge>
                      Bu talep sistem tarafından otomatik işlenmiştir.
                    </li>
                  )}
                  {selectedRequest.cancelledAt && (
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">İptal Tarihi:</span>
                      <span>{format(new Date(selectedRequest.cancelledAt), 'PPP', { locale: tr })}</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* İşlem Diyaloğu */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İptal Talebini İşle</DialogTitle>
            <DialogDescription>
              Sipariş #{selectedRequest?.orderId.slice(0, 8)} için iptal talebi
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
              <Select value={actionStatus} onValueChange={setActionStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVED">Onayla</SelectItem>
                  <SelectItem value="REJECTED">Reddet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {actionStatus === 'APPROVED' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">İptal Ücreti (varsa)</label>
                <Input 
                  type="number"
                  value={cancellationFee}
                  onChange={(e) => setCancellationFee(e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="İptal ücreti"
                />
                <p className="text-xs text-muted-foreground">
                  Müşteriden alınacak iptal ücreti (0 değeri, ücretsiz iptal anlamına gelir)
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">İşletme Notu (Müşteriye görünecek)</label>
              <Textarea 
                value={businessNotes}
                onChange={(e) => setBusinessNotes(e.target.value)}
                placeholder="İşleme dair bir not ekleyin (isteğe bağlı)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProcessDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={processCancellationRequest} disabled={isSubmitting}>
              {isSubmitting ? 'İşleniyor...' : 'Onayla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CancellationRequestList; 