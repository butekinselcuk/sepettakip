import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyJwtToken } from '@/lib/auth';
import { 
  GeoPosition, 
  calculateHaversineDistance 
} from '@/lib/utils/location';

const prisma = new PrismaClient();

/**
 * GET - Fetch optimized routes for a courier or a single order
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Token is missing' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyJwtToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    // Extract parameters
    const url = new URL(request.url);
    const courierId = url.searchParams.get('courierId');
    const orderId = url.searchParams.get('orderId');
    const zoneId = url.searchParams.get('zoneId');

    // Validate parameters - either courierId or orderId must be provided
    if (!courierId && !orderId) {
      return NextResponse.json(
        { error: 'Bad request: Either courierId or orderId is required' },
        { status: 400 }
      );
    }

    let route;

    // Case 1: Get route for a specific order
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          courier: {
            include: {
              user: true
            }
          },
          business: true,
          customer: true
        }
      });

      if (!order) {
        return NextResponse.json(
          { error: 'Not found: Order does not exist' },
          { status: 404 }
        );
      }

      // If order doesn't have a courier assigned yet
      if (!order.courierId || !order.courier) {
        return NextResponse.json(
          { error: 'Order does not have a courier assigned' },
          { status: 404 }
        );
      }

      // For a single order, we'll create a simple route with just business -> customer
      const businessLocation = {
        latitude: order.business.latitude || 41.0082, // Default to Istanbul if not set
        longitude: order.business.longitude || 28.9784
      };

      const customerLocation = {
        latitude: order.latitude || 0,
        longitude: order.longitude || 0
      };

      // Calculate distance and duration
      const distance = calculateHaversineDistance(businessLocation, customerLocation);
      const duration = Math.round((distance / 30) * 60) + 10; // Approx 30 km/h plus 10 min for delivery

      // Create return structure
      route = {
        courier: {
          id: order.courier.id,
          name: order.courier.user.name,
          phone: order.courier.phone || '',
          currentLatitude: order.courier.currentLatitude,
          currentLongitude: order.courier.currentLongitude
        },
        deliveryPoints: [
          {
            id: 'pickup',
            address: order.business.address || 'Business Location',
            latitude: businessLocation.latitude,
            longitude: businessLocation.longitude,
            sequenceNumber: 1,
            status: 'PICKUP',
            customerName: 'Business'
          },
          {
            id: order.id,
            address: order.address,
            latitude: customerLocation.latitude,
            longitude: customerLocation.longitude,
            sequenceNumber: 2,
            status: order.status,
            customerName: order.customer?.name || 'Customer',
            estimatedArrival: order.estimatedDelivery?.toISOString()
          }
        ],
        totalDistance: parseFloat(distance.toFixed(2)),
        totalDuration: duration
      };
    } 
    // Case 2: Get routes for a courier
    else if (courierId) {
      // Get courier information
      const courier = await prisma.courier.findUnique({
        where: { id: courierId },
        include: {
          user: true
        }
      });

      if (!courier) {
        return NextResponse.json(
          { error: 'Not found: Courier does not exist' },
          { status: 404 }
        );
      }

      // Get assigned orders for this courier
      const orders = await prisma.order.findMany({
        where: {
          courierId: courierId,
          status: {
            in: ['PROCESSING', 'PREPARING', 'READY', 'IN_TRANSIT']
          }
        },
        include: {
          business: true,
          customer: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Calculate optimized route
      route = optimizeRouteWithDetails(courier, orders);
    }

    return NextResponse.json({ route });
  } catch (error) {
    console.error('Error fetching optimized routes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Generate an optimized route for a courier
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Token is missing' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyJwtToken(token);

    if (!decoded || !['ADMIN', 'BUSINESS'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token or insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const requestBody = await request.json();
    const { courierId, orderIds, startPoint } = requestBody;

    // Validate request data
    if (!courierId) {
      return NextResponse.json(
        { error: 'Bad request: courierId is required' },
        { status: 400 }
      );
    }

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Bad request: orderIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Get courier information
    const courier = await prisma.courier.findUnique({
      where: { id: courierId },
      include: {
        user: true
      }
    });

    if (!courier) {
      return NextResponse.json(
        { error: 'Not found: Courier does not exist' },
        { status: 404 }
      );
    }

    // Get orders
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds }
      }
    });

    if (orders.length === 0) {
      return NextResponse.json(
        { error: 'Not found: No valid orders provided' },
        { status: 404 }
      );
    }

    // Optimize route
    const route = optimizeRoute(courier, orders, startPoint);

    // Update orders with the courier and sequence
    for (let i = 0; i < route.sortedOrders.length; i++) {
      await prisma.order.update({
        where: { id: route.sortedOrders[i].id },
        data: {
          courierId: courierId,
          // sequenceNumber field will be added in next migration
          // for now, don't update the sequence
        }
      });
    }

    return NextResponse.json({
      success: true,
      route: {
        courier: {
          id: courier.id,
          name: courier.user.name
        },
        orders: route.sortedOrders,
        totalDistance: route.totalDistance,
        totalDuration: route.estimatedDuration
      }
    });
  } catch (error) {
    console.error('Error generating optimized route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to optimize a delivery route with business details
 */
