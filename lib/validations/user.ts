import { z } from 'zod';
import { emailSchema, idSchema, paginationSchema, passwordSchema, phoneSchema } from './common';

// Kullanıcı rolleri
export const userRoleEnum = z.enum([
  'ADMIN',
  'BUSINESS',
  'COURIER',
  'CUSTOMER'
]);

// Kullanıcı durumları
export const userStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED'
]);

// Kullanıcı oluşturma şeması
export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: emailSchema,
  password: passwordSchema,
  role: userRoleEnum,
  phone: phoneSchema.optional(),
});

// Kullanıcı güncelleme şeması
export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: emailSchema.optional(),
  role: userRoleEnum.optional(),
  phone: phoneSchema.optional(),
  password: passwordSchema.optional(),
});

// Kullanıcı filtre şeması
export const userFilterSchema = z.object({
  ...paginationSchema.shape,
  role: userRoleEnum.optional(),
  search: z.string().optional(),
});

// Kullanıcı ayarları şeması
export const userSettingsSchema = z.object({
  language: z.string().default('tr'),
  theme: z.enum(['light', 'dark', 'system']).default('light'),
  notifications: z.boolean().default(true),
});

// Kullanıcı profili yanıt tipi
export type UserProfileResponse = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  createdAt: Date;
  settings?: {
    language: string;
    theme: string;
    notifications: boolean;
  };
}; 