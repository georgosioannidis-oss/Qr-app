import { NextRequest, NextResponse } from "next/server";
import { getDashboardServerSession } from "@/lib/auth-server";
import { requireBrandingApi } from "@/lib/require-owner-api";
import { prisma } from "@/lib/prisma";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "";
}

function maskIp(ip: string): string {
  return ip.replace(/\.\d+$/, ".***");
}

export async function GET() {
  const session = await getDashboardServerSession();
  const forbidden = await requireBrandingApi(session);
  if (forbidden) return forbidden;
  const restaurantId = session!.user.restaurantId!;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      wifiEnforcementEnabled: true,
      allowedWifiIp: true,
      wifiIpWarnOwner: true,
    },
  });

  if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });

  return NextResponse.json({
    wifiEnforcementEnabled: restaurant.wifiEnforcementEnabled,
    maskedIp: restaurant.allowedWifiIp ? maskIp(restaurant.allowedWifiIp) : null,
    wifiIpWarnOwner: restaurant.wifiIpWarnOwner,
  });
}

export async function POST(req: NextRequest) {
  const session = await getDashboardServerSession(req);
  const forbidden = await requireBrandingApi(session);
  if (forbidden) return forbidden;
  const restaurantId = session!.user.restaurantId!;

  let body: { password?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const expectedPassword = process.env.WIFI_SETTINGS_PASSWORD;
  if (!expectedPassword || body.password !== expectedPassword) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 403 });
  }

  const { action } = body;

  if (action === "set") {
    const ip = getClientIp(req);
    if (!ip) {
      return NextResponse.json({ error: "Could not detect your IP address." }, { status: 400 });
    }
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        allowedWifiIp: ip,
        wifiEnforcementEnabled: true,
        wifiIpWarnOwner: false,
        wifiIpFailureCount: 0,
      },
    });
    return NextResponse.json({ ok: true, maskedIp: maskIp(ip), wifiEnforcementEnabled: true });
  }

  if (action === "toggle") {
    const current = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { wifiEnforcementEnabled: true },
    });
    const next = !current?.wifiEnforcementEnabled;
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { wifiEnforcementEnabled: next },
    });
    return NextResponse.json({ ok: true, wifiEnforcementEnabled: next });
  }

  if (action === "clear-warning") {
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { wifiIpWarnOwner: false, wifiIpFailureCount: 0 },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
