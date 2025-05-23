import { z } from 'zod';
import { coordinatesSchema, idSchema, paginationSchema } from './common';

// Kurye konum güncelleme şeması
export const courierLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  timestamp: z.coerce.date().default(() => new Date()),
});

// Kurye durum güncelleme şeması
export const courierStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE', 'ON_BREAK']),
  note: z.string().optional(),
});

// Kurye uygunluk şeması
export const courierAvailabilitySchema = z.object({
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional(),
  status: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE', 'ON_BREAK']),
  note: z.string().optional(),
});

// Kurye filtre şeması
export const courierFilterSchema = z.object({
  ...paginationSchema.shape,
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  zoneId: idSchema.optional(),
  search: z.string().optional(),
  availability: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE', 'ON_BREAK']).optional(),
  sortBy: z.enum(['name', 'rating', 'deliveryCount', 'createdAt']).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
});

// Kurye kazanç filtre şeması
export const courierEarningsFilterSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  timeRange: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
});

// Kazanç haftalık istatistik tipi
export type WeeklyStat = {
  day: string;
  amount: number;
};

// Ödeme tipi
export type Payment = {
  id: string; 
  date: Date;
  amount: number;
  status: string;
};

// Kurye kazanç yanıt tipi
export type EarningsResponse = {
  totalEarnings: number;
  pendingPayments: number;
  weeklyStats: WeeklyStat[];
  monthlyTotal: number;
  deliveryCount: number;
  bonuses: number;
  lastPayments: Payment[];
}; 