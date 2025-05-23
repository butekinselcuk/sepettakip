import { z } from 'zod';
import { emailSchema, passwordSchema, phoneSchema } from './common';

// Giriş şeması
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  rememberMe: z.boolean().default(false),
});

// Kayıt şeması
export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: passwordSchema,
  phone: phoneSchema.optional(),
  role: z.enum(['ADMIN', 'BUSINESS', 'COURIER', 'CUSTOMER']),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Kullanım şartlarını kabul etmelisiniz',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

// Şifre sıfırlama isteği şeması
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Şifre sıfırlama şeması
export const resetPasswordSchema = z.object({
  token: z.string(),
  password: passwordSchema,
  confirmPassword: passwordSchema,
}).refine(data => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

// Token doğrulama şeması
export const verifyTokenSchema = z.object({
  token: z.string(),
});

// JWT token payload tipi
export type JWTPayload = {
  userId: string;
  email: string;
  role: string;
  businessId?: string;
  courierId?: string;
  customerId?: string;
  exp?: number;
  iat?: number;
}; 