import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ordersEligibleForStationPrintWhere } from "@/lib/kitchen-queue";
import { printAgentApiDisabledReason, restaurantForPrintAgentRequest } from "@/lib/print-agent-auth";
import { isPrintStationKey } from "@/lib/print-station-routing";

/**
 * POST /api/print-agent/ack?slug=<restaurantSlug>
 * Header: X-Print-Agent-Secret: <PRINT_AGENT_API_SECRET>
 * Body: { "orderId": "<cuid>", "stationKey": "bar|cold-kitchen|kitchen" }
 */
export async function POST(req: NextRequest) {
  const disabled = printAgentApiDisabledReason();
  if (disabled === "missing_secret") {
    return NextResponse.json(
      { error: "Print agent API is not configured. Set PRINT_AGENT_API_SECRET on the server." },
      { status: 503 }
    );
  }

  const slug = req.nextUrl.searchParams.get("slug");
  const restaurant = await restaurantForPrintAgentRequest(
    req.headers.get("x-print-agent-secret"),
    slug
  );
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
      AND: [{ id: orderId }, ordersEligibleForStationPrintWhere(restaurant.id)],
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
