import { NextRequest, NextResponse } from "next/server";
import { getDashboardServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { requireWaitStaffApiAccess } from "@/lib/require-wait-staff-api";

/**
 * POST /api/dashboard/orders/[id]/fiscal-receipt
 * Queue a fiscal receipt print job for this order.
 * Only o-kipos restaurant is supported for now.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getDashboardServerSession(req);
  const forbidden = await requireWaitStaffApiAccess(session);
  if (forbidden) return forbidden;

  const restaurantId = session!.user.restaurantId!;
  const { id: orderId } = await params;

  // Verify order exists and belongs to this restaurant
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    select: { id: true, status: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Only allow for o-kipos for now
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { slug: true },
  });

  if (restaurant?.slug !== "o-kipos") {
    return NextResponse.json(
      { error: "Fiscal receipt printing is not enabled for this restaurant" },
      { status: 403 }
    );
  }

  // Create or update the fiscal print ack
  // This marks that a fiscal receipt needs to be printed for this order
  await prisma.orderStationPrintAck.upsert({
    where: { orderId_stationKey: { orderId, stationKey: "fiscal" } },
    update: { printedAt: new Date() },
    create: {
      orderId,
      stationKey: "fiscal",
      restaurantId,
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Fiscal receipt queued for printing",
  });
}
