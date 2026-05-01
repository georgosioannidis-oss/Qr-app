import { NextRequest, NextResponse } from "next/server";
import { getDashboardServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { resolveDashboardAccess } from "@/lib/staff-permissions";

const CONFIRMED_STATUSES = ["paid", "preparing", "ready", "delivered"];

function toCSVField(value: string | number): string {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(...fields: (string | number)[]): string {
  return fields.map(toCSVField).join(",");
}

function fmtEurCSV(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * GET /api/dashboard/office/report?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns a CSV file: one row per menu item with qty, gross, net, VAT.
 * Only confirmed orders (paid/preparing/ready/delivered) are included.
 */
export async function GET(req: NextRequest) {
  const session = await getDashboardServerSession(req);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const selfRow = await prisma.restaurantUser.findFirst({
    where: { id: (session.user as { id?: string }).id ?? "", restaurantId: session.user.restaurantId },
    select: { role: true, permissions: true },
  });
  const access = resolveDashboardAccess(selfRow ?? { role: session.user.role ?? "", permissions: null });
  if (!access.office && !access.isTrueOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const restaurantId = session.user.restaurantId;

  const fromParam = req.nextUrl.searchParams.get("from") ?? "";
  const toParam = req.nextUrl.searchParams.get("to") ?? "";
  if (!fromParam || !toParam) {
    return NextResponse.json({ error: "from and to query params required (YYYY-MM-DD)" }, { status: 400 });
  }

  const fromDate = new Date(`${fromParam}T00:00:00`);
  const toDate = new Date(`${toParam}T23:59:59.999`);
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || fromDate > toDate) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { name: true, vatRate: true },
  });
  if (!restaurant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const vatRate = restaurant.vatRate ?? 0;

  const itemGroups = await prisma.orderItem.groupBy({
    by: ["menuItemId"],
    where: {
      order: {
        restaurantId,
        status: { in: CONFIRMED_STATUSES },
        createdAt: { gte: fromDate, lte: toDate },
      },
    },
    _sum: { quantity: true, unitPrice: true },
    _count: true,
  });

  // fetch actual per-line totals (unitPrice is per-item, need qty * unitPrice per row)
  const lineDetails = await prisma.orderItem.findMany({
    where: {
      order: {
        restaurantId,
        status: { in: CONFIRMED_STATUSES },
        createdAt: { gte: fromDate, lte: toDate },
      },
    },
    select: {
      menuItemId: true,
      quantity: true,
      unitPrice: true,
      menuItem: { select: { name: true, category: { select: { name: true } } } },
    },
  });

  // aggregate per item
  type ItemAgg = { name: string; category: string; qty: number; gross: number };
  const byItem = new Map<string, ItemAgg>();
  for (const line of lineDetails) {
    const existing = byItem.get(line.menuItemId);
    const gross = line.unitPrice * line.quantity;
    if (existing) {
      existing.qty += line.quantity;
      existing.gross += gross;
    } else {
      byItem.set(line.menuItemId, {
        name: line.menuItem.name,
        category: line.menuItem.category?.name ?? "",
        qty: line.quantity,
        gross,
      });
    }
  }

  const sorted = [...byItem.values()].sort((a, b) => b.gross - a.gross);

  let totalQty = 0;
  let totalGross = 0;
  const dataRows: string[] = [];
  for (const item of sorted) {
    const net = Math.round(item.gross / (1 + vatRate / 100));
    const vat = item.gross - net;
    totalQty += item.qty;
    totalGross += item.gross;
    dataRows.push(row(item.name, item.category, item.qty, fmtEurCSV(item.gross), fmtEurCSV(net), fmtEurCSV(vat)));
  }

  const totalNet = Math.round(totalGross / (1 + vatRate / 100));
  const totalVat = totalGross - totalNet;

  const lines: string[] = [
    row(`Accountant Report — ${restaurant.name}`),
    row(`Period: ${fromParam} to ${toParam}`),
    row(`Generated: ${new Date().toISOString().slice(0, 10)}`),
    row(`VAT rate: ${vatRate}%`),
    ``,
    row("Item name", "Category", "Qty sold", `Gross revenue (EUR)`, `Subtotal excl. VAT (EUR)`, `VAT ${vatRate}% (EUR)`),
    ...dataRows,
    ``,
    row("TOTALS", "", totalQty, fmtEurCSV(totalGross), fmtEurCSV(totalNet), fmtEurCSV(totalVat)),
  ];

  const csv = "﻿" + lines.join("\r\n");
  const filename = `report-${fromParam}-to-${toParam}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
