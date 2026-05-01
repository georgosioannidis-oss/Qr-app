import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getDashboardServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { resolveDashboardAccess } from "@/lib/staff-permissions";

function getResetSecret(): string | null {
  const s = process.env.OFFICE_RESET_SECRET?.trim();
  return s && s.length > 0 ? s : null;
}

/**
 * POST /api/dashboard/office/reset
 * Body: { secret: string }
 *
 * Hard-deletes ALL orders (+ cascade: OrderItem, OrderStationPrintAck) for this restaurant.
 * Secret must match OFFICE_RESET_SECRET env var — never hardcoded.
 * Requires office access.
 */
export async function POST(req: NextRequest) {
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

  const configured = getResetSecret();
  if (!configured) {
    return NextResponse.json(
      { error: "Reset is not enabled on this server. Set OFFICE_RESET_SECRET in your environment." },
      { status: 503 }
    );
  }

  let body: { secret?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const provided = (body.secret ?? "").trim();
  if (!provided) {
    return NextResponse.json({ error: "secret required" }, { status: 400 });
  }

  const bufA = Buffer.from(provided, "utf8");
  const bufB = Buffer.from(configured, "utf8");
  const match = bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
  if (!match) {
    return NextResponse.json({ error: "Incorrect secret" }, { status: 403 });
  }

  const restaurantId = session.user.restaurantId;

  // Hard delete: cascade via schema (OrderItem + OrderStationPrintAck delete with Order)
  const { count } = await prisma.order.deleteMany({ where: { restaurantId } });

  return NextResponse.json({ ok: true, deletedOrders: count });
}
