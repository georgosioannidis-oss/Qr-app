import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDashboardServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { requireRestaurantReadApi } from "@/lib/require-owner-api";
import { CONFIRMED_ORDER_STATUSES } from "@/lib/dashboard-roles";

const CONFIRMED = [...CONFIRMED_ORDER_STATUSES];

/** Midnight of a given day (daysAgo=0 → today, daysAgo=1 → yesterday) in the given IANA timezone, returned as UTC Date. */
function startOfDayInTz(tz: string, daysAgo = 0): Date {
  const now = new Date(Date.now() - daysAgo * 86_400_000);
  const tzNow = new Date(now.toLocaleString("en-US", { timeZone: tz }));
  tzNow.setHours(0, 0, 0, 0);
  const offset = now.getTime() - new Date(now.toLocaleString("en-US", { timeZone: tz })).getTime();
  return new Date(tzNow.getTime() + offset);
}

function formatHour(h: number): string {
  if (h === 0) return "12am";
  if (h < 12) return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
}

/** GET /api/dashboard/stats/today — daily snapshot for the owner dashboard. */
export async function GET(req: NextRequest) {
  const session = await getDashboardServerSession(req);
  const forbidden = await requireRestaurantReadApi(session);
  if (forbidden) return forbidden;
  const restaurantId = session!.user.restaurantId!;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { timezone: true },
  });
  const tz = restaurant?.timezone ?? "UTC";

  const todayStart = startOfDayInTz(tz, 0);
  const tomorrowStart = startOfDayInTz(tz, -1); // end of today = start of tomorrow
  const yesterdayStart = startOfDayInTz(tz, 1);

  const [todayAgg, yesterdayAgg, todayOrders] = await prisma.$transaction(
    async (tx) =>
      Promise.all([
        tx.order.aggregate({
          where: { restaurantId, createdAt: { gte: todayStart }, status: { in: CONFIRMED } },
          _sum: { totalAmount: true },
          _count: true,
        }),
        tx.order.aggregate({
          where: {
            restaurantId,
            createdAt: { gte: yesterdayStart, lt: todayStart },
            status: { in: CONFIRMED },
          },
          _sum: { totalAmount: true },
          _count: true,
        }),
        tx.order.findMany({
          where: { restaurantId, createdAt: { gte: todayStart, lt: tomorrowStart } },
          select: { createdAt: true },
        }),
      ]),
    { maxWait: 8_000, timeout: 15_000 }
  );

  // Find busiest hour in restaurant timezone
  const hourCounts: Record<number, number> = {};
  for (const o of todayOrders) {
    const localDate = new Date(o.createdAt.toLocaleString("en-US", { timeZone: tz }));
    const h = localDate.getHours();
    hourCounts[h] = (hourCounts[h] ?? 0) + 1;
  }
  let busiestHour: string | null = null;
  if (Object.keys(hourCounts).length > 0) {
    const topHour = Number(
      Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0]
    );
    busiestHour = formatHour(topHour);
  }

  return NextResponse.json({
    ordersToday: todayAgg._count,
    revenueToday: todayAgg._sum.totalAmount ?? 0,
    ordersYesterday: yesterdayAgg._count,
    revenueYesterday: yesterdayAgg._sum.totalAmount ?? 0,
    busiestHour,
  });
}
