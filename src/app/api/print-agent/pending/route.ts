import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ordersForStationPrintAgent, ordersInKitchenQueueWhere } from "@/lib/kitchen-queue";
import { authorizePrintAgentRestaurant, printAgentApiDisabledReason } from "@/lib/print-agent-auth";
import { stationSlug } from "@/lib/print-station-routing";

export const dynamic = "force-dynamic";

/**
 * GET /api/print-agent/pending?slug=<restaurantSlug>&station=<stationSlug>
 * Header: X-Print-Agent-Secret: <PRINT_AGENT_API_SECRET>
 *
 * stationSlug is the URL-safe form of the Station.name (e.g. "grill", "bar", "cold-kitchen").
 * Only items explicitly assigned to that Station are returned — unassigned items are excluded.
 * Ack tracking uses Station.id internally so station renames don't affect history.
 */
export async function GET(req: NextRequest) {
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

  const stationParam = (req.nextUrl.searchParams.get("station") ?? "").trim();
  if (!stationParam) {
    return NextResponse.json({ error: "station query required" }, { status: 400 });
  }

  // Special station: "fiscal" — returns orders where staff clicked "Print Fiscal Receipt" and not yet acked.
  if (stationParam === "fiscal") {
    const fiscalOrders = await prisma.order.findMany({
      where: {
        restaurantId: restaurant.id,
        fiscalReceiptRequestedAt: { not: null },
        stationAcks: { none: { stationKey: "fiscal" } },
      },
      orderBy: { fiscalReceiptRequestedAt: "asc" },
      take: 25,
      include: {
        table: { select: { name: true } },
        restaurant: { select: { name: true, vatRate: true } },
        items: {
          include: { menuItem: { select: { name: true } } },
          orderBy: { id: "asc" },
        },
      },
    });

    const payload = fiscalOrders.map((o) => ({
      id: o.id,
      station: "fiscal",
      stationLabel: "Fiscal Receipt",
      restaurantName: o.restaurant.name,
      vatRate: o.restaurant.vatRate ?? 0,
      tableName: o.table.name,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      totalAmount: o.totalAmount,
      items: o.items.map((row) => ({
        quantity: row.quantity,
        name: row.menuItem.name,
        unitPrice: row.unitPrice,
        notes: row.notes,
        selectedOptionsSummary: row.selectedOptionsSummary,
      })),
    }));

    const venue = {
      slug: (slug ?? "").trim(),
      name: restaurant.name,
      waiterRelayEnabled: restaurant.waiterRelayEnabled,
      onlinePaymentEnabled: restaurant.onlinePaymentEnabled === true,
    };
    return NextResponse.json({ orders: payload, station: "fiscal", venue });
  }

  // Special station: "receipt" — returns all items for every unprinted order (full customer receipt).
  if (stationParam === "receipt") {
    const receiptOrders = await prisma.order.findMany({
      where: { AND: [ordersForStationPrintAgent(restaurant.id)] },
      orderBy: { createdAt: "asc" },
      take: 25,
      include: {
        table: { select: { name: true } },
        restaurant: { select: { name: true, vatRate: true } },
        stationAcks: { where: { stationKey: "receipt" }, select: { stationKey: true } },
        items: {
          include: { menuItem: { select: { name: true } } },
          orderBy: { id: "asc" },
        },
      },
    });

    const payload = receiptOrders
      .filter((o) => o.stationAcks.length === 0)
      .map((o) => ({
        id: o.id,
        station: "receipt",
        stationLabel: "Receipt",
        restaurantName: o.restaurant.name,
        vatRate: o.restaurant.vatRate ?? 0,
        tableName: o.table.name,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
        totalAmount: o.totalAmount,
        items: o.items.map((row) => ({
          quantity: row.quantity,
          name: row.menuItem.name,
          unitPrice: row.unitPrice,
          notes: row.notes,
          selectedOptionsSummary: row.selectedOptionsSummary,
        })),
      }));

    const receiptVenue = {
      slug: (slug ?? "").trim(),
      name: restaurant.name,
      waiterRelayEnabled: restaurant.waiterRelayEnabled,
      onlinePaymentEnabled: restaurant.onlinePaymentEnabled === true,
    };
    return NextResponse.json({ orders: payload, station: "receipt", venue: receiptVenue });
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

  const orders = await prisma.order.findMany({
    where: { AND: [ordersForStationPrintAgent(restaurant.id)] },
    orderBy: { createdAt: "asc" },
    take: 25,
    include: {
      table: { select: { name: true, token: true } },
      restaurant: { select: { name: true } },
      stationAcks: {
        where: { stationKey: matched.id },
        select: { stationKey: true },
      },
      items: {
        include: {
          menuItem: {
            select: {
              name: true,
              stationId: true,
              station: { select: { id: true, name: true } },
              category: { select: { stationId: true, station: { select: { id: true, name: true } } } },
            },
          },
        },
        orderBy: { id: "asc" },
      },
    },
  });

  const payload = orders
    .filter((o) => o.stationAcks.length === 0)
    .map((o) => {
      const stationItems = o.items
        .filter((row) => {
          const effectiveStationId =
            row.menuItem.stationId ?? row.menuItem.category?.stationId ?? null;
          return effectiveStationId === matched.id;
        })
        .map((row) => ({
          quantity: row.quantity,
          name: row.menuItem.name,
          unitPrice: row.unitPrice,
          notes: row.notes,
          selectedOptionsSummary: row.selectedOptionsSummary,
          routedStation: matched.name,
        }));

      return {
        id: o.id,
        station: stationParam,
        stationLabel: matched.name,
        restaurantName: o.restaurant.name,
        tableName: o.table.name,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
        totalAmount: o.totalAmount,
        stationTotalAmount: stationItems.reduce((sum, row) => sum + row.unitPrice * row.quantity, 0),
        items: stationItems,
      };
    })
    .filter((o) => o.items.length > 0);

  const venue = {
    slug: (slug ?? "").trim(),
    name: restaurant.name,
    waiterRelayEnabled: restaurant.waiterRelayEnabled,
    onlinePaymentEnabled: restaurant.onlinePaymentEnabled === true,
  };

  let explain: {
    printableOrdersCount: number;
    kitchenListOrdersInStripeCheckoutPending: number;
    awaitingRelayAcceptCount: number;
    hint: string;
  } | null = null;
  if (req.nextUrl.searchParams.get("explain") === "1") {
    const rid = restaurant.id;
    const [printableOrdersCount, kitchenListOrdersInStripeCheckoutPending, awaitingRelayAcceptCount] =
      await Promise.all([
        prisma.order.count({ where: { AND: [ordersForStationPrintAgent(rid)] } }),
        prisma.order.count({
          where: {
            AND: [ordersInKitchenQueueWhere(rid), { status: "pending" }, { stripeSessionId: { not: null } }],
          },
        }),
        prisma.order.count({
          where: {
            restaurantId: rid,
            status: { notIn: ["delivered", "declined"] },
            restaurant: { waiterRelayEnabled: true },
            waiterRelayAt: null,
          },
        }),
      ]);
    let hint: string;
    if (restaurant.waiterRelayEnabled && awaitingRelayAcceptCount > 0 && printableOrdersCount === 0) {
      hint = `Waiter relay is on: ${awaitingRelayAcceptCount} order(s) are waiting for staff to accept/send to kitchen on the dashboard. The print agent only sees orders after that.`;
    } else if (printableOrdersCount === 0) {
      hint =
        "No orders in the kitchen queue. Place a test order or accept the order if waiter relay is on.";
    } else if (kitchenListOrdersInStripeCheckoutPending > 0) {
      hint = `${kitchenListOrdersInStripeCheckoutPending} order(s) are still in Stripe Checkout (pending); they are included in printing.`;
    } else {
      hint =
        "Orders match the kitchen queue; if this response has zero lines, every candidate may already be printed (acked) for this station, or no items are assigned to it.";
    }
    explain = { printableOrdersCount, kitchenListOrdersInStripeCheckoutPending, awaitingRelayAcceptCount, hint };
  }

  return NextResponse.json({
    orders: payload,
    station: stationParam,
    venue,
    ...(explain ? { explain } : {}),
  });
}