function optimizeRouteWithDetails(
  courier: any,
  orders: any[],
  startPoint?: { latitude: number; longitude: number }
) {
  // If no orders, return empty route
  if (orders.length === 0) {
    return {
      courier: {
        id: courier.id,
        name: courier.user.name,
        phone: courier.phone || '',
        currentLatitude: courier.currentLatitude,
        currentLongitude: courier.currentLongitude
      },
      deliveryPoints: [],
      totalDistance: 0,
      totalDuration: 0
    };
  }

  // Define current location (start point)
  let currentPosition: GeoPosition;
  
  if (startPoint) {
    currentPosition = startPoint;
  } else if (courier.currentLatitude && courier.currentLongitude) {
    currentPosition = {
      latitude: courier.currentLatitude,
      longitude: courier.currentLongitude
    };
  } else {
    // Fallback to first order's business location
    currentPosition = {
      latitude: orders[0].business.latitude || 41.0082, // Default to Istanbul
      longitude: orders[0].business.longitude || 28.9784
    };
  }

  // Filter orders with valid coordinates
  const validOrders = orders.filter(
    order => order.latitude !== null && order.longitude !== null
  );

  // Sort orders by priority if available
  let prioritizedOrders = [...validOrders];
  
  // Track which orders have been added to the route
  const ordersInRoute: any[] = [];
  let remainingOrders = [...prioritizedOrders];
  let totalDistance = 0;
  let estimatedDuration = 0;
  
  const deliveryPoints = [];
  let sequenceNumber = 1;

  // Add starting point (courier's current location)
  deliveryPoints.push({
    id: 'courier-location',
    address: 'Current Location',
    latitude: currentPosition.latitude,
    longitude: currentPosition.longitude,
    sequenceNumber: sequenceNumber++,
    status: 'CURRENT',
    customerName: 'Courier Location'
  });
  
  // Use nearest neighbor algorithm to find the best route
  while (remainingOrders.length > 0) {
    let nearestIdx = 0;
    let shortestDistance = calculateHaversineDistance(
      currentPosition,
      { 
        latitude: remainingOrders[0].latitude || 0, 
        longitude: remainingOrders[0].longitude || 0
      }
    );
    
    // Find the nearest unvisited order
    for (let i = 1; i < remainingOrders.length; i++) {
      const distance = calculateHaversineDistance(
        currentPosition,
        { 
          latitude: remainingOrders[i].latitude || 0, 
          longitude: remainingOrders[i].longitude || 0
        }
      );
      
      if (distance < shortestDistance) {
        nearestIdx = i;
        shortestDistance = distance;
      }
    }
    
    // Add the nearest order to our route
    const nextOrder = remainingOrders[nearestIdx];
    ordersInRoute.push(nextOrder);
    
    // Add pickup point for this order (business location)
    if (nextOrder.business) {
      const businessLocation = {
        latitude: nextOrder.business.latitude || 41.0082,
        longitude: nextOrder.business.longitude || 28.9784
      };
      
      // Calculate distance from current position to business
      const distanceToBusiness = calculateHaversineDistance(
        currentPosition,
        businessLocation
      );
      
      // Add to our total distance
      totalDistance += distanceToBusiness;
      
      // Estimate time based on distance
      const timeInMinutes = (distanceToBusiness / 30) * 60;
      estimatedDuration += timeInMinutes + 5; // Add 5 mins for pickup
      
      // Update current position to business location
      currentPosition = businessLocation;
      
      // Add business as pickup point
      deliveryPoints.push({
        id: `pickup-${nextOrder.id}`,
        address: nextOrder.business.address || 'Business Location',
        latitude: businessLocation.latitude,
        longitude: businessLocation.longitude,
        sequenceNumber: sequenceNumber++,
        status: 'PICKUP',
        customerName: 'Business'
      });
    }
    
    // Calculate distance from pickup to delivery
    const distanceToDelivery = calculateHaversineDistance(
      currentPosition,
      { 
        latitude: nextOrder.latitude || 0, 
        longitude: nextOrder.longitude || 0
      }
    );
    
    // Add to our total distance
    totalDistance += distanceToDelivery;
    
    // Estimate time based on distance
    const timeInMinutes = (distanceToDelivery / 30) * 60;
    estimatedDuration += timeInMinutes + 10; // Add 10 mins per delivery for handling
    
    // Update our current position
    currentPosition = { 
      latitude: nextOrder.latitude || 0, 
      longitude: nextOrder.longitude || 0
    };
    
    // Add delivery point
    deliveryPoints.push({
      id: nextOrder.id,
      address: nextOrder.address,
      latitude: nextOrder.latitude || 0,
      longitude: nextOrder.longitude || 0,
      sequenceNumber: sequenceNumber++,
      status: nextOrder.status,
      customerName: nextOrder.customer?.name || 'Customer',
      estimatedArrival: nextOrder.estimatedDelivery?.toISOString()
    });
    
    // Remove this order from remaining orders
    remainingOrders = [
      ...remainingOrders.slice(0, nearestIdx),
      ...remainingOrders.slice(nearestIdx + 1)
    ];
  }
  
  return {
    courier: {
      id: courier.id,
      name: courier.user.name,
      phone: courier.phone || '',
      currentLatitude: courier.currentLatitude,
      currentLongitude: courier.currentLongitude
    },
    deliveryPoints: deliveryPoints,
    totalDistance: parseFloat(totalDistance.toFixed(2)),
    totalDuration: Math.round(estimatedDuration)
  };
}

