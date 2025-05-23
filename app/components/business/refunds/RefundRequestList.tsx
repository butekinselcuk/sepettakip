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
  HelpCircle,
  Image,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

// İade talebi durumları
const requestStatusMap = {
  PENDING: { label: 'Bekliyor', color: 'yellow' },
  APPROVED: { label: 'Onaylandı', color: 'green' },
  PARTIAL_APPROVED: { label: 'Kısmen Onaylandı', color: 'blue' },
  REJECTED: { label: 'Reddedildi', color: 'red' },
  AUTO_APPROVED: { label: 'Otomatik Onaylandı', color: 'green' },
  CANCELLED: { label: 'İptal Edildi', color: 'gray' },
};

// İade nedenleri
const refundReasons = {
  DAMAGED_PRODUCT: 'Hasarlı Ürün',
  WRONG_PRODUCT: 'Yanlış Ürün',
  PRODUCT_NOT_AS_DESCRIBED: 'Ürün Açıklandığı Gibi Değil',
  MISSING_ITEMS: 'Eksik Ürünler',
  LATE_DELIVERY: 'Geç Teslimat',
  QUALITY_ISSUES: 'Kalite Sorunları',
  OTHER: 'Diğer',
};

interface RefundRequest {
  id: string;
  orderId: string;
  customerId: string;
  status: string;
  reason: string;
  otherReason?: string;
  customerNotes?: string;
  businessNotes?: string;
  requestedItems?: any[];
  refundAmount: number;
  approvedAmount?: number;
  evidenceUrls?: string[];
  createdAt: string;
  updatedAt: string;
  refundedAt?: string;
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

const RefundRequestList = () => {
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [actionStatus, setActionStatus] = useState('APPROVED');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [businessNotes, setBusinessNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // İade taleplerini getir
  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/business/refund-requests');
      setRequests(response.data.requests);
    } catch (err: any) {
      setError(err.response?.data?.error || 'İade talepleri yüklenirken bir hata oluştu');
      toast.error('İade talepleri yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Component yüklendiğinde talepleri getir
  useEffect(() => {
    fetchRequests();
  }, []);

  // Talebi görüntüle
  const viewRequestDetails = (request: RefundRequest) => {
    setSelectedRequest(request);
    setIsDetailOpen(true);
  };

  // İşlem diyaloğunu aç
  const openProcessDialog = (request: RefundRequest) => {
    setSelectedRequest(request);
    setActionStatus('APPROVED');
    setApprovedAmount(request.refundAmount.toString());
    setBusinessNotes('');
    setIsProcessDialogOpen(true);
  };

  // İade talebini işle
  const processRefundRequest = async () => {
    if (!selectedRequest) return;

    setIsSubmitting(true);
    try {
      const requestData = {
        status: actionStatus,
        businessNotes,
        approvedAmount: actionStatus === 'APPROVED' || actionStatus === 'PARTIAL_APPROVED' 
          ? parseFloat(approvedAmount) 
          : undefined
      };

      await axios.patch(`/api/business/refund-requests/${selectedRequest.id}`, requestData);
      
      toast.success(`İade talebi ${requestStatusMap[actionStatus as keyof typeof requestStatusMap].label.toLowerCase()} olarak işaretlendi`);
      
      setIsProcessDialogOpen(false);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'İade talebi işlenirken bir hata oluştu');
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
          <CardTitle>İade Talepleri</CardTitle>
          <CardDescription>
            Henüz bekleyen iade talebi bulunmuyor
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-primary/10 p-3 mb-4">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium">Talep yok</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-2">
            Şu anda işlenmemiş iade talebi bulunmuyor. Müşterileriniz iade talebinde bulunduğunda burada görüntüleyebilirsiniz.
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
                    {refundReasons[request.reason as keyof typeof refundReasons]}
                    {request.otherReason && `: ${request.otherReason}`}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Talep Edilen</h4>
                  <p className="text-sm font-semibold">
                    {formatCurrency(request.refundAmount)}
                  </p>
                </div>
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
                        {formatCurrency(request.approvedAmount || request.refundAmount)} onaylandı
                      </span>
                    ) : request.status === 'PARTIAL_APPROVED' ? (
                      <span className="flex items-center text-blue-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {formatCurrency(request.approvedAmount || 0)} kısmen onaylandı
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
              İade Talebi Detayları
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
                      <span>{refundReasons[selectedRequest.reason as keyof typeof refundReasons]}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Müşteri Bilgileri</h4>
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
                      <span className="text-muted-foreground">Talep Edilen:</span>
                      <span>{formatCurrency(selectedRequest.refundAmount)}</span>
                    </li>
                    {selectedRequest.approvedAmount !== undefined && (
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Onaylanan:</span>
                        <span>{formatCurrency(selectedRequest.approvedAmount)}</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* İade Edilen Ürünler */}
              {selectedRequest.requestedItems && selectedRequest.requestedItems.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">İade Edilen Ürünler</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ürün</TableHead>
                        <TableHead>Miktar</TableHead>
                        <TableHead className="text-right">Fiyat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRequest.requestedItems.map((item: any, index: number) => (
                        <TableRow key={`item-${index}`}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.price * item.quantity)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Kanıtlar */}
              {selectedRequest.evidenceUrls && selectedRequest.evidenceUrls.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Kanıtlar</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedRequest.evidenceUrls.map((url, index) => (
                      <div 
                        key={`evidence-${index}`}
                        className="border rounded-md p-2 flex items-center justify-center"
                      >
                        <a href={url} target="_blank" rel="noopener noreferrer" className="relative group">
                          <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center">
                            <Image className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="absolute inset-0 bg-black/50 rounded opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-white text-xs">Görüntüle</span>
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* İşlem Diyaloğu */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İade Talebini İşle</DialogTitle>
            <DialogDescription>
              Sipariş #{selectedRequest?.orderId.slice(0, 8)} için talep edilen tutar: {selectedRequest && formatCurrency(selectedRequest.refundAmount)}
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
                  <SelectItem value="PARTIAL_APPROVED">Kısmen Onayla</SelectItem>
                  <SelectItem value="REJECTED">Reddet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(actionStatus === 'APPROVED' || actionStatus === 'PARTIAL_APPROVED') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Onaylanan Tutar</label>
                <Input 
                  type="number"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  max={selectedRequest?.refundAmount}
                  disabled={actionStatus === 'APPROVED'}
                  placeholder="Onaylanan tutarı girin"
                />
                {actionStatus === 'PARTIAL_APPROVED' && (
                  <p className="text-xs text-muted-foreground">
                    Talep edilenden daha az bir tutar onaylamak için değeri değiştirin
                  </p>
                )}
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
            <Button onClick={processRefundRequest} disabled={isSubmitting}>
              {isSubmitting ? 'İşleniyor...' : 'Onayla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RefundRequestList; 