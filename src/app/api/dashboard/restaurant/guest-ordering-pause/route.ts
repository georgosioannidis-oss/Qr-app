import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDashboardServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { requireOrdersSectionApi } from "@/lib/require-owner-api";

/** GET guest QR ordering pause: whole venue, per section, per table. */
export async function GET(req: NextRequest) {
  const session = await getDashboardServerSession(req);
  const forbidden = await requireOrdersSectionApi(session);
  if (forbidden) return forbidden;
  const restaurantId = session!.user.restaurantId!;

  const [r, sections, tables] = await Promise.all([
    prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { guestQrOrderingPaused: true },
    }),
    prisma.tableSection.findMany({
      where: { restaurantId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, guestQrOrderingPaused: true },
    }),
    prisma.table.findMany({
      where: { restaurantId },
      orderBy: [{ tableSectionId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        guestQrOrderingPaused: true,
        tableSection: { select: { id: true, name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    paused: r?.guestQrOrderingPaused === true,
    sections: sections.map((s) => ({
      id: s.id,
      name: s.name,
      paused: s.guestQrOrderingPaused,
    })),
    tables: tables.map((t) => ({
      id: t.id,
      name: t.name,
      paused: t.guestQrOrderingPaused,
      sectionId: t.tableSection?.id ?? null,
      sectionName: t.tableSection?.name ?? null,
    })),
  });
}

/** PATCH: `{ paused }` (whole venue), `{ sectionId, paused }`, or `{ tableId, paused }`. */
export async function PATCH(req: NextRequest) {
  const session = await getDashboardServerSession(req);
  const forbidden = await requireOrdersSectionApi(session);
  if (forbidden) return forbidden;
  const restaurantId = session!.user.restaurantId!;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.tableId === "string" && body.tableId.trim().length > 0) {
    const paused = body.paused === true;
    const t = await prisma.table.findFirst({
      where: { id: body.tableId.trim(), restaurantId },
      select: { id: true },
    });
    if (!t) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }
    await prisma.table.update({
      where: { id: t.id },
      data: { guestQrOrderingPaused: paused },
    });
    return NextResponse.json({ ok: true, scope: "table" as const, tableId: t.id, paused });
  }

  if (typeof body.sectionId === "string" && body.sectionId.trim().length > 0) {
    const paused = body.paused === true;
    const s = await prisma.tableSection.findFirst({
      where: { id: body.sectionId.trim(), restaurantId },
      select: { id: true },
    });
    if (!s) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }
    await prisma.tableSection.update({
      where: { id: s.id },
      data: { guestQrOrderingPaused: paused },
    });
    return NextResponse.json({ ok: true, scope: "section" as const, sectionId: s.id, paused });
  }

  if (body.paused !== undefined) {
    const paused = body.paused === true;
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { guestQrOrderingPaused: paused },
    });
    return NextResponse.json({ paused });
  }

  return NextResponse.json(
    {
      error:
        "Invalid body. Use { paused: boolean } for the whole venue, { sectionId, paused } for a table area, or { tableId, paused } for one table.",
    },
    { status: 400 }
  );
}
