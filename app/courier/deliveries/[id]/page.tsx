'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { MapPin, Calendar, Clock, Package, Navigation, ArrowLeft, User, Phone, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import CourierLayout from '@/app/components/layouts/CourierLayout';
import RouteMap, { RouteData, RouteDeliveryPoint } from '@/app/components/routes/RouteMap';
import DeliverySequencePanel from '@/app/components/routes/DeliverySequencePanel';
import RouteControls from '@/app/components/routes/RouteControls';

interface Delivery {
  id: string;
  status: string;
  assignedAt: string;
  estimatedDeliveryTime: string;
  actualDeliveryTime: string | null;
  distance: number;
  actualDistance: number;
  duration: number;
  actualDuration: number;
  pickupLocation: {
    address: string;
    latitude: number;
    longitude: number;
  };
  dropoffLocation: {
    address: string;
    latitude: number;
    longitude: number;
  };
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  orderItems?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  notes?: string;
}

export default function DeliveryDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [route, setRoute] = useState<RouteData | undefined>(undefined);
  const [courierPosition, setCourierPosition] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'map' | 'split' | 'list'>('split');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  const deliveryId = params.id;

  useEffect(() => {
    fetchDeliveryDetail();
  }, [deliveryId]);

  useEffect(() => {
    // Get initial courier position
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCourierPosition({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );

      // Set up position tracking
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCourierPosition({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error tracking location:', error);
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, []);

  const fetchDeliveryDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // API çağrısı
      const response = await axios.get(`/api/courier/deliveries/${deliveryId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        setDelivery(response.data.delivery);
        
        // Convert delivery data to route format for the map
        if (response.data.delivery) {
          const deliveryData = response.data.delivery;
          
          // Create a RouteData object from the delivery 
          const routeData: RouteData = {
            courierId: 'current-courier', // This would come from auth in a real app
            courierName: 'Kurye',
            deliveryPoints: [
              {
                id: 'pickup',
                address: deliveryData.pickupLocation.address,
                latitude: deliveryData.pickupLocation.latitude,
                longitude: deliveryData.pickupLocation.longitude,
                sequenceNumber: 1,
                status: 'PICKUP',
                customerName: 'Teslim Alım Noktası'
              },
              {
                id: deliveryData.id,
                address: deliveryData.dropoffLocation.address,
                latitude: deliveryData.dropoffLocation.latitude,
                longitude: deliveryData.dropoffLocation.longitude,
                sequenceNumber: 2,
                status: deliveryData.status,
                customerName: deliveryData.customer.name,
                estimatedArrival: format(new Date(deliveryData.estimatedDeliveryTime), 'HH:mm')
              }
            ],
            totalDistance: deliveryData.distance,
            totalDuration: deliveryData.duration,
            lastUpdated: format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr })
          };
          
          setRoute(routeData);
          setLastUpdated(format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr }));
        }
      } else {
        setError('Teslimat detayları yüklenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Teslimat detayları yüklenirken hata:', error);
      setError('Veriler yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      
      // For demo purposes, create mock data if API fails
      createMockDelivery();
    } finally {
      setLoading(false);
    }
  };
  
  // Create mock data for development purposes
  const createMockDelivery = () => {
    const mockDelivery: Delivery = {
      id: deliveryId,
      status: 'IN_TRANSIT',
      assignedAt: new Date().toISOString(),
      estimatedDeliveryTime: new Date(Date.now() + 30 * 60000).toISOString(),
      actualDeliveryTime: null,
      distance: 5.7,
      actualDistance: 0,
      duration: 25,
      actualDuration: 0,
      pickupLocation: {
        address: 'Florya Caddesi No:45, Bakırköy',
        latitude: 40.9762,
        longitude: 28.7866
      },
      dropoffLocation: {
        address: 'Bağdat Caddesi No:123, Kadıköy',
        latitude: 40.9792,
        longitude: 29.0546
      },
      customer: {
        id: 'cust123',
        name: 'Mehmet Demir',
        phone: '+90 555 123 4567'
      },
      orderItems: [
        { id: 'i1', name: 'Pizza Margherita', quantity: 1, price: 150 },
        { id: 'i2', name: 'Cola (1L)', quantity: 2, price: 30 }
      ],
      notes: 'Lütfen kapıda beklemeyin, zili çalın.'
    };
    
    setDelivery(mockDelivery);
    
    // Create route data from mock delivery
    const routeData: RouteData = {
      courierId: 'current-courier',
      courierName: 'Kurye',
      deliveryPoints: [
        {
          id: 'pickup',
          address: mockDelivery.pickupLocation.address,
          latitude: mockDelivery.pickupLocation.latitude,
          longitude: mockDelivery.pickupLocation.longitude,
          sequenceNumber: 1,
          status: 'PICKUP',
          customerName: 'Teslim Alım Noktası'
        },
        {
          id: mockDelivery.id,
          address: mockDelivery.dropoffLocation.address,
          latitude: mockDelivery.dropoffLocation.latitude,
          longitude: mockDelivery.dropoffLocation.longitude,
          sequenceNumber: 2,
          status: mockDelivery.status,
          customerName: mockDelivery.customer.name,
          estimatedArrival: format(new Date(mockDelivery.estimatedDeliveryTime), 'HH:mm')
        }
      ],
      totalDistance: mockDelivery.distance,
      totalDuration: mockDelivery.duration,
      lastUpdated: format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr })
    };
    
    setRoute(routeData);
    setLastUpdated(format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr }));
  };

  const handleMarkAsDelivered = async () => {
    if (!delivery) return;
    
    try {
      setIsRefreshing(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await axios.put(
        `/api/courier/deliveries/${deliveryId}/status`,
        { status: 'DELIVERED' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        // Update local state to reflect the change
        setDelivery({
          ...delivery,
          status: 'DELIVERED',
          actualDeliveryTime: new Date().toISOString()
        });
        
        // Update route state if it exists
        if (route) {
          const updatedPoints = route.deliveryPoints.map(point => 
            point.id === deliveryId 
              ? { ...point, status: 'DELIVERED' } 
              : point
          );
          
          setRoute({
            ...route,
            deliveryPoints: updatedPoints,
            lastUpdated: format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr })
          });
          
          setLastUpdated(format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr }));
        }
      } else {
        setError('Teslimat durumu güncellenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Teslimat durumu güncellenirken hata:', error);
      setError('İşlem gerçekleştirilemedi. Lütfen daha sonra tekrar deneyin.');
      
      // For demo purposes, update the state anyway
      if (delivery) {
        setDelivery({
          ...delivery,
          status: 'DELIVERED',
          actualDeliveryTime: new Date().toISOString()
        });
        
        // Update route state if it exists
        if (route) {
          const updatedPoints = route.deliveryPoints.map(point => 
            point.id === deliveryId 
              ? { ...point, status: 'DELIVERED' } 
              : point
          );
          
          setRoute({
            ...route,
            deliveryPoints: updatedPoints,
            lastUpdated: format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr })
          });
          
          setLastUpdated(format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr }));
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCancelDelivery = async () => {
    if (!delivery) return;
    
    try {
      setIsRefreshing(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await axios.put(
        `/api/courier/deliveries/${deliveryId}/status`,
        { status: 'CANCELED' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        // Update local state to reflect the change
        setDelivery({
          ...delivery,
          status: 'CANCELED'
        });
        
        // Update route state if it exists
        if (route) {
          const updatedPoints = route.deliveryPoints.map(point => 
            point.id === deliveryId 
              ? { ...point, status: 'CANCELED' } 
              : point
          );
          
          setRoute({
            ...route,
            deliveryPoints: updatedPoints,
            lastUpdated: format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr })
          });
          
          setLastUpdated(format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr }));
        }
      } else {
        setError('Teslimat durumu güncellenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Teslimat durumu güncellenirken hata:', error);
      setError('İşlem gerçekleştirilemedi. Lütfen daha sonra tekrar deneyin.');
      
      // For demo purposes, update the state anyway
      if (delivery) {
        setDelivery({
          ...delivery,
          status: 'CANCELED'
        });
        
        // Update route state if it exists
        if (route) {
          const updatedPoints = route.deliveryPoints.map(point => 
            point.id === deliveryId 
              ? { ...point, status: 'CANCELED' } 
              : point
          );
          
          setRoute({
            ...route,
            deliveryPoints: updatedPoints,
            lastUpdated: format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr })
          });
          
          setLastUpdated(format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr }));
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStartNavigation = () => {
    if (!delivery) return;
    
    // Open in Google Maps
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${delivery.dropoffLocation.latitude},${delivery.dropoffLocation.longitude}`,
      '_blank'
    );
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDeliveryDetail();
  };

  const handleCenterMap = () => {
    // This function would be used to center the map on the current delivery
    console.log('Center map requested');
  };

  const handleToggleView = () => {
    switch (viewMode) {
      case 'map':
        setViewMode('split');
        break;
      case 'split':
        setViewMode('list');
        break;
      case 'list':
        setViewMode('map');
        break;
    }
  };

  const handleFullScreen = () => {
    // This would toggle fullscreen mode
    console.log('Fullscreen requested');
  };
  
  const handleBackToList = () => {
    router.push('/courier/deliveries');
  };

  // Format date and time helpers
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: tr });
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm', { locale: tr });
  };

  // Status badge component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ASSIGNED':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            Atandı
          </span>
        );
      case 'PICKED_UP':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
            Teslim Alındı
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Yolda
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Teslim Edildi
          </span>
        );
      case 'CANCELED':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            İptal Edildi
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            Başarısız
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  // Render map content based on view mode
  const renderMapContent = () => {
    switch (viewMode) {
      case 'map':
        return (
          <div className="h-[calc(100vh-350px)]">
            <RouteMap
              route={route}
              courierPosition={courierPosition}
              loading={loading}
              className="h-full"
            />
          </div>
        );
      case 'list':
        return (
          <DeliverySequencePanel
            route={route}
            loading={loading}
            className="h-[calc(100vh-350px)] overflow-auto"
          />
        );
      default: // 'split'
        return (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-350px)]">
            <div className="lg:col-span-3 h-full">
              <RouteMap
                route={route}
                courierPosition={courierPosition}
                loading={loading}
                className="h-full"
              />
            </div>
            <div className="lg:col-span-2 h-full overflow-auto">
              <DeliverySequencePanel
                route={route}
                loading={loading}
                className="h-full"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <CourierLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center mb-6">
            <button 
              onClick={handleBackToList}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Teslimat Detayı</h1>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : delivery ? (
            <div className="mb-6">
              {/* Delivery Info Card */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Teslimat #{delivery.id.substring(0, 8)}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      {formatDate(delivery.estimatedDeliveryTime)} · {formatTime(delivery.estimatedDeliveryTime)}
                    </p>
                  </div>
                  {getStatusBadge(delivery.status)}
                </div>
                
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        Müşteri
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {delivery.customer.name}
                      </dd>
                    </div>
                    
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        Telefon
                      </dt>
                      <dd className="mt-1 text-sm text-blue-600">
                        <a href={`tel:${delivery.customer.phone}`} className="hover:underline">
                          {delivery.customer.phone}
                        </a>
                      </dd>
                    </div>
                    
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        Teslim Alınacak Yer
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {delivery.pickupLocation.address}
                      </dd>
                    </div>
                    
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        Teslimat Adresi
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {delivery.dropoffLocation.address}
                      </dd>
                    </div>
                    
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Mesafe ve Süre
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {delivery.distance.toFixed(1)} km · {delivery.duration} dakika
                      </dd>
                    </div>
                    
                    {delivery.notes && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">
                          Notlar
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 bg-yellow-50 p-3 rounded-md">
                          {delivery.notes}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
                
                {/* Sipariş Detayları */}
                {delivery.orderItems && delivery.orderItems.length > 0 && (
                  <div className="border-t border-gray-200">
                    <div className="px-4 py-5 sm:px-6">
                      <h4 className="text-sm font-medium text-gray-500">Sipariş İçeriği</h4>
                      <div className="mt-2 divide-y divide-gray-200">
                        {delivery.orderItems.map(item => (
                          <div key={item.id} className="py-2 flex justify-between">
                            <div className="text-sm">
                              <span className="font-medium">{item.quantity}x</span> {item.name}
                            </div>
                            <div className="text-sm font-medium">
                              {new Intl.NumberFormat('tr-TR', { 
                                style: 'currency', 
                                currency: 'TRY' 
                              }).format(item.price)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="bg-gray-50 px-4 py-4 sm:px-6 flex flex-wrap gap-3 justify-end">
                  <button
                    onClick={handleStartNavigation}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Navigation className="h-5 w-5 mr-2" />
                    Yol Tarifi Al
                  </button>
                  
                  {delivery.status !== 'DELIVERED' && delivery.status !== 'CANCELED' && (
                    <>
                      <button
                        onClick={handleMarkAsDelivered}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Teslim Edildi
                      </button>
                      
                      <button
                        onClick={handleCancelDelivery}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <XCircle className="h-5 w-5 mr-2 text-red-500" />
                        İptal Et
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Route Map Section */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Teslimat Rotası</h2>
                
                <RouteControls
                  onRefresh={handleRefresh}
                  onCenterMap={handleCenterMap}
                  onFullScreen={handleFullScreen}
                  onToggleView={handleToggleView}
                  isRefreshing={isRefreshing}
                  viewMode={viewMode}
                  lastUpdated={lastUpdated}
                  className="mb-4"
                />
                
                {renderMapContent()}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Teslimat bulunamadı</h3>
              <p className="mt-1 text-sm text-gray-500">
                Belirtilen ID ile teslimat bulunamadı.
              </p>
            </div>
          )}
        </div>
      </div>
    </CourierLayout>
  );
} 