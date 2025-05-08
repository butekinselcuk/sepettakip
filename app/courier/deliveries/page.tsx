"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import CourierLayout from "@/app/components/layouts/CourierLayout";
import { MapPin, Calendar, Clock, Package, Navigation, Check, ChevronRight, AlertTriangle, Map, RotateCw } from "lucide-react";
import RouteMap from "@/app/components/routes/RouteMap";
import DeliverySequencePanel from "@/app/components/routes/DeliverySequencePanel";
import RouteControls from "@/app/components/routes/RouteControls";
import DeliveryDetails, { DeliveryDetailData } from "@/app/components/routes/DeliveryDetails";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

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

export default function CourierDeliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([]);
  const [completedDeliveries, setCompletedDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const [showRouteView, setShowRouteView] = useState(false);
  const [route, setRoute] = useState<{
    courierId: string;
    courierName: string;
    deliveryPoints: {
      id: string;
      address: string;
      latitude: number;
      longitude: number;
      sequenceNumber: number;
      status: string;
      customerName: string;
      estimatedArrival?: string;
    }[];
    totalDistance: number;
    totalDuration: number;
    lastUpdated: string;
  } | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'map' | 'split' | 'list'>('split');
  const [courierPosition, setCourierPosition] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryDetailData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    fetchDeliveries();

    // Get courier's current position
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

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth/login");
        return;
      }

      // API call
      const response = await axios.get("/api/courier/deliveries", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        const allDeliveries = response.data.deliveries;
        setDeliveries(allDeliveries);
        
        // Separate active and completed deliveries
        const active = allDeliveries.filter(
          (delivery: Delivery) => 
            ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(delivery.status)
        );
        
        const completed = allDeliveries.filter(
          (delivery: Delivery) => 
            ["DELIVERED", "CANCELED", "FAILED"].includes(delivery.status)
        );
        
        setActiveDeliveries(active);
        setCompletedDeliveries(completed);
        
        // Generate route data
        const routeData = generateRouteFromDeliveries(allDeliveries);
        setRoute(routeData);
        setLastUpdated(format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr }));
      } else {
        setError("Teslimatlar yüklenirken bir hata oluştu.");
      }
    } catch (error) {
      console.error("Teslimatlar yüklenirken hata:", error);
      setError("Veriler yüklenemedi. Lütfen daha sonra tekrar deneyin.");
      
      // Reset states to empty values
      setDeliveries([]);
      setActiveDeliveries([]);
      setCompletedDeliveries([]);
      setRoute(undefined);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
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
      estimatedArrival: formatTime(delivery.estimatedDeliveryTime),
      sequenceNumber: route.deliveryPoints.find(p => p.id === pointId)?.sequenceNumber || 0,
      orderItems: delivery.orderItems || [],
      notes: delivery.notes || ''
    };
    
    setSelectedDelivery(detailData);
    setIsDetailsOpen(true);
  };
  
  const handleNavigate = (lat: number, lng: number) => {
    // Open in Google Maps
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const handleStatusChange = async (deliveryId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await axios.put(
        `/api/courier/deliveries/${deliveryId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        // Update local state after successful API call
        fetchDeliveries();
      } else {
        setError("Teslimat durumu güncellenirken bir hata oluştu.");
      }
      
      // Close the details modal
      setIsDetailsOpen(false);
    } catch (error) {
      console.error("Teslimat durumu güncellenirken hata:", error);
      setError("İşlem gerçekleştirilemedi. Lütfen daha sonra tekrar deneyin.");
      
      // Close the details modal
      setIsDetailsOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            Atandı
          </span>
        );
      case "PICKED_UP":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
            Teslim Alındı
          </span>
        );
      case "IN_TRANSIT":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Yolda
          </span>
        );
      case "DELIVERED":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Teslim Edildi
          </span>
        );
      case "CANCELED":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            İptal Edildi
          </span>
        );
      case "FAILED":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            Başarısız
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const filteredDeliveries = () => {
    let filtered = [...deliveries];
    
    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(delivery => {
        if (statusFilter === "active") {
          return ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(delivery.status);
        } else if (statusFilter === "completed") {
          return ["DELIVERED"].includes(delivery.status);
        } else if (statusFilter === "canceled") {
          return ["CANCELED", "FAILED"].includes(delivery.status);
        }
        return true;
      });
    }
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        delivery =>
          delivery.id.toLowerCase().includes(term) ||
          delivery.customer.name.toLowerCase().includes(term) ||
          delivery.dropoffLocation.address.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };

  const generateRouteFromDeliveries = (deliveries: Delivery[]) => {
    if (!deliveries || deliveries.length === 0) return undefined;

    // Find active deliveries
    const activeDeliveries = deliveries.filter(d => 
      ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(d.status)
    );

    if (activeDeliveries.length === 0) return undefined;

    // Sort deliveries by estimated delivery time
    const sortedDeliveries = [...activeDeliveries].sort((a, b) => 
      new Date(a.estimatedDeliveryTime).getTime() - new Date(b.estimatedDeliveryTime).getTime()
    );

    // Use the first delivery's pickup location as the starting point
    const pickupPoint = {
      id: 'pickup',
      address: sortedDeliveries[0].pickupLocation.address,
      latitude: sortedDeliveries[0].pickupLocation.latitude,
      longitude: sortedDeliveries[0].pickupLocation.longitude,
      sequenceNumber: 1,
      status: 'PICKUP',
      customerName: 'Teslim Alım Noktası'
    };

    // Convert deliveries to route points
    const deliveryPoints = sortedDeliveries.map((delivery, index) => ({
      id: delivery.id,
      address: delivery.dropoffLocation.address,
      latitude: delivery.dropoffLocation.latitude,
      longitude: delivery.dropoffLocation.longitude,
      sequenceNumber: index + 2, // Start from 2 (after pickup)
      status: delivery.status,
      customerName: delivery.customer.name,
      estimatedArrival: formatTime(delivery.estimatedDeliveryTime)
    }));

    return {
      courierId: 'current-courier',
      courierName: 'Kurye',
      deliveryPoints: [pickupPoint, ...deliveryPoints],
      totalDistance: sortedDeliveries.reduce((sum, delivery) => sum + delivery.distance, 0),
      totalDuration: sortedDeliveries.reduce((sum, delivery) => sum + delivery.duration, 0),
      lastUpdated: format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr })
    };
  };

  const handleViewAllOnMap = () => {
    setShowRouteView(true);
  };
  
  const handleBackToList = () => {
    setShowRouteView(false);
  };

  const handleRefreshRoute = () => {
    setIsRefreshing(true);
    fetchDeliveries();
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
    // Handle fullscreen mode
    console.log('Fullscreen requested');
  };

  // Render appropriate view based on viewMode
  const renderRouteView = () => {
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
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Teslimatlarım</h1>
            
            {!showRouteView && activeDeliveries.length > 0 && (
              <button
                onClick={handleViewAllOnMap}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Map className="h-5 w-5 mr-2" />
                Haritada Göster
              </button>
            )}
            
            {showRouteView && (
              <button
                onClick={handleBackToList}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ← Listeye Dön
              </button>
            )}
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          {showRouteView ? (
            <>
              <RouteControls
                onRefresh={handleRefreshRoute}
                onCenterMap={handleCenterMap}
                onFullScreen={handleFullScreen}
                onToggleView={handleToggleView}
                onReroute={handleRefreshRoute}
                isRefreshing={isRefreshing}
                viewMode={viewMode}
                lastUpdated={lastUpdated}
              />
              
              {renderRouteView()}
              
              <DeliveryDetails
                delivery={selectedDelivery}
                onClose={() => setIsDetailsOpen(false)}
                onNavigate={handleNavigate}
                onStatusChange={handleStatusChange}
                isOpen={isDetailsOpen}
              />
            </>
          ) : (
            <>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row justify-between mb-6 space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Adres veya müşteri ara..."
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Tüm Teslimatlar</option>
                    <option value="active">Aktif Teslimatlar</option>
                    <option value="completed">Tamamlanan</option>
                    <option value="canceled">İptal/Başarısız</option>
                  </select>
                  
                  <button
                    onClick={fetchDeliveries}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <RotateCw className="mr-2 h-4 w-4" />
                    Yenile
                  </button>
                </div>
              </div>
              
              {/* Content */}
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
              ) : (
                <>
                  {/* Active Deliveries */}
                  {activeDeliveries.length > 0 && (
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-gray-900">Aktif Teslimatlar</h2>
                        <span className="text-sm text-gray-500">{activeDeliveries.length} teslimat</span>
                      </div>
                      
                      <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                          {activeDeliveries.map((delivery) => (
                            <li key={delivery.id} onClick={() => handleDeliveryClick(delivery.id)}>
                              <div className="block hover:bg-gray-50 p-4 cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center">
                                      <p className="text-sm font-medium text-blue-600 truncate mr-2">
                                        Teslimat #{delivery.id.substring(0, 8)}
                                      </p>
                                      {getStatusBadge(delivery.status)}
                                    </div>
                                    <div className="mt-2 flex">
                                      <MapPin className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                      <p className="text-sm text-gray-500">
                                        {delivery.dropoffLocation.address}
                                      </p>
                                    </div>
                                    <div className="mt-2 flex items-center">
                                      <div className="flex items-center mr-6">
                                        <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                        <p className="text-sm text-gray-500">
                                          {formatDate(delivery.estimatedDeliveryTime)}
                                        </p>
                                      </div>
                                      <div className="flex items-center">
                                        <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                        <p className="text-sm text-gray-500">
                                          {formatTime(delivery.estimatedDeliveryTime)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="mt-2 flex">
                                      <Package className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                      <p className="text-sm text-gray-500">
                                        {delivery.pickupLocation.address} → {delivery.customer.name}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={(e) => handleDeliveryClick(delivery.id)}
                                      className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                      title="Yol Tarifi Al"
                                    >
                                      <Navigation className="h-5 w-5" />
                                    </button>
                                    
                                    <button
                                      onClick={(e) => handleDeliveryClick(delivery.id)}
                                      className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                      title="Teslim Edildi"
                                    >
                                      <Check className="h-5 w-5" />
                                    </button>
                                    
                                    <ChevronRight className="h-5 w-5 text-gray-400" />
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {/* Completed Deliveries */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-medium text-gray-900">Geçmiş Teslimatlar</h2>
                      <span className="text-sm text-gray-500">{completedDeliveries.length} teslimat</span>
                    </div>
                    
                    {completedDeliveries.length > 0 ? (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                          {completedDeliveries.map((delivery) => (
                            <li key={delivery.id} onClick={() => handleDeliveryClick(delivery.id)}>
                              <div className="block hover:bg-gray-50 p-4 cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center">
                                      <p className="text-sm font-medium text-gray-900 truncate mr-2">
                                        Teslimat #{delivery.id.substring(0, 8)}
                                      </p>
                                      {getStatusBadge(delivery.status)}
                                    </div>
                                    <div className="mt-2 flex">
                                      <MapPin className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                      <p className="text-sm text-gray-500">
                                        {delivery.dropoffLocation.address}
                                      </p>
                                    </div>
                                    <div className="mt-2 flex">
                                      <Package className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                      <p className="text-sm text-gray-500">
                                        {delivery.pickupLocation.address} → {delivery.customer.name}
                                      </p>
                                    </div>
                                    <div className="mt-2 flex items-center">
                                      <div className="flex items-center mr-6">
                                        <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                        <p className="text-sm text-gray-500">
                                          {formatDate(delivery.actualDeliveryTime || delivery.estimatedDeliveryTime)}
                                        </p>
                                      </div>
                                      <div className="flex items-center">
                                        <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                        <p className="text-sm text-gray-500">
                                          {formatTime(delivery.actualDeliveryTime || delivery.estimatedDeliveryTime)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-gray-400" />
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
                        <p className="text-gray-500">Henüz tamamlanmış teslimatınız bulunmuyor.</p>
                      </div>
                    )}
                  </div>
                  
                  {/* No deliveries */}
                  {deliveries.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Teslimat bulunamadı</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Şu anda atanmış teslimatınız bulunmuyor.
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </CourierLayout>
  );
} 