'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  name: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Business {
  id: string;
  name: string;
  email: string;
}

interface Courier {
  id: string;
  user: {
    name: string;
    email: string;
  };
}

interface Order {
  id: string;
  status: string;
  totalPrice: number;
  address: string;
  notes: string | null;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  createdAt: string;
  updatedAt: string;
  customerId: string;
  businessId: string;
  courierId: string | null;
  items: OrderItem[];
  customer: Customer;
  business: Business;
  courier: Courier | null;
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [couriers, setCouriers] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(response.data);
      setSelectedStatus(response.data.status);
      setSelectedCourierId(response.data.courierId || '');
      setNotes(response.data.notes || '');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Sipariş detayları yüklenirken bir hata oluştu.');
      toast.error('Sipariş detayları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchCouriers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/couriers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCouriers(response.data.couriers || []);
    } catch (err) {
      console.error('Kuryeler yüklenirken hata:', err);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
      fetchCouriers();
    }
  }, [orderId]);

  const updateOrder = async () => {
    if (!orderId || !order) return;
    
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('token');
      const updateData: any = {
        status: selectedStatus,
      };
      
      if (selectedCourierId) {
        updateData.courierId = selectedCourierId;
      }
      
      if (notes !== (order?.notes || '')) {
        updateData.notes = notes;
      }

      await axios.patch(`/api/orders/${orderId}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success('Sipariş başarıyla güncellendi');
      fetchOrderDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Sipariş güncellenirken bir hata oluştu');
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteOrder = async () => {
    if (!orderId) return;
    
    if (!window.confirm('Bu siparişi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
      return;
    }
    
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('token');
      await axios.delete(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success('Sipariş başarıyla silindi');
      router.push('/admin/orders');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Sipariş silinirken bir hata oluştu');
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500';
      case 'PROCESSING': return 'bg-blue-500';
      case 'SHIPPED': return 'bg-purple-500';
      case 'DELIVERED': return 'bg-green-500';
      case 'CANCELLED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Belirtilmemiş';
    return new Date(dateString).toLocaleString('tr-TR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p>Yükleniyor...</p></div>;
  if (error) return <div className="p-4 text-red-500">Hata: {error}</div>;
  if (!order) return <div className="p-4">Sipariş bulunamadı.</div>;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sipariş Detayı</h1>
          <p className="text-muted-foreground">#{order.id}</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/orders')}
          >
            Geri Dön
          </Button>
          <Button 
            variant="destructive" 
            disabled={isUpdating}
            onClick={deleteOrder}
          >
            Siparişi Sil
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Sipariş Detayları</TabsTrigger>
          <TabsTrigger value="items">Sipariş Öğeleri</TabsTrigger>
          <TabsTrigger value="management">Sipariş Yönetimi</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Sipariş Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durum:</span>
                  <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Toplam Tutar:</span>
                  <span className="font-semibold">{formatCurrency(order.totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Oluşturulma Tarihi:</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tahmini Teslimat:</span>
                  <span>{formatDate(order.estimatedDelivery)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gerçek Teslimat:</span>
                  <span>{formatDate(order.actualDelivery)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Müşteri Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-muted-foreground">İsim:</span>
                  <p className="font-semibold">{order.customer.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">E-posta:</span>
                  <p>{order.customer.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Telefon:</span>
                  <p>{order.customer.phone}</p>
                </div>
                <Separator className="my-2" />
                <div>
                  <span className="text-muted-foreground">Teslimat Adresi:</span>
                  <p className="text-sm mt-1">{order.address}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>İşletme Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-muted-foreground">İşletme Adı:</span>
                  <p className="font-semibold">{order.business.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">E-posta:</span>
                  <p>{order.business.email}</p>
                </div>
                <Separator className="my-2" />
                <div>
                  <span className="text-muted-foreground">Kurye:</span>
                  <p className="font-semibold">
                    {order.courier ? order.courier.user.name : "Atanmamış"}
                  </p>
                </div>
                {order.courier && (
                  <div>
                    <span className="text-muted-foreground">Kurye E-posta:</span>
                    <p>{order.courier.user.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Sipariş Notları</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>Sipariş Öğeleri</CardTitle>
              <CardDescription>Siparişteki toplam {order.items.length} öğe</CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-2 border-b">Ürün</th>
                    <th className="text-right p-2 border-b">Fiyat</th>
                    <th className="text-right p-2 border-b">Miktar</th>
                    <th className="text-right p-2 border-b">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2 border-b">{item.name}</td>
                      <td className="text-right p-2 border-b">{formatCurrency(item.price)}</td>
                      <td className="text-right p-2 border-b">{item.quantity}</td>
                      <td className="text-right p-2 border-b">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <td colSpan={3} className="text-right p-2 pt-4">Toplam:</td>
                    <td className="text-right p-2 pt-4">{formatCurrency(order.totalPrice)}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management">
          <Card>
            <CardHeader>
              <CardTitle>Sipariş Yönetimi</CardTitle>
              <CardDescription>Sipariş durumunu güncelleyin ve kurye atayın</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Sipariş Durumu</Label>
                  <Select 
                    value={selectedStatus} 
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Beklemede</SelectItem>
                      <SelectItem value="PROCESSING">İşleniyor</SelectItem>
                      <SelectItem value="SHIPPED">Kargoya Verildi</SelectItem>
                      <SelectItem value="DELIVERED">Teslim Edildi</SelectItem>
                      <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courier">Kurye Atama</Label>
                  <Select 
                    value={selectedCourierId} 
                    onValueChange={setSelectedCourierId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kurye seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Kurye Atanmamış</SelectItem>
                      {couriers.map(courier => (
                        <SelectItem key={courier.id} value={courier.id}>
                          {courier.user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Sipariş Notları</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Sipariş ile ilgili notlar"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedStatus(order.status);
                  setSelectedCourierId(order.courierId || '');
                  setNotes(order.notes || '');
                }}
              >
                Değişiklikleri Sıfırla
              </Button>
              <Button 
                onClick={updateOrder}
                disabled={isUpdating}
              >
                {isUpdating ? 'Güncelleniyor...' : 'Siparişi Güncelle'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 