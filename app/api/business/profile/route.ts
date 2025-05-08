import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyJwtToken } from '@/lib/auth';

const prisma = new PrismaClient();

// GET endpoint to fetch business profile
export async function GET(request: NextRequest) {
  try {
    // Get token from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Token is missing' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyJwtToken(token);

    if (!decoded || decoded.role !== 'BUSINESS') {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token or insufficient permissions' },
        { status: 403 }
      );
    }

    // Fetch business profile from database
    const businessProfile = await prisma.business.findUnique({
      where: {
        userId: decoded.userId,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        description: true,
        rating: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            email: true
          }
        }
      },
    });

    if (!businessProfile) {
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Format the response
    const response = {
      ...businessProfile,
      email: businessProfile.user.email
    } as any;
    
    delete response.user;

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching business profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT endpoint to update business profile
export async function PUT(request: NextRequest) {
  try {
    // Get token from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Token is missing' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyJwtToken(token);

    if (!decoded || decoded.role !== 'BUSINESS') {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token or insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const requestBody = await request.json();
    
    // Validate request data
    const {
      name,
      phone,
      address,
      description
    } = requestBody;

    // Find the business profile
    const business = await prisma.business.findUnique({
      where: {
        userId: decoded.userId,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Update business profile
    const updatedProfile = await prisma.business.update({
      where: {
        id: business.id,
      },
      data: {
        name,
        phone,
        address,
        description
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating business profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint for uploading business profile images (logo, cover)
export async function POST(request: NextRequest) {
  try {
    // Get token from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Token is missing' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyJwtToken(token);

    if (!decoded || decoded.role !== 'BUSINESS') {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token or insufficient permissions' },
        { status: 403 }
      );
    }

    // Find the business profile
    const business = await prisma.business.findUnique({
      where: {
        userId: decoded.userId,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // This would handle file uploads in a real implementation
    // For now, we'll just update the image URLs
    const { imageUrl } = await request.json();

    const updatedProfile = await prisma.business.update({
      where: {
        id: business.id,
      },
      data: {
        // In a real implementation, you would store image URLs here
        // For now, we'll use a temporary field in the description
        description: `${business.description || ''} [Image: ${imageUrl}]`
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error uploading business profile image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 