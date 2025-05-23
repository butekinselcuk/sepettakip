// User type definition
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

// UserSettings type definition
export interface UserSettings {
  id: string;
  userId: string;
  receiveNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  newOrderAlert?: boolean;
  newCustomerAlert?: boolean;
  orderStatusAlert?: boolean;
  newDeliveryAlert?: boolean;
  deliveryStatusAlert?: boolean;
  theme: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

// Courier type definition
export interface Courier {
  id: string;
  userId: string;
  phone: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  vehicleType?: string;
  status: string;
  availabilityStatus: string;
  currentLatitude?: number;
  currentLongitude?: number;
  documentsVerified: boolean;
}

// Business type definition
export interface Business {
  id: string;
  userId: string;
  name: string;
  address: string;
  phone: string;
  latitude?: number;
  longitude?: number;
}

// Customer type definition
export interface Customer {
  id: string;
  userId: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
} 