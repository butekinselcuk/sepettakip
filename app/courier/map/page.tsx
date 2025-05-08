'use client'

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import CourierLayout from '@/app/components/layouts/CourierLayout';
import RouteMap, { RouteData, RouteDeliveryPoint } from '@/app/components/routes/RouteMap';
import DeliverySequencePanel from '@/app/components/routes/DeliverySequencePanel';
import RouteControls from '@/app/components/routes/RouteControls';
import DeliveryDetails, { DeliveryDetailData } from '@/app/components/routes/DeliveryDetails';

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

export default function CourierMap() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const deliveryId = searchParams.get('deliveryId');
  
  const [route, setRoute] = useState<RouteData | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'map' | 'split' | 'list'>('split');
  const [courierPosition, setCourierPosition] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryDetailData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  // Mock courier ID - in real app, this would come from authentication
  const courierId = '1234';

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

  // Fetch deliveries on mount
  useEffect(() => {
    if (deliveryId) {
      // If we have a delivery ID, fetch that specific delivery
      fetchSingleDelivery(deliveryId);
    } else {
      // Otherwise, fetch all active deliveries
      fetchAllDeliveries();
    }
  }, [deliveryId]);

  const fetchSingleDelivery = async (id: string) => {
    setIsRefreshing(true);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // In a real app, this would be an API call to fetch a specific delivery
      // const response = await axios.get(`/api/courier/deliveries/${id}`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      
      // For now, we'll use mock data
      setTimeout(() => {
        // Mock single delivery
        const mockDelivery: Delivery = {
          id: id,
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
        
        setDeliveries([mockDelivery]);
        
        // Convert to route data format
        const routeData: RouteData = {
          courierId: courierId,
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
        setIsRefreshing(false);
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error fetching delivery data:', error);
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  const fetchAllDeliveries = async () => {
    setIsRefreshing(true);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // In a real app, this would be an API call to fetch all active deliveries
      // const response = await axios.get('/api/courier/deliveries?status=active', {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      
      // For now, we'll use mock data
      setTimeout(() => {
        // Mock multiple deliveries
        const mockDeliveries: Delivery[] = [
          {
            id: 'd1',
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
            }
          },
          {
            id: 'd2',
            status: 'ASSIGNED',
            assignedAt: new Date().toISOString(),
            estimatedDeliveryTime: new Date(Date.now() + 60 * 60000).toISOString(),
            actualDeliveryTime: null,
            distance: 3.2,
            actualDistance: 0,
            duration: 15,
            actualDuration: 0,
            pickupLocation: {
              address: 'İstiklal Caddesi No:45, Beyoğlu',
              latitude: 41.0336,
              longitude: 28.9778
            },
            dropoffLocation: {
              address: 'Abdi İpekçi Caddesi No:78, Nişantaşı',
              latitude: 41.0485,
              longitude: 28.9923
            },
            customer: {
              id: 'cust456',
              name: 'Ayşe Yıldız',
              phone: '+90 555 987 6543'
            }
          }
        ];
        
        setDeliveries(mockDeliveries);
        
        // Convert to route data format
        // We'll use the pickup location from the first delivery as the common pickup
        const routeData: RouteData = {
          courierId: courierId,
          courierName: 'Kurye',
          deliveryPoints: [
            {
              id: 'pickup',
              address: mockDeliveries[0].pickupLocation.address,
              latitude: mockDeliveries[0].pickupLocation.latitude,
              longitude: mockDeliveries[0].pickupLocation.longitude,
              sequenceNumber: 1,
              status: 'PICKUP',
              customerName: 'Teslim Alım Noktası'
            },
            ...mockDeliveries.map((delivery, index) => ({
              id: delivery.id,
              address: delivery.dropoffLocation.address,
              latitude: delivery.dropoffLocation.latitude,
              longitude: delivery.dropoffLocation.longitude,
              sequenceNumber: index + 2, // Start from 2 (after pickup)
              status: delivery.status,
              customerName: delivery.customer.name,
              estimatedArrival: format(new Date(delivery.estimatedDeliveryTime), 'HH:mm')
            }))
          ],
          totalDistance: mockDeliveries.reduce((sum, delivery) => sum + delivery.distance, 0),
          totalDuration: mockDeliveries.reduce((sum, delivery) => sum + delivery.duration, 0),
          lastUpdated: format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr })
        };
        
        setRoute(routeData);
        setLastUpdated(format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr }));
        setIsRefreshing(false);
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error fetching deliveries data:', error);
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (deliveryId) {
      fetchSingleDelivery(deliveryId);
    } else {
      fetchAllDeliveries();
    }
  };

  const handleCenterMap = () => {
    // This would trigger the map to recenter - handled in the RouteMap component
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

  const handleReroute = () => {
    // This would trigger a reroute calculation
    setIsRefreshing(true);
    setTimeout(() => {
      // Simulate API call for rerouting
      setIsRefreshing(false);
      // Here you would update the route with new calculations
    }, 1500);
  };

  const handleDeliveryClick = (pointId: string) => {
    if (!route) return;
    
    // Skip if this is the pickup point
    if (pointId === 'pickup') return;
    
    // Find the delivery in our deliveries array
    const delivery = deliveries.find(d => d.id === pointId);
    if (!delivery) return;
    
    // Create detailed delivery data
    const detailData: DeliveryDetailData = {
      id: delivery.id,
      customerName: delivery.customer.name,
      customerPhone: delivery.customer.phone,
      address: delivery.dropoffLocation.address,
      latitude: delivery.dropoffLocation.latitude,
      longitude: delivery.dropoffLocation.longitude,
      status: delivery.status,
      estimatedArrival: format(new Date(delivery.estimatedDeliveryTime), 'HH:mm'),
      sequenceNumber: route.deliveryPoints.find(p => p.id === pointId)?.sequenceNumber || 0,
      orderItems: delivery.orderItems,
      notes: delivery.notes
    };
    
    setSelectedDelivery(detailData);
    setIsDetailsOpen(true);
  };

  const handleStatusChange = async (deliveryId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // In a real app, this would be an API call
      // await axios.put(`/api/courier/deliveries/${deliveryId}/status`, 
      //   { status: newStatus }, 
      //   { headers: { Authorization: `Bearer ${token}` } }
      // );
      
      // Update local state
      // Update deliveries array
      const updatedDeliveries = deliveries.map(delivery => 
        delivery.id === deliveryId ? { 
          ...delivery, 
          status: newStatus,
          actualDeliveryTime: newStatus === 'DELIVERED' ? new Date().toISOString() : delivery.actualDeliveryTime
        } : delivery
      );
      
      setDeliveries(updatedDeliveries);
      
      // Update route data
      if (route) {
        const updatedPoints = route.deliveryPoints.map(point => 
          point.id === deliveryId ? { ...point, status: newStatus } : point
        );
        
        setRoute({
          ...route,
          deliveryPoints: updatedPoints
        });
      }
      
      // Close the details modal
      setIsDetailsOpen(false);
      
    } catch (error) {
      console.error('Error updating delivery status:', error);
    }
  };

  const handleNavigate = (lat: number, lng: number) => {
    // Open in Google Maps
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const handleBackToDeliveries = () => {
    router.push('/courier/deliveries');
  };

  // Render appropriate layout based on view mode
  const renderContent = () => {
    switch (viewMode) {
      case 'map':
        return (
          <div className="h-[calc(100vh-200px)]">
            <RouteMap
              route={route}
              courierPosition={courierPosition}
              loading={loading}
              onDeliveryPointClick={handleDeliveryClick}
              className="h-full"
            />
          </div>
        );
      case 'list':
        return (
          <DeliverySequencePanel
            route={route}
            loading={loading}
            onDeliveryClick={handleDeliveryClick}
            className="h-[calc(100vh-200px)] overflow-auto"
          />
        );
      default: // 'split'
        return (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-200px)]">
            <div className="lg:col-span-3 h-full">
              <RouteMap
                route={route}
                courierPosition={courierPosition}
                loading={loading}
                onDeliveryPointClick={handleDeliveryClick}
                className="h-full"
              />
            </div>
            <div className="lg:col-span-2 h-full overflow-auto">
              <DeliverySequencePanel
                route={route}
                loading={loading}
                onDeliveryClick={handleDeliveryClick}
                className="h-full"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <CourierLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={handleBackToDeliveries}
              className="mr-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ← Teslimatlara Dön
            </button>
            <h1 className="text-2xl font-bold">{deliveryId ? 'Teslimat Rotası' : 'Tüm Teslimatlar'}</h1>
          </div>
        </div>
        
        <RouteControls
          onRefresh={handleRefresh}
          onCenterMap={handleCenterMap}
          onFullScreen={handleFullScreen}
          onToggleView={handleToggleView}
          onReroute={handleReroute}
          isRefreshing={isRefreshing}
          viewMode={viewMode}
          lastUpdated={lastUpdated}
        />
        
        {renderContent()}
        
        <DeliveryDetails
          delivery={selectedDelivery}
          onClose={() => setIsDetailsOpen(false)}
          onNavigate={handleNavigate}
          onStatusChange={handleStatusChange}
          isOpen={isDetailsOpen}
        />
      </div>
    </CourierLayout>
  );
} 