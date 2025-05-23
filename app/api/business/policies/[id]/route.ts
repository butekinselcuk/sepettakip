import { NextRequest, NextResponse } from "next/server";
import { verifyJwtToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from '@prisma/client';

// Get a specific policy
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1] || request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || decoded.role !== Role.BUSINESS) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the business
    const business = await prisma.business.findFirst({
      where: { userId: decoded.userId }
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Get the policy and ensure it belongs to the business
    const policy = await prisma.refundPolicy.findFirst({
      where: {
        id: params.id,
        businessId: business.id
      }
    });

    if (!policy) {
      return NextResponse.json(
        { error: "Policy not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ policy });
  } catch (error) {
    console.error("Error getting policy:", error);
    return NextResponse.json(
      { error: "Policy could not be retrieved" },
      { status: 500 }
    );
  }
}

// Update a policy
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1] || request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || decoded.role !== Role.BUSINESS) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the business
    const business = await prisma.business.findFirst({
      where: { userId: decoded.userId }
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Check if the policy exists and belongs to the business
    const existingPolicy = await prisma.refundPolicy.findFirst({
      where: {
        id: params.id,
        businessId: business.id
      }
    });

    if (!existingPolicy) {
      return NextResponse.json(
        { error: "Policy not found" },
        { status: 404 }
      );
    }

    const data = await request.json();

    // Update the policy
    const updatedPolicy = await prisma.refundPolicy.update({
      where: { id: params.id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        description: data.description !== undefined ? data.description : undefined,
        autoApproveTimeline: data.autoApproveTimeline !== undefined ? data.autoApproveTimeline : undefined,
        timeLimit: data.timeLimit !== undefined ? data.timeLimit : undefined,
        orderStatusRules: data.orderStatusRules !== undefined ? data.orderStatusRules : undefined,
        productRules: data.productRules !== undefined ? data.productRules : undefined,
        cancellationFees: data.cancellationFees !== undefined ? data.cancellationFees : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined
      }
    });

    return NextResponse.json({ policy: updatedPolicy });
  } catch (error) {
    console.error("Error updating policy:", error);
    return NextResponse.json(
      { error: "Policy could not be updated" },
      { status: 500 }
    );
  }
}

// Delete a policy
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1] || request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || decoded.role !== Role.BUSINESS) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the business
    const business = await prisma.business.findFirst({
      where: { userId: decoded.userId }
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Check if the policy exists and belongs to the business
    const existingPolicy = await prisma.refundPolicy.findFirst({
      where: {
        id: params.id,
        businessId: business.id
      }
    });

    if (!existingPolicy) {
      return NextResponse.json(
        { error: "Policy not found" },
        { status: 404 }
      );
    }

    // Delete the policy
    await prisma.refundPolicy.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting policy:", error);
    return NextResponse.json(
      { error: "Policy could not be deleted" },
      { status: 500 }
    );
  }
} 