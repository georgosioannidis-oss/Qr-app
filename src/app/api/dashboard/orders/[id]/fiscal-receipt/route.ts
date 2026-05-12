import { NextRequest, NextResponse } from "next/server";
import { getDashboardServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { requireWaitStaffApiAccess } from "@/lib/require-wait-staff-api";

/**
 * POST /api/dashboard/orders/[id]/fiscal-receipt
 * Marks this order as needing a fiscal receipt print.
 * The print agent polls for orders with fiscalReceiptRequestedAt set and no ack yet.
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

  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    select: { id: true, status: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Mark order as needing a fiscal receipt — the print agent picks this up
  await prisma.order.update({
    where: { id: orderId },
    data: { fiscalReceiptRequestedAt: new Date() },
  });

  return NextResponse.json({ ok: true, message: "Fiscal receipt queued for printing" });
}
