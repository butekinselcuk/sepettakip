import { z } from 'zod';
import { coordinatesSchema, idSchema, paginationSchema, dateRangeSchema } from './common';

// Teslimat durumları
export const deliveryStatusEnum = z.enum([
  'PENDING', 
  'ASSIGNED', 
  'PICKED_UP', 
  'IN_PROGRESS', 
  'DELIVERED', 
  'CANCELLED', 
  'FAILED'
]);

export type DeliveryStatus = z.infer<typeof deliveryStatusEnum>;

// Teslimat önceliği
export const deliveryPriorityEnum = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
]);

// Teslimat filtre şeması
export const deliveryFilterSchema = z.object({
  ...paginationSchema.shape,
  status: deliveryStatusEnum.optional(),
  courierId: idSchema.optional(),
  customerId: idSchema.optional(),
  zoneId: idSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(),
  date: dateRangeSchema.optional(),
});

// Teslimat durum güncelleme şeması
export const deliveryStatusUpdateSchema = z.object({
  status: deliveryStatusEnum,
  note: z.string().optional(),
  location: coordinatesSchema.optional(),
  actualDistance: z.number().optional(),
  actualDuration: z.number().optional()
});

// Teslimat oluşturma şeması
export const createDeliverySchema = z.object({
  orderId: idSchema,
  courierId: idSchema.optional(),
  zoneId: idSchema,
  pickupAddress: z.string(),
  pickupLatitude: z.number().optional(),
  pickupLongitude: z.number().optional(),
  dropoffAddress: z.string(),
  dropoffLatitude: z.number().optional(),
  dropoffLongitude: z.number().optional(),
  estimatedDistance: z.number().optional(),
  estimatedDuration: z.number().optional(),
  priority: deliveryPriorityEnum.optional(),
  notes: z.string().optional(),
});

// Teslimat veri tipi
export type DeliveryData = {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedDeliveryTime: Date;
  actualDeliveryTime?: Date | null;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  businessName: string;
  items: unknown[];
  totalPrice: number;
  estimatedDuration: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  completedAt?: Date | null;
};

export const CourierLocationUpdateSchema = z.object({
  latitude: z.number(),
  longitude: z.number()
}); 