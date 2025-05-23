import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

/**
 * Test token endpoint for development purposes
 * This endpoint is only available in development mode
 * Returns a token with admin permissions for testing
 */
export async function GET() {
  // Only allow in development environment
  if (process.env.NODE_ENV !== 'development' && process.env.TEST_TOKEN_ADMIN !== 'true') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  // Create a mock admin user for token
  const mockAdminId = `admin-test-id-${Date.now()}`;
  
  // Create a JWT token with admin permissions
  // This token will expire in 30 days (for development convenience)
  const token = jwt.sign(
    {
      id: mockAdminId,
      email: 'admin@sepettakip.com',
      role: 'ADMIN',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
    },
    process.env.JWT_SECRET || 'test_jwt_secret'
  );

  return NextResponse.json({ token });
} 