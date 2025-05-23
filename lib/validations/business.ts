import { z } from 'zod';
import { addressSchema, idSchema, paginationSchema } from './common';

// İşletme durumları
export const businessStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED'
]);

// İşletme oluşturma şeması
export const createBusinessSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(500).optional(),
  address: z.string().min(5),
  phone: z.string().min(10).max(15),
  website: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  zoneId: idSchema.optional(),
  tax_id: z.string().optional(),
  bank_iban: z.string().optional(),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  deliveryRadius: z.number().positive().optional(),
});

// İşletme güncelleme şeması
export const updateBusinessSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().min(10).max(500).optional(),
  address: z.string().min(5).optional(),
  phone: z.string().min(10).max(15).optional(),
  website: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  zoneId: idSchema.optional(),
  tax_id: z.string().optional(),
  bank_iban: z.string().optional(),
  status: businessStatusEnum.optional(),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  deliveryRadius: z.number().positive().optional(),
});

// İşletme filtre şeması
export const businessFilterSchema = z.object({
  ...paginationSchema.shape,
  status: businessStatusEnum.optional(),
  zoneId: idSchema.optional(),
  search: z.string().optional(),
});

// Menü öğesi şeması
export const menuItemSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive(),
  imageUrl: z.string().url().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  ingredients: z.array(z.string()).optional(),
  calories: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
});

// Menü öğesi güncelleme şeması
export const updateMenuItemSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  price: z.number().positive().optional(),
  imageUrl: z.string().url().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  ingredients: z.array(z.string()).optional(),
  calories: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

// İşletme yanıt tipi
export type BusinessProfileResponse = {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  website?: string;
  logoUrl?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  rating?: number;
  tax_id?: string;
  bank_iban?: string;
  openingTime?: string;
  closingTime?: string;
  deliveryRadius?: number;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}; 