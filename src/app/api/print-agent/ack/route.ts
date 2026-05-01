import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ordersForStationPrintAgent } from "@/lib/kitchen-queue";
import { authorizePrintAgentRestaurant, printAgentApiDisabledReason } from "@/lib/print-agent-auth";
import { stationSlug } from "@/lib/print-station-routing";

/**
 * POST /api/print-agent/ack?slug=<restaurantSlug>
 * Header: X-Print-Agent-Secret: <PRINT_AGENT_API_SECRET>
 * Body: { "orderId": "<cuid>", "stationKey": "<stationSlug>" }
 *
 * stationKey is the human-readable slug (e.g. "grill", "bar").
 * Internally the ack is stored keyed by Station.id for rename-safety.
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
  const auth = await authorizePrintAgentRestaurant(req.headers.get("x-print-agent-secret"), slug);
  if (!auth.ok) {
    const f = auth.failure;
    if (f.kind === "invalid_secret") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (f.kind === "missing_slug") return NextResponse.json({ error: "slug query required" }, { status: 400 });
    return NextResponse.json({ error: "Unknown restaurant slug", slug: f.slug }, { status: 404 });
  }
  const { restaurant } = auth;

  let body: { orderId?: string; stationKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const stationParam = typeof body.stationKey === "string" ? body.stationKey.trim() : "";
  if (!stationParam) return NextResponse.json({ error: "stationKey required" }, { status: 400 });

  // Special station: "receipt" — tracked with literal key, not a Station.id.
  if (stationParam === "receipt") {
    const order = await prisma.order.findFirst({
      where: { AND: [{ id: orderId }, ordersForStationPrintAgent(restaurant.id)] },
      select: { id: true },
    });
    if (!order) return NextResponse.json({ error: "Order not found or not in kitchen queue" }, { status: 404 });

    const existing = await prisma.orderStationPrintAck.findUnique({
      where: { orderId_stationKey: { orderId: order.id, stationKey: "receipt" } },
      select: { id: true },
    });
    if (existing) return NextResponse.json({ ok: true, alreadyAcked: true });

    await prisma.orderStationPrintAck.create({
      data: { orderId: order.id, stationKey: "receipt", restaurantId: restaurant.id },
    });
    return NextResponse.json({ ok: true });
  }

  const stations = await prisma.station.findMany({
    where: { restaurantId: restaurant.id },
    select: { id: true, name: true },
  });
  const matched = stations.find((s) => stationSlug(s.name) === stationParam);
  if (!matched) {
    const available = stations.map((s) => stationSlug(s.name)).join(", ") || "(none configured)";
    return NextResponse.json(
      { error: `Unknown station "${stationParam}". Available: ${available}` },
      { status: 400 }
    );
  }

  const order = await prisma.order.findFirst({
    where: { AND: [{ id: orderId }, ordersForStationPrintAgent(restaurant.id)] },
    select: { id: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found or not in kitchen queue" }, { status: 404 });
  }

  const existing = await prisma.orderStationPrintAck.findUnique({
    where: { orderId_stationKey: { orderId: order.id, stationKey: matched.id } },
    select: { id: true },
  });
  if (existing) return NextResponse.json({ ok: true, alreadyAcked: true });

  await prisma.orderStationPrintAck.create({
    data: { orderId: order.id, stationKey: matched.id, restaurantId: restaurant.id },
  });

  return NextResponse.json({ ok: true });
}
