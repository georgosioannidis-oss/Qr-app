import { NextRequest, NextResponse } from "next/server";
import { getDashboardServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { requireOrdersSectionApi } from "@/lib/require-owner-api";

function isSoldOutToday(soldOutAt: Date | null): boolean {
  if (!soldOutAt) return false;
  const today = new Date();
  return (
    soldOutAt.getUTCFullYear() === today.getUTCFullYear() &&
    soldOutAt.getUTCMonth() === today.getUTCMonth() &&
    soldOutAt.getUTCDate() === today.getUTCDate()
  );
}

/** PATCH /api/dashboard/menu-items/[id]/sold-out — toggle "86 sold out today" on a menu item. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getDashboardServerSession(req);
  const forbidden = await requireOrdersSectionApi(session);
  if (forbidden) return forbidden;
  const restaurantId = session!.user.restaurantId!;

  const { id } = await params;
  let body: { soldOut?: boolean };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body.soldOut !== "boolean") {
    return NextResponse.json({ error: "soldOut (boolean) required" }, { status: 400 });
  }

  const item = await prisma.menuItem.findFirst({
    where: { id, category: { restaurantId } },
    select: { id: true },
  });
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const updated = await prisma.menuItem.update({
    where: { id },
    data: { soldOutAt: body.soldOut ? new Date() : null },
    select: { soldOutAt: true },
  });

  return NextResponse.json({
    ok: true,
    soldOutAt: updated.soldOutAt?.toISOString() ?? null,
    isSoldOutToday: isSoldOutToday(updated.soldOutAt),
  });
}
