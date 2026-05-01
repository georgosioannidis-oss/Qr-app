import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizePrintAgentRestaurant, printAgentApiDisabledReason } from "@/lib/print-agent-auth";
import { stationSlug } from "@/lib/print-station-routing";

export const dynamic = "force-dynamic";

/**
 * GET /api/print-agent/stations?slug=<restaurantSlug>
 * Header: X-Print-Agent-Secret: <PRINT_AGENT_API_SECRET>
 *
 * Returns the list of stations for the restaurant with their human-readable slugs.
 * The standalone agent calls this once on startup to discover valid PRINT_AGENT_STATION values.
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

  const stations = await prisma.station.findMany({
    where: { restaurantId: auth.restaurant.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  return NextResponse.json({
    stations: stations.map((s) => ({ id: s.id, name: s.name, slug: stationSlug(s.name) })),
  });
}