/**
 * Helper function to optimize a delivery route
 * Using nearest neighbor algorithm
 */
function optimizeRoute(
  courier: any,
  orders: any[],
  startPoint?: { latitude: number; longitude: number }
) {
  // If no orders, return empty route
  if (orders.length === 0) {
    return {
      sortedOrders: [],
      totalDistance: 0,
      estimatedDuration: 0
    };
  }

  // Define current location (start point)
  let currentPosition: GeoPosition;
  
  if (startPoint) {
    currentPosition = startPoint;
  } else if (courier.currentLatitude && courier.currentLongitude) {
    currentPosition = {
      latitude: courier.currentLatitude,
      longitude: courier.currentLongitude
    };
  } else {
    // Fallback to first order's location
    currentPosition = {
      latitude: orders[0].latitude || 0,
      longitude: orders[0].longitude || 0
    };
  }

  // Filter orders with valid coordinates
  const validOrders = orders.filter(
    order => order.latitude !== null && order.longitude !== null
  );

  // Sort orders by priority if available
  let prioritizedOrders = [...validOrders];
  
  // Track which orders have been added to the route
  const ordersInRoute: any[] = [];
  let remainingOrders = [...prioritizedOrders];
  let totalDistance = 0;
  let estimatedDuration = 0;
  
  // Use nearest neighbor algorithm to find the best route
  while (remainingOrders.length > 0) {
    let nearestIdx = 0;
    let shortestDistance = calculateHaversineDistance(
      currentPosition,
      { 
        latitude: remainingOrders[0].latitude || 0, 
        longitude: remainingOrders[0].longitude || 0
      }
    );
    
    // Find the nearest unvisited order
    for (let i = 1; i < remainingOrders.length; i++) {
      const distance = calculateHaversineDistance(
        currentPosition,
        { 
          latitude: remainingOrders[i].latitude || 0, 
          longitude: remainingOrders[i].longitude || 0
        }
      );
      
      if (distance < shortestDistance) {
        nearestIdx = i;
        shortestDistance = distance;
      }
    }
    
    // Add the nearest order to our route
    const nextOrder = remainingOrders[nearestIdx];
    ordersInRoute.push(nextOrder);
    
    // Update our current position
    currentPosition = { 
      latitude: nextOrder.latitude || 0, 
      longitude: nextOrder.longitude || 0
    };
    
    // Add to our total distance
    totalDistance += shortestDistance;
    
    // Estimate time based on distance (assuming 30km/h average speed)
    // This is a very simple estimation and should be improved
    const timeInMinutes = (shortestDistance / 30) * 60;
    estimatedDuration += timeInMinutes + 10; // Add 10 mins per delivery for handling
    
    // Remove this order from remaining orders
    remainingOrders = [
      ...remainingOrders.slice(0, nearestIdx),
      ...remainingOrders.slice(nearestIdx + 1)
    ];
  }
  
  return {
    sortedOrders: ordersInRoute,
    totalDistance: parseFloat(totalDistance.toFixed(2)),
    estimatedDuration: Math.round(estimatedDuration)
  };
} 