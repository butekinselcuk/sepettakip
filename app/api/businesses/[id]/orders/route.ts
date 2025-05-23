import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const statusParam = searchParams.get("status");
    const status = statusParam && statusParam !== "ALL" ? statusParam : undefined;

    const skip = (page - 1) * limit;

    // If search term exists, find matching customer IDs first
    let customerIds: string[] = [];
    if (search) {
      const matchingCustomers = await prisma.customer.findMany({
        where: {
          user: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
        select: { id: true },
      });
      customerIds = matchingCustomers.map(c => c.id);
    }

    // Get total count
    const totalItems = await prisma.order.count({
      where: {
        businessId: params.id,
        ...(status ? { status: status as any } : {}),
        ...(search ? {
          OR: [
            { id: { contains: search, mode: "insensitive" } },
            { customerId: { in: customerIds } },
          ],
        } : {}),
      },
    });

    // Get orders
    const orders = await prisma.order.findMany({
      where: {
        businessId: params.id,
        ...(status ? { status: status as any } : {}),
        ...(search ? {
          OR: [
            { id: { contains: search, mode: "insensitive" } },
            { customerId: { in: customerIds } },
          ],
        } : {}),
      },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        courier: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      orders,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("[BUSINESS_ORDERS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 