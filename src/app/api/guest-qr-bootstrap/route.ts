import { NextRequest, NextResponse } from "next/server";
import {
  GUEST_QR_ACCESS_COOKIE,
  GUEST_QR_ACCESS_MAX_AGE_SEC,
  createAccessToken,
  isValidQrProof,
} from "@/lib/guest-qr-access";
import { publicAppOriginFromRequest } from "@/lib/staff-invite-url";
import { prisma } from "@/lib/prisma";

const WIFI_FAILURE_WARN_THRESHOLD = 5;

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "";
}

/**
 * Sets the httpOnly guest menu session cookie (15m) after a valid table QR proof.
 * Also enforces WiFi-only access if the restaurant has wifiEnforcementEnabled.
 * Must run in a Route Handler — Server Components cannot set cookies in Next.js 15+.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim() ?? "";
  const qr = req.nextUrl.searchParams.get("qr") ?? "";
  if (!token || !isValidQrProof(token, qr)) {
    return new NextResponse("Invalid table link. Scan the QR code at your table again.", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const table = await prisma.table.findUnique({
    where: { token },
    select: {
      orderingWindowNonce: true,
      restaurantId: true,
      restaurant: {
        select: {
          wifiEnforcementEnabled: true,
          allowedWifiIp: true,
        },
      },
    },
  });
  const nonce = table?.orderingWindowNonce ?? 0;

  /** Avoid `req.url` when reverse-proxy → Node uses 127.0.0.1 (customers would get sent to localhost). */
  const origin = publicAppOriginFromRequest(req);
  const dest = new URL(`/m/${encodeURIComponent(token)}`, `${origin}/`);
  dest.search = "";

  if (table?.restaurant.wifiEnforcementEnabled && table.restaurant.allowedWifiIp) {
    const clientIp = getClientIp(req);
    if (clientIp !== table.restaurant.allowedWifiIp) {
      const updated = await prisma.restaurant.update({
        where: { id: table.restaurantId },
        data: { wifiIpFailureCount: { increment: 1 } },
        select: { wifiIpFailureCount: true },
      });
      if (updated.wifiIpFailureCount >= WIFI_FAILURE_WARN_THRESHOLD) {
        await prisma.restaurant.update({
          where: { id: table.restaurantId },
          data: { wifiIpWarnOwner: true, wifiIpFailureCount: 0 },
        });
      }
      dest.searchParams.set("wifi_required", "1");
      return NextResponse.redirect(dest);
    }
  }

  const res = NextResponse.redirect(dest);
  res.cookies.set(GUEST_QR_ACCESS_COOKIE, createAccessToken(token, nonce), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_QR_ACCESS_MAX_AGE_SEC,
  });
  return res;
}
