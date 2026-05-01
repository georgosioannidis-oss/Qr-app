import { NextRequest, NextResponse } from "next/server";
import { getDashboardServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { requireBrandingApi } from "@/lib/require-owner-api";
import { translateTexts } from "@/lib/translate-batch";
import { parseEnabledLocales } from "@/lib/locale-config";

/**
 * POST /api/dashboard/menu/translate-category
 * Body: { categoryId: string }
 * Translates the category name to every enabled locale. Owner/branding access only.
 */
export async function POST(req: NextRequest) {
  const session = await getDashboardServerSession(req);
  const forbidden = await requireBrandingApi(session);
  if (forbidden) return forbidden;
  const restaurantId = session!.user.restaurantId!;

  let body: { categoryId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const categoryId = typeof body.categoryId === "string" ? body.categoryId.trim() : "";
  if (!categoryId) return NextResponse.json({ error: "categoryId required" }, { status: 400 });

  const category = await prisma.menuCategory.findFirst({
    where: { id: categoryId, restaurantId },
    select: { id: true, name: true },
  });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { enabledLocales: true, defaultLocale: true },
  });
  if (!restaurant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const enabledLocales = parseEnabledLocales(restaurant.enabledLocales);
  const defaultLocale = restaurant.defaultLocale ?? "el";
  const targetLocales = enabledLocales.filter((l) => l !== defaultLocale);

  if (targetLocales.length === 0) return NextResponse.json({ ok: true, translatedLocales: [] });

  const translated: string[] = [];
  for (const locale of targetLocales) {
    const [translatedName] = await translateTexts([category.name], defaultLocale, locale);
    await prisma.menuCategoryTranslation.upsert({
      where: { menuCategoryId_locale: { menuCategoryId: category.id, locale } },
      create: { menuCategoryId: category.id, locale, name: translatedName ?? category.name },
      update: { name: translatedName ?? category.name },
    });
    translated.push(locale);
  }

  return NextResponse.json({ ok: true, translatedLocales: translated });
}
