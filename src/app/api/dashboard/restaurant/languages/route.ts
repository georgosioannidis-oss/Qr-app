import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getDashboardServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { requireBrandingApi } from "@/lib/require-owner-api";
import { SUPPORTED_LOCALES, parseEnabledLocales } from "@/lib/locale-config";

function getUnlockSecret(): string | null {
  const s = process.env.LANGUAGE_UNLOCK_SECRET?.trim();
  return s && s.length > 0 ? s : null;
}

function checkSecret(provided: string): boolean {
  const configured = getUnlockSecret();
  if (!configured) return false;
  const a = Buffer.from(provided.trim(), "utf8");
  const b = Buffer.from(configured, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * PATCH /api/dashboard/restaurant/languages
 * Body: { secret, enabledLocales: string[], defaultLocale: string }
 * Requires branding access + LANGUAGE_UNLOCK_SECRET.
 */
export async function PATCH(req: NextRequest) {
  const session = await getDashboardServerSession(req);
  const forbidden = await requireBrandingApi(session);
  if (forbidden) return forbidden;
  const restaurantId = session!.user.restaurantId!;

  const configured = getUnlockSecret();
  if (!configured) {
    return NextResponse.json(
      { error: "Language management is not enabled. Set LANGUAGE_UNLOCK_SECRET in your server environment." },
      { status: 503 }
    );
  }

  let body: { secret?: string; enabledLocales?: unknown; defaultLocale?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!checkSecret(typeof body.secret === "string" ? body.secret : "")) {
    return NextResponse.json({ error: "Incorrect secret" }, { status: 403 });
  }

  const valid = new Set(SUPPORTED_LOCALES.map((l) => l.code));

  const rawLocales = body.enabledLocales;
  if (!Array.isArray(rawLocales)) {
    return NextResponse.json({ error: "enabledLocales must be an array" }, { status: 400 });
  }
  const enabledLocales = rawLocales.filter((c): c is string => typeof c === "string" && valid.has(c as never));

  const defaultLocale =
    typeof body.defaultLocale === "string" && valid.has(body.defaultLocale as never)
      ? body.defaultLocale
      : "el";

  if (enabledLocales.length > 0 && !enabledLocales.includes(defaultLocale)) {
    return NextResponse.json(
      { error: "defaultLocale must be one of the enabledLocales" },
      { status: 400 }
    );
  }

  const restaurant = await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      enabledLocales: JSON.stringify(enabledLocales),
      defaultLocale,
    },
    select: { enabledLocales: true, defaultLocale: true },
  });

  return NextResponse.json(restaurant);
}

export async function GET(req: NextRequest) {
  const session = await getDashboardServerSession(req);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { enabledLocales: true, defaultLocale: true },
  });
  if (!restaurant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    enabledLocales: parseEnabledLocales(restaurant.enabledLocales),
    defaultLocale: restaurant.defaultLocale,
    secretConfigured: !!getUnlockSecret(),
  });
}
