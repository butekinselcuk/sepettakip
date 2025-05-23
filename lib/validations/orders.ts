import { z } from 'zod';
import { idSchema, paginationSchema } from './common';
import { deliveryPriorityEnum } from './delivery';

// Sipariş durumları
export const orderStatusEnum = z.enum([
  'PENDING',
  'PROCESSING',
  'PREPARING',
  'READY',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED'
]);

// Sipariş öğesi şeması
export const orderItemSchema = z.object({
  name: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  notes: z.string().optional(),
});

// Sipariş oluşturma şeması
export const createOrderSchema = z.object({
  customerId: idSchema,
  businessId: idSchema,
  items: z.array(orderItemSchema),
  totalPrice: z.number().positive(),
  address: z.string(),
  notes: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  priority: deliveryPriorityEnum.optional(),
});

// Sipariş güncelleme şeması
export const updateOrderSchema = z.object({
  status: orderStatusEnum.optional(),
  courierId: idSchema.optional().nullable(),
  estimatedDelivery: z.coerce.date().optional(),
  actualDelivery: z.coerce.date().optional().nullable(),
  notes: z.string().optional(),
  address: z.string().optional(),
});

// Sipariş filtre şeması
export const orderFilterSchema = z.object({
  ...paginationSchema.shape,
  status: orderStatusEnum.optional(),
  customerId: idSchema.optional(),
  businessId: idSchema.optional(),
  courierId: idSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(),
  priority: deliveryPriorityEnum.optional(),
});

// Sipariş değerlendirme şeması
export const orderRatingSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  anonymous: z.boolean().default(false),
});

// Sipariş iptal şeması
export const orderCancelSchema = z.object({
  reason: z.string().min(5),
});

// Sipariş yanıt tipi
export type OrderResponse = {
  id: string;
  orderNumber: string;
  status: string;
  totalPrice: number;
  address: string;
  notes?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  business: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }[];
  courier?: {
    id: string;
    name: string;
    phone: string;
  } | null;
  trackingHistory?: {
    status: string;
    timestamp: Date;
    note?: string;
  }[];
}; 