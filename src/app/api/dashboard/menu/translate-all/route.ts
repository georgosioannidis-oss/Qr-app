import { NextRequest, NextResponse } from "next/server";
import { getDashboardServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { requireBrandingApi } from "@/lib/require-owner-api";
import { translateTexts } from "@/lib/translate-batch";
import { parseEnabledLocales } from "@/lib/locale-config";

type OptionGroup = {
  id: string;
  label: string;
  required: boolean;
  type: "single" | "multi";
  choices: { id: string; label: string; priceCents: number }[];
};

function parseOptionGroups(raw: string | null | undefined): OptionGroup[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? (p as OptionGroup[]) : [];
  } catch {
    return [];
  }
}

/**
 * POST /api/dashboard/menu/translate-all
 * Translates every menu item and category to all enabled locales in one shot.
 * Owner access only.
 */
export async function POST(req: NextRequest) {
  const session = await getDashboardServerSession(req);
  const forbidden = await requireBrandingApi(session);
  if (forbidden) return forbidden;
  const restaurantId = session!.user.restaurantId!;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { enabledLocales: true, defaultLocale: true },
  });
  if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });

  const enabledLocales = parseEnabledLocales(restaurant.enabledLocales);
  const defaultLocale = restaurant.defaultLocale ?? "el";
  const targetLocales = enabledLocales.filter((l) => l !== defaultLocale);

  if (targetLocales.length === 0) {
    return NextResponse.json({ ok: true, translatedItems: 0, translatedCategories: 0, locales: [] });
  }

  const items = await prisma.menuItem.findMany({
    where: { category: { restaurantId } },
    select: { id: true, name: true, description: true, optionGroups: true },
  });

  const categories = await prisma.menuCategory.findMany({
    where: { restaurantId },
    select: { id: true, name: true },
  });

  for (const item of items) {
    for (const locale of targetLocales) {
      const optionGroups = parseOptionGroups(item.optionGroups as string | null);
      const strings: string[] = [item.name, item.description ?? ""];
      for (const g of optionGroups) {
        strings.push(g.label);
        for (const c of g.choices) strings.push(c.label);
      }

      const results = await translateTexts(strings, defaultLocale, locale);

      let idx = 2;
      const translatedGroups: OptionGroup[] = optionGroups.map((g) => {
        const groupLabel = results[idx++] ?? g.label;
        const choices = g.choices.map((c) => ({ ...c, label: results[idx++] ?? c.label }));
        return { ...g, label: groupLabel, choices };
      });

      await prisma.menuItemTranslation.upsert({
        where: { menuItemId_locale: { menuItemId: item.id, locale } },
        create: {
          menuItemId: item.id,
          locale,
          name: results[0] ?? item.name,
          description: results[1] || null,
          optionGroups: translatedGroups.length > 0 ? JSON.stringify(translatedGroups) : null,
        },
        update: {
          name: results[0] ?? item.name,
          description: results[1] || null,
          optionGroups: translatedGroups.length > 0 ? JSON.stringify(translatedGroups) : null,
        },
      });
    }
  }

  for (const cat of categories) {
    for (const locale of targetLocales) {
      const results = await translateTexts([cat.name], defaultLocale, locale);
      await prisma.menuCategoryTranslation.upsert({
        where: { menuCategoryId_locale: { menuCategoryId: cat.id, locale } },
        create: { menuCategoryId: cat.id, locale, name: results[0] ?? cat.name },
        update: { name: results[0] ?? cat.name },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    translatedItems: items.length,
    translatedCategories: categories.length,
    locales: targetLocales,
  });
}
