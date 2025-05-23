import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-development';

// Test kullanıcıları listesi - sadece test ortamı için
const TEST_USERS = {
  'admin@example.com': {
    password: 'Test123',
    role: 'ADMIN',
    name: 'Test Admin'
  },
  'business@example.com': {
    password: 'Test123',
    role: 'BUSINESS',
    name: 'Test Business'
  },
  'courier@example.com': {
    password: 'Test123',
    role: 'COURIER',
    name: 'Test Courier'
  },
  'customer@example.com': {
    password: 'Test123',
    role: 'CUSTOMER',
    name: 'Test Customer'
  }
};

/**
 * TEST ONLY: Test kullanıcıları için basitleştirilmiş login
 * Bu sadece test amaçlı kullanılmalıdır, üretim ortamına çıkmamalıdır
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { email, password, bypass = false } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // If bypass is false, verify password
    let validPassword = true; // Default for bypass mode
    if (!bypass) {
      if (!password) {
        return NextResponse.json(
          { success: false, error: 'Password is required when bypass is disabled' },
          { status: 400 }
        );
      }

      if (user.password) {
        // Check if using bcrypt or bcryptjs format
        try {
          validPassword = await bcryptjs.compare(password, user.password);
        } catch (err) {
          console.error('Password comparison error:', err);
          validPassword = false;
        }
      } else {
        validPassword = false;
      }

      if (!validPassword) {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        );
      }
    }

    // Create a token
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role,
    };

    const token = jwt.sign(userData, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Determine redirect URL based on user role
    let redirectUrl = '/';
    switch (user.role) {
      case 'ADMIN':
        redirectUrl = '/admin/dashboard';
        break;
      case 'BUSINESS':
        redirectUrl = '/business/dashboard';
        break;
      case 'COURIER':
        redirectUrl = '/courier/dashboard';
        break;
      case 'CUSTOMER':
        redirectUrl = '/customer/dashboard';
        break;
    }

    // Create response with token
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: userData,
      redirectUrl,
      bypass,
    });

    // Set cookie in the response
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Test login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        stack: process.env.NODE_ENV !== 'production' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'This endpoint only accepts POST requests',
  }, { status: 405 });
} 