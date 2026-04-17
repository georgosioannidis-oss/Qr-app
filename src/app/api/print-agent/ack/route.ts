import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ordersInKitchenQueueWhere } from "@/lib/kitchen-queue";
import { restaurantForPrintAgentBearer } from "@/lib/print-agent-auth";
import { isPrintStationKey } from "@/lib/print-station-routing";

/**
 * POST /api/print-agent/ack
 * Authorization: Bearer <printAgentToken>
 * Body: { "orderId": "<cuid>", "stationKey": "bar|cold-kitchen|kitchen" }
 *
 * Marks the order as printed by the agent (idempotent if already acked).
 */
export async function POST(req: NextRequest) {
  const restaurant = await restaurantForPrintAgentBearer(req.headers.get("authorization"));
  if (!restaurant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { orderId?: string; stationKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }
  const stationKey = typeof body.stationKey === "string" ? body.stationKey.trim() : "";
  if (!isPrintStationKey(stationKey)) {
    return NextResponse.json({ error: "stationKey must be one of: bar, cold-kitchen, kitchen" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      AND: [{ id: orderId }, ordersInKitchenQueueWhere(restaurant.id)],
    },
    select: { id: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found or not in kitchen queue" }, { status: 404 });
  }

  const existing = await prisma.orderStationPrintAck.findUnique({
    where: {
      orderId_stationKey: {
        orderId: order.id,
        stationKey,
      },
    },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ ok: true, alreadyAcked: true });
  }

  await prisma.orderStationPrintAck.create({
    data: {
      orderId: order.id,
      stationKey,
      restaurantId: restaurant.id,
    },
  });

  return NextResponse.json({ ok: true });
}
