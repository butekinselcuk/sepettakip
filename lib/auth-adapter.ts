import { compare, hash } from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sign, verify } from './auth';
import { prisma } from './prisma';
import { CourierAvailabilityStatus } from '@prisma/client';

// User type definition
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Authentication error class
export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

/**
 * Login a user with email and password
 */
export async function loginUser(email: string, password: string): Promise<User> {
  // Test users for development
  const testUsers = {
    'admin1@example.com': 'Test123',
    'business1@example.com': 'Test123',
    'courier1@example.com': 'Test123',
    'customer1@example.com': 'Test123'
  };
  
  const isTestUser = email in testUsers && password === testUsers[email as keyof typeof testUsers];
  
  // Find the user
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    if (isTestUser) {
      // Create test user if it doesn't exist
      const role = email.startsWith('admin') ? 'ADMIN' : 
                  email.startsWith('business') ? 'BUSINESS' :
                  email.startsWith('courier') ? 'COURIER' : 'CUSTOMER';
      
      const hashedPassword = await hash(password, 10);
      
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: `Test ${role}`,
          role,
        }
      });
      
      // Create role-specific record
      if (role === 'ADMIN') {
        await prisma.admin.create({
          data: {
            userId: newUser.id,
          }
        });
      } else if (role === 'BUSINESS') {
        await prisma.business.create({
          data: {
            userId: newUser.id,
            name: "Test Business",
            address: "Test Address",
            phone: "+905551234568",
          }
        });
      } else if (role === 'COURIER') {
        await prisma.courier.create({
          data: {
            userId: newUser.id,
            phone: "+905551234567",
            status: "ACTIVE",
            availabilityStatus: CourierAvailabilityStatus.AVAILABLE,
          }
        });
      } else if (role === 'CUSTOMER') {
        await prisma.customer.create({
          data: {
            userId: newUser.id,
            phone: "+905551234569",
            address: "Test Customer Address",
          }
        });
      }
      
      // Create user settings
      await prisma.userSettings.create({
        data: {
          userId: newUser.id,
          theme: "light",
          language: "tr",
          notifications: true,
        }
      });
      
      return {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      };
    }
    
    throw new AuthError('Invalid email or password');
  }
  
  // For test users, skip password check
  if (!isTestUser) {
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthError('Invalid email or password');
    }
  }
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
}

/**
 * Create a JWT token and set cookie
 */
export async function createSession(user: User, response: NextResponse): Promise<string> {
  const token = await sign({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });
  
  response.cookies.set({
    name: 'token',
    value: token,
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  
  return token;
}

/**
 * Get user from request
 */
export async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    const payload = await verify(token);
    
    return {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Get redirect URL based on user role
 */
export function getRedirectUrl(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'BUSINESS':
      return '/business/dashboard';
    case 'COURIER':
      return '/courier/dashboard';
    case 'CUSTOMER':
      return '/customer/dashboard';
    default:
      return '/';
  }
} 