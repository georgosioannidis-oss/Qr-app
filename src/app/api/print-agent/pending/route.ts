import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ordersInKitchenQueueWhere } from "@/lib/kitchen-queue";
import { restaurantForPrintAgentBearer } from "@/lib/print-agent-auth";
import {
  isPrintStationKey,
  type PrintStationKey,
  printStationLabel,
  stationKeyFromName,
} from "@/lib/print-station-routing";

export const dynamic = "force-dynamic";

/**
 * GET /api/print-agent/pending
 * Authorization: Bearer <printAgentToken>
 *
 * Query param:
 *   station=bar|cold-kitchen|kitchen
 *
 * Returns station-specific tickets not yet acknowledged by the print agent for that station.
 */
export async function GET(req: NextRequest) {
  const restaurant = await restaurantForPrintAgentBearer(req.headers.get("authorization"));
  if (!restaurant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const station = req.nextUrl.searchParams.get("station") ?? "";
  if (!isPrintStationKey(station)) {
    return NextResponse.json({ error: "station query must be one of: bar, cold-kitchen, kitchen" }, { status: 400 });
  }
  const stationKey: PrintStationKey = station;

  const orders = await prisma.order.findMany({
    where: {
      AND: [ordersInKitchenQueueWhere(restaurant.id)],
    },
    orderBy: { createdAt: "asc" },
    take: 25,
    include: {
      table: { select: { name: true, token: true } },
      restaurant: { select: { name: true } },
      stationAcks: {
        where: { stationKey },
        select: { stationKey: true },
      },
      items: {
        include: {
          menuItem: {
            select: {
              name: true,
              station: { select: { name: true } },
              category: { select: { station: { select: { name: true } } } },
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
      const isCombinedKitchenStation = stationKey === "kitchen" || stationKey === "cold-kitchen";
      const stationItems = o.items
        .filter((row) => {
          const effectiveStationName = row.menuItem.station?.name ?? row.menuItem.category?.station?.name ?? null;
          const itemStation = stationKeyFromName(effectiveStationName);
          if (isCombinedKitchenStation) return itemStation !== "bar";
          return itemStation === stationKey;
        })
        .map((row) => ({
          quantity: row.quantity,
          name: row.menuItem.name,
          unitPrice: row.unitPrice,
          notes: row.notes,
          selectedOptionsSummary: row.selectedOptionsSummary,
          routedStation: printStationLabel(
            stationKeyFromName(
              row.menuItem.station?.name ?? row.menuItem.category?.station?.name ?? null
            )
          ),
        }));

      return {
        id: o.id,
        station: stationKey,
        stationLabel: printStationLabel(stationKey),
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

  return NextResponse.json({ orders: payload, station: stationKey });
}
