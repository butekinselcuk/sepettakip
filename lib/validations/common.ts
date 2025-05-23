import { z } from 'zod';

// Genel kullanım için basit şemalar
export const idSchema = z.string().uuid();
export const dateSchema = z.coerce.date();
export const emailSchema = z.string().email();
export const phoneSchema = z.string().min(10).max(13);
export const passwordSchema = z.string().min(8).max(100);
export const coordinatesSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

// Pagination için şema
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

// Sıralama için şema
export const sortSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc']).default('desc'),
});

// Tarih aralığı için şema
export const dateRangeSchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
});

// Adres şeması
export const addressSchema = z.object({
  street: z.string().min(3),
  district: z.string().min(2).optional(),
  city: z.string().min(2),
  postalCode: z.string().optional(),
  country: z.string().default('Türkiye'),
  notes: z.string().optional(),
}); 