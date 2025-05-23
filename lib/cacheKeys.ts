/**
 * Cache key definitions to maintain consistency across the application
 */

export const CacheKeys = {
  // User related keys
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  USER_PERMISSIONS: (userId: string) => `user:permissions:${userId}`,
  
  // Order related keys
  ORDER_LIST: (filters: string) => `orders:list:${filters}`,
  ORDER_DETAILS: (orderId: string) => `order:${orderId}`,
  ACTIVE_ORDERS: (businessId?: string) => businessId ? `orders:active:${businessId}` : 'orders:active',
  
  // Courier related keys
  COURIER_LOCATION: (courierId: string) => `courier:location:${courierId}`,
  COURIER_DELIVERIES: (courierId: string) => `courier:deliveries:${courierId}`,
  COURIER_EARNINGS: (courierId: string, period?: string) => `courier:earnings:${courierId}:${period || 'all'}`,
  
  // Business related keys
  BUSINESS_PROFILE: (businessId: string) => `business:profile:${businessId}`,
  BUSINESS_PRODUCTS: (businessId: string) => `business:products:${businessId}`,
  BUSINESS_SETTINGS: (userId: string) => `business:settings:${userId}`,
  
  // Dashboard related keys
  DASHBOARD_METRICS: (role: string, id: string) => `dashboard:metrics:${role}:${id}`,
  DASHBOARD_CHARTS: (role: string, id: string, period?: string) => `dashboard:charts:${role}:${id}:${period || 'all'}`,
  
  // System settings keys
  SYSTEM_SETTINGS: (category?: string) => category ? `settings:${category}` : 'settings:all',
  
  // Reports related keys
  REPORT_DATA: (reportId: string) => `report:data:${reportId}`,
  REPORT_LIST: (userId: string) => `reports:list:${userId}`,
  
  // Other utility functions
  invalidateUserCache: (userId: string) => [
    CacheKeys.USER_PROFILE(userId),
    CacheKeys.USER_PERMISSIONS(userId)
  ],
  
  invalidateOrderCache: (orderId: string, businessId?: string) => {
    const keys = [CacheKeys.ORDER_DETAILS(orderId)];
    if (businessId) {
      keys.push(CacheKeys.ACTIVE_ORDERS(businessId));
    }
    keys.push(CacheKeys.ACTIVE_ORDERS());
    return keys;
  },
  
  invalidateBusinessCache: (businessId: string, userId?: string) => {
    const keys = [
      CacheKeys.BUSINESS_PROFILE(businessId),
      CacheKeys.BUSINESS_PRODUCTS(businessId),
      CacheKeys.ACTIVE_ORDERS(businessId)
    ];
    
    if (userId) {
      keys.push(CacheKeys.BUSINESS_SETTINGS(userId));
    }
    
    return keys;
  }
}; 