import { NextRequest, NextResponse } from "next/server";
import {
  GUEST_QR_ACCESS_COOKIE,
  GUEST_QR_ACCESS_MAX_AGE_SEC,
  createAccessToken,
  isValidQrProof,
} from "@/lib/guest-qr-access";
import { publicAppOriginFromRequest } from "@/lib/staff-invite-url";

/**
 * Sets the httpOnly guest menu session cookie (30m) after a valid table QR proof.
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

  /** Avoid `req.url` when reverse-proxy → Node uses 127.0.0.1 (customers would get sent to localhost). */
  const origin = publicAppOriginFromRequest(req);
  const dest = new URL(`/m/${encodeURIComponent(token)}`, `${origin}/`);
  dest.search = "";
  const res = NextResponse.redirect(dest);
  res.cookies.set(GUEST_QR_ACCESS_COOKIE, createAccessToken(token), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_QR_ACCESS_MAX_AGE_SEC,
  });
  return res;
}
