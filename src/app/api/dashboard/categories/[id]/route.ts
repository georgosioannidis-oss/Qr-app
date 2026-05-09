import { NextRequest, NextResponse } from "next/server";
import { getDashboardServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { requireMenuTablesApiAccess } from "@/lib/menu-tables-access";

async function checkCategory(id: string, restaurantId: string) {
  const cat = await prisma.menuCategory.findFirst({
    where: { id, restaurantId },
  });
  return cat;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getDashboardServerSession(req);
  const forbidden = await requireMenuTablesApiAccess(session);
  if (forbidden) return forbidden;
  const restaurantId = session!.user.restaurantId!;

  const { id } = await params;
  const category = await checkCategory(id, restaurantId);
  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const name = body.name != null ? String(body.name).trim().slice(0, 100) : undefined;
  const sortOrder = typeof body.sortOrder === "number" ? body.sortOrder : undefined;
  const isAvailable = typeof body.isAvailable === "boolean" ? body.isAvailable : undefined;
  const stationId = "stationId" in body
    ? (typeof body.stationId === "string" && body.stationId ? body.stationId : null)
    : undefined;

  let scheduleWindows: string | null | undefined = undefined;
  if ("scheduleWindows" in body) {
    if (body.scheduleWindows === null) {
      scheduleWindows = null;
    } else {
      try {
        const arr = JSON.parse(String(body.scheduleWindows));
        if (!Array.isArray(arr)) throw new Error();
        const timeRe = /^\d{2}:\d{2}$/;
        for (const w of arr) {
          if (!w || !timeRe.test(w.start) || !timeRe.test(w.end)) throw new Error();
        }
        scheduleWindows = JSON.stringify(arr);
      } catch {
        return NextResponse.json({ error: "Invalid scheduleWindows" }, { status: 400 });
      }
    }
  }

  const updated = await prisma.menuCategory.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(isAvailable !== undefined && { isAvailable }),
      ...(stationId !== undefined && { stationId }),
      ...(scheduleWindows !== undefined && { scheduleWindows }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getDashboardServerSession(req);
  const forbidden = await requireMenuTablesApiAccess(session);
  if (forbidden) return forbidden;
  const restaurantId = session!.user.restaurantId!;

  const { id } = await params;
  const category = await checkCategory(id, restaurantId);
  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.menuCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
