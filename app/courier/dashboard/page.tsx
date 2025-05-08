"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '../../components/ui/use-toast';
import { AlertCircle, MapPin, CheckCircle, Clock, Package, User } from 'lucide-react';
import axios from 'axios';

// Tür tanımlamaları
interface DeliveryItem {
  name: string;
  quantity: number;
  price: number;
}

interface Delivery {
  id: string;
  status: string;
  createdAt: Date | string;
  estimatedDelivery?: Date | string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  businessName: string;
  items: DeliveryItem[];
  totalPrice: number;
  estimatedDuration?: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
}

interface CourierStatistics {
  deliveriesToday: number;
  totalDeliveries: number;
  rating: number;
  earningsToday: string;
}

export default function CourierDashboard() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([]);
  const [completedDeliveries, setCompletedDeliveries] = useState<Delivery[]>([]);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);
  const [courierStats, setCourierStats] = useState<CourierStatistics | null>(null);
  
  useEffect(() => {
    // Konum izni kontrolü
    if (navigator.geolocation) {
      navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
        setIsLocationEnabled(permissionStatus.state === 'granted');
        
        permissionStatus.onchange = () => {
          setIsLocationEnabled(permissionStatus.state === 'granted');
        };
      });
    }
    
    // Aktif ve tamamlanan teslimatları getir
    fetchDeliveries();
    
    // Kurye istatistiklerini getir
    fetchCourierStats();
    
    // Konum güncelleme için zamanlayıcı
    if (isLocationEnabled) {
      const locationTimer = setInterval(() => {
        updateCourierLocation();
      }, 60000); // Her 1 dakikada bir güncelle
      
      return () => clearInterval(locationTimer);
    }
  }, [isLocationEnabled]);
  
  const fetchCourierStats = async () => {
    try {
      const response = await fetch('/api/courier/stats', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('Kurye istatistikleri alınamadı:', response.status, response.statusText);
        return;
      }
      
      const data = await response.json();
      setCourierStats(data);
    } catch (err) {
      console.error('Kurye istatistikleri yüklenirken hata:', err);
    }
  };
  
  const fetchDeliveries = async () => {
    try {
      setIsLoading(true);
      
      // Sayfanın yüklendiği konsola log
      console.log("Teslimatlar yükleniyor...");
      
      // API çağrısı önce doğrudan kullan
      const fetchDirectResponse = await fetch('/api/courier/deliveries', {
        credentials: 'include'
      });
      
      if (!fetchDirectResponse.ok) {
        console.error('Doğrudan fetch hatası:', fetchDirectResponse.status, fetchDirectResponse.statusText);
        throw new Error(`Fetch hatası: ${fetchDirectResponse.status} ${fetchDirectResponse.statusText}`);
      }
      
      const data = await fetchDirectResponse.json();
      console.log("Teslimat verileri:", data);
      
      setActiveDeliveries(data.activeDeliveries || []);
      setCompletedDeliveries(data.completedDeliveries || []);
      setError('');
    } catch (err: any) {
      console.error('Teslimat verisi yükleme hatası:', err);
      
      // Hata mesajını detaylı göster
      const errorMessage = err.response?.data?.error || err.message || 'Bilinmeyen hata';
      setError(`Teslimat verileri yüklenirken hata oluştu: ${errorMessage}`);
      
      // Hata bildirimini göster
      toast({
        title: "Veri yükleme hatası",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Mock veriler yerine boş diziler ile devam et
      setActiveDeliveries([]);
      setCompletedDeliveries([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateCourierLocation = () => {
    if (!isLocationEnabled) {
      setLocationError('Konum erişimi etkin değil. Lütfen konum izni verin.');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setIsUpdatingLocation(true);
          
          console.log("Konum bilgisi alındı:", position.coords.latitude, position.coords.longitude);
          
          const response = await fetch('/api/couriers/location', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP Error: ${response.status}`);
          }
          
          setLastLocationUpdate(new Date());
          setLocationError('');
          
          // Başarı bildirimi göster
          toast({
            title: "Konum güncellendi",
            description: "Konumunuz başarıyla güncellendi.",
            variant: "default",
          });
        } catch (err: any) {
          console.error('Konum güncelleme hatası:', err);
          setLocationError('Konum güncellemesi başarısız: ' + (err.response?.data?.error || err.message));
          
          // Hata bildirimi göster
          toast({
            title: "Konum güncellemesi başarısız",
            description: err.response?.data?.error || err.message,
            variant: "destructive",
          });
        } finally {
          setIsUpdatingLocation(false);
        }
      },
      (err) => {
        console.error('Tarayıcı konum hatası:', err);
        setLocationError(`Tarayıcı konum hatası: ${err.message}`);
        setIsUpdatingLocation(false);
        
        toast({
          title: "Konum alınamadı",
          description: err.message,
          variant: "destructive",
        });
      }
    );
  };
  
  const updateDeliveryStatus = async (deliveryId: string, status: string) => {
    try {
      console.log(`Teslimat durumu güncelleniyor: ${deliveryId} -> ${status}`);
      
      const response = await fetch(`/api/courier/deliveries/${deliveryId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP Error: ${response.status}`);
      }
      
      toast({
        title: "Teslimat durumu güncellendi",
        description: `Teslimat durumu "${status}" olarak güncellendi`,
        variant: "default",
      });
      
      // Teslimatları yeniden yükle
      fetchDeliveries();
    } catch (err: any) {
      console.error('Teslimat durumu güncelleme hatası:', err);
      
      toast({
        title: "Durum güncellemesi başarısız",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
  };
  
  // Yükleme durumu
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p>Teslimat bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  // Hata durumu
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <AlertCircle className="mr-2" /> Hata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={fetchDeliveries}>Yeniden Dene</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-semibold mb-4">Kurye Paneli</h1>
      
      {/* Konum Durumu Kartı */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center mb-2">
          <MapPin className="h-6 w-6 text-gray-700 mr-2" />
          <h2 className="text-xl font-medium">Konum Durumu</h2>
        </div>
        {isLocationEnabled ? (
          <div>
            <p className="text-green-600 mb-2">Konum izni verilmiş. {lastLocationUpdate && `Son güncelleme: ${lastLocationUpdate.toLocaleTimeString()}`}</p>
            <Button 
              onClick={updateCourierLocation} 
              disabled={isUpdatingLocation}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            >
              {isUpdatingLocation ? 'Güncelleniyor...' : 'Konumu Güncelle'}
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-red-600 mb-2">Konum izni verilmemiş. Lütfen konum izninizi etkinleştirin.</p>
            <Button 
              onClick={() => {
                navigator.geolocation.getCurrentPosition(
                  () => setIsLocationEnabled(true),
                  (error) => {
                    console.error('Konum izni hatası:', error);
                    setLocationError(error.message);
                  }
                );
              }} 
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            >
              Konum İznini Etkinleştir
            </Button>
          </div>
        )}
        {locationError && <p className="text-red-500 mt-2">{locationError}</p>}
      </div>
      
      {/* Teslimatlar Sekmeleri */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Aktif Teslimatlar <Badge variant="outline">{activeDeliveries.length}</Badge></TabsTrigger>
          <TabsTrigger value="completed">Tamamlanan Teslimatlar <Badge variant="outline">{completedDeliveries.length}</Badge></TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <p>Yükleniyor...</p>
            </div>
          ) : activeDeliveries.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="flex flex-col items-center justify-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="font-medium text-lg mb-2">Aktif teslimat bulunamadı</h3>
                  <p className="text-gray-500">Şu anda aktif teslimatınız bulunmamaktadır.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeDeliveries.map((delivery: any) => (
                <Card key={delivery.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex justify-between">
                      <span className="truncate">Teslimat #{delivery.id.substring(0, 8)}</span>
                      <Badge>{delivery.status}</Badge>
                    </CardTitle>
                    <CardDescription>
                      {new Date(delivery.createdAt).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Teslimat Adresi:</div>
                        <div>{delivery.deliveryAddress}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-500">Müşteri:</div>
                        <div className="flex items-center">
                          <User size={16} className="mr-2" />
                          {delivery.customerName}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <div className="text-sm font-medium text-gray-500">Tahmini Süre:</div>
                        <div>{delivery.estimatedDuration} dakika</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-between">
                    <Button 
                      variant="outline"
                      onClick={() => window.open(`https://maps.google.com/?q=${delivery.deliveryLatitude},${delivery.deliveryLongitude}`, '_blank')}
                    >
                      <MapPin className="mr-2" size={16} /> Yol Tarifi
                    </Button>
                    
                    {delivery.status === 'PENDING' && (
                      <Button onClick={() => updateDeliveryStatus(delivery.id, 'PROCESSING')}>
                        Teslimata Başla
                      </Button>
                    )}
                    
                    {delivery.status === 'PROCESSING' && (
                      <Button onClick={() => updateDeliveryStatus(delivery.id, 'DELIVERED')}>
                        Teslim Edildi
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          {completedDeliveries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <Package size={48} className="text-gray-300 mb-4" />
                <p>Tamamlanan teslimatınız bulunmamaktadır.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {completedDeliveries.map((delivery: any) => (
                <Card key={delivery.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex justify-between">
                      <span className="truncate">Teslimat #{delivery.id.substring(0, 8)}</span>
                      <Badge 
                        className={delivery.status === 'DELIVERED' ? 'bg-green-500' : delivery.status === 'CANCELLED' ? 'bg-red-500' : ''}
                      >
                        {delivery.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {new Date(delivery.completedAt || delivery.updatedAt).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Teslimat Adresi:</div>
                        <div>{delivery.deliveryAddress}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-500">Müşteri:</div>
                        <div className="flex items-center">
                          <User size={16} className="mr-2" />
                          {delivery.customerName}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <div className="text-sm font-medium text-gray-500">Teslim Süresi:</div>
                        <div>{delivery.actualDuration || 'Belirtilmemiş'} dakika</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 