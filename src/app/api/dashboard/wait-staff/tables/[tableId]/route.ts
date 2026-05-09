import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDashboardServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { requireWaitStaffApiAccess } from "@/lib/require-wait-staff-api";

/**
 * PATCH /api/dashboard/wait-staff/tables/[tableId]
 * Body: { clearWaiterCall: true } — staff tapped after visiting the table.
 *       { resetOrderingWindow: true } — table is ready for new guests; invalidates their QR cookie.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  const session = await getDashboardServerSession(req);
  const forbidden = await requireWaitStaffApiAccess(session);
  if (forbidden) return forbidden;
  const restaurantId = session!.user.restaurantId!;
  const { tableId } = await params;

  let body: { clearWaiterCall?: boolean; resetOrderingWindow?: boolean; clearBillRequest?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { clearWaiterCall, resetOrderingWindow, clearBillRequest } = body;
  if (!clearWaiterCall && !resetOrderingWindow && !clearBillRequest) {
    return NextResponse.json(
      { error: "Send clearWaiterCall, clearBillRequest, or resetOrderingWindow" },
      { status: 400 }
    );
  }

  const result = await prisma.table.updateMany({
    where: { id: tableId, restaurantId },
    data: {
      ...(clearWaiterCall && { waiterCalledAt: null }),
      ...(clearBillRequest && { billRequestedAt: null }),
      ...(resetOrderingWindow && { orderingWindowNonce: { increment: 1 } }),
    },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Table not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
