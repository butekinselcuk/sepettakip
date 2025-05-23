import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    jwtSecret: process.env.JWT_SECRET ? 'Tanımlı ✅' : 'Tanımlı değil ❌',
    nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'Tanımlı ✅' : 'Tanımlı değil ❌',
    nextAuthUrl: process.env.NEXTAUTH_URL ? 'Tanımlı ✅' : 'Tanımlı değil ❌',
    databaseUrl: process.env.DATABASE_URL ? 'Tanımlı ✅' : 'Tanımlı değil ❌',
    nodeEnv: process.env.NODE_ENV || 'Tanımlı değil'
  });
} 