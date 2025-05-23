import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from '@/lib/auth';
import { Role } from '@prisma/client';
import { differenceInDays } from "date-fns";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1] || request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const data = await request.json();
    const orderId = params.id;

    // Validate inputs
    if (!data.reason) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      );
    }

    if (!data.refundAmount || isNaN(data.refundAmount) || data.refundAmount <= 0) {
      return NextResponse.json(
        { error: "Valid refund amount is required" },
        { status: 400 }
      );
    }

    // Get the order with related data
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        business: true,
        customer: {
          select: {
            id: true,
            userId: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Verify user owns the order or is an admin
    if (decoded.role === Role.CUSTOMER && order.customer?.userId !== decoded.userId) {
      return NextResponse.json(
        { error: "You can only request refunds for your own orders" },
        { status: 403 }
      );
    }

    // Check if order is delivered (can only refund delivered orders)
    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Only delivered orders can be refunded" },
        { status: 400 }
      );
    }

    // Validate refund amount doesn't exceed order total
    if (data.refundAmount > order.totalPrice) {
      return NextResponse.json(
        { error: "Refund amount cannot exceed order total" },
        { status: 400 }
      );
    }

    // Check if a refund request already exists
    const existingRequest = await prisma.refundRequest.findFirst({
      where: {
        orderId: orderId,
        status: {
          in: ["PENDING", "APPROVED", "PARTIAL_APPROVED", "AUTO_APPROVED"]
        }
      }
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          error: "A refund request already exists for this order",
          requestId: existingRequest.id,
          status: existingRequest.status
        },
        { status: 400 }
      );
    }

    // Get active policy for the business
    const policy = await prisma.refundPolicy.findFirst({
      where: {
        businessId: order.businessId,
        isActive: true
      }
    });

    // Default values if no policy exists
    let autoApprove = false;
    let autoApproveReason = "";
    let allowRefund = true;

    if (policy) {
      // Check time limit
      if (policy.timeLimit !== null) {
        const orderDeliveryTime = order.actualDelivery ? new Date(order.actualDelivery) : new Date(order.updatedAt);
        const currentTime = new Date();
        const daysSinceDelivery = differenceInDays(currentTime, orderDeliveryTime);
        
        if (daysSinceDelivery > policy.timeLimit) {
          return NextResponse.json(
            { error: `Refund requests must be made within ${policy.timeLimit} days of delivery` },
            { status: 400 }
          );
        }

        // Auto-approve if within timeframe
        if (policy.autoApproveTimeline !== null && daysSinceDelivery <= policy.autoApproveTimeline) {
          autoApprove = true;
          autoApproveReason = `Auto-approved: within ${policy.autoApproveTimeline} days of delivery`;
        }
      }

      // Check product category rules if items are specified
      if (data.items && data.items.length > 0 && policy.productRules) {
        // This would require item category information in a real implementation
        // For now, we'll just check if there are any non-refundable categories
        const categoryRules = policy.productRules as Record<string, {refundable: boolean}>;
        
        // Check if any category is marked as non-refundable
        const hasNonRefundableCategory = Object.values(categoryRules).some(rule => rule.refundable === false);
        
        if (hasNonRefundableCategory) {
          // For a complete implementation, we would check each item against its category rule
          allowRefund = true; // Simplified for this example
        }
      }
    }

    // If refund is not allowed based on policies
    if (!allowRefund) {
      return NextResponse.json(
        { error: "Refund is not allowed for these items based on business policy" },
        { status: 400 }
      );
    }

    // Process the refund request
    const refundRequest = await prisma.refundRequest.create({
      data: {
        orderId: orderId,
        customerId: order.customerId,
        businessId: order.businessId,
        reason: data.reason,
        otherReason: data.otherReason,
        customerNotes: data.notes,
        refundAmount: data.refundAmount,
        approvedAmount: autoApprove ? data.refundAmount : null,
        status: autoApprove ? "AUTO_APPROVED" : "PENDING",
        autoProcessed: autoApprove,
        businessNotes: autoApprove ? autoApproveReason : null,
        requestedItems: data.items || [],
        evidenceUrls: data.evidenceUrls || []
      }
    });

    // Create notification for business
    await prisma.notification.create({
      data: {
        type: autoApprove ? "REFUND_APPROVED" : "REFUND_REQUEST",
        title: autoApprove ? "Refund Automatically Approved" : "New Refund Request",
        content: autoApprove 
          ? `A refund of ${data.refundAmount} for order #${order.orderNumber} was automatically approved`
          : `A new refund request has been submitted for order #${order.orderNumber}`,
        userId: order.business.userId,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          refundRequestId: refundRequest.id,
          amount: data.refundAmount
        }
      }
    });

    // Create notification for customer
    await prisma.notification.create({
      data: {
        type: autoApprove ? "REFUND_APPROVED" : "REFUND_REQUESTED",
        title: autoApprove ? "Your Refund Was Approved" : "Refund Request Submitted",
        content: autoApprove 
          ? `Your refund of ${data.refundAmount} for order #${order.orderNumber} has been approved`
          : `Your refund request for order #${order.orderNumber} has been submitted and is pending review`,
        userId: order.customer.userId,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          refundRequestId: refundRequest.id,
          amount: data.refundAmount
        }
      }
    });

    return NextResponse.json({
      success: true,
      requestId: refundRequest.id,
      status: refundRequest.status,
      autoApproved: autoApprove,
      amount: data.refundAmount
    });
  } catch (error) {
    console.error("Error processing refund request:", error);
    return NextResponse.json(
      { error: "Failed to process refund request" },
      { status: 500 }
    );
  }
} 