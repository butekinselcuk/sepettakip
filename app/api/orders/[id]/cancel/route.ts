import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyJwtToken } from '@/lib/auth';
import { Role, CancellationRequestStatus, CancellationReason } from '@prisma/client';
import { differenceInMinutes } from 'date-fns';

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
    
    // Validate reason
    if (!data.reason || !Object.values(CancellationReason).includes(data.reason)) {
      return NextResponse.json(
        { error: "Valid reason is required" },
        { status: 400 }
      );
    }

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
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
        { error: "You can only cancel your own orders" },
        { status: 403 }
      );
    }

    // Check if a cancellation request already exists
    const existingRequest = await prisma.cancellationRequest.findFirst({
      where: {
        orderId: orderId,
        status: {
          in: [CancellationRequestStatus.PENDING, CancellationRequestStatus.APPROVED]
        }
      }
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          error: "A cancellation request already exists for this order",
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
    let cancellationFee = 0;
    let autoApproveReason = "";

    if (policy) {
      // Check time-based rules
      const orderCreationTime = new Date(order.createdAt);
      const currentTime = new Date();
      const minutesSinceOrder = differenceInMinutes(currentTime, orderCreationTime);

      // Check if auto-approve by time is configured
      if (policy.autoApproveTimeline !== null && minutesSinceOrder <= policy.autoApproveTimeline) {
        autoApprove = true;
        autoApproveReason = `Auto-approved: within ${policy.autoApproveTimeline} minutes of order creation`;
      }

      // Check order status rules
      if (policy.orderStatusRules && policy.orderStatusRules[order.status]) {
        const statusRule = policy.orderStatusRules[order.status];
        if (!statusRule.allowCancellation) {
          return NextResponse.json(
            { error: `Cancellation is not allowed for orders in ${order.status} status` },
            { status: 400 }
          );
        }
        cancellationFee = statusRule.cancellationFeePercentage || 0;
      }

      // Check time-based fees
      if (policy.cancellationFees && policy.cancellationFees.length > 0) {
        for (const feeRule of policy.cancellationFees) {
          if (minutesSinceOrder >= feeRule.minMinutes && 
              (feeRule.maxMinutes === null || minutesSinceOrder <= feeRule.maxMinutes)) {
            cancellationFee = feeRule.feePercentage;
            break;
          }
        }
      }
    }

    // Calculate fee amount
    const feeAmount = (order.totalPrice * cancellationFee) / 100;

    // Create the cancellation request
    const cancellationRequest = await prisma.cancellationRequest.create({
      data: {
        orderId: orderId,
        customerId: order.customerId,
        businessId: order.businessId,
        reason: data.reason,
        otherReason: data.otherReason,
        customerNotes: data.notes,
        status: autoApprove ? CancellationRequestStatus.AUTO_APPROVED : CancellationRequestStatus.PENDING,
        autoProcessed: autoApprove,
        cancellationFee: feeAmount,
        businessNotes: autoApprove ? autoApproveReason : null
      }
    });

    // If auto-approved, update the order status
    if (autoApprove) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELED",
          cancelledAt: new Date()
        }
      });

      // Create notification for business about auto-approval
      await prisma.notification.create({
        data: {
          type: "ORDER_CANCELLED",
          title: "Order Automatically Cancelled",
          content: `Order #${order.orderNumber} was automatically cancelled based on your policy settings`,
          userId: order.business.userId,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            cancellationRequestId: cancellationRequest.id
          }
        }
      });
    } else {
      // Create notification for business about pending request
      await prisma.notification.create({
        data: {
          type: "CANCELLATION_REQUEST",
          title: "New Cancellation Request",
          content: `A cancellation request has been submitted for order #${order.orderNumber}`,
          userId: order.business.userId,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            cancellationRequestId: cancellationRequest.id
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      requestId: cancellationRequest.id,
      status: cancellationRequest.status,
      autoApproved: autoApprove,
      cancellationFee: feeAmount
    });
  } catch (error) {
    console.error("Error processing cancellation request:", error);
    return NextResponse.json(
      { error: "Failed to process cancellation request" },
      { status: 500 }
    );
  }
} 