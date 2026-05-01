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
 * POST /api/dashboard/menu/translate-item
 * Body: { itemId: string }
 * Translates item name, description, and all option group labels/choices to every enabled locale.
 * Owner/branding access only.
 */
export async function POST(req: NextRequest) {
  const session = await getDashboardServerSession(req);
  const forbidden = await requireBrandingApi(session);
  if (forbidden) return forbidden;
  const restaurantId = session!.user.restaurantId!;

  let body: { itemId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const itemId = typeof body.itemId === "string" ? body.itemId.trim() : "";
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, category: { restaurantId } },
    select: { id: true, name: true, description: true, optionGroups: true },
  });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { enabledLocales: true, defaultLocale: true },
  });
  if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });

  const enabledLocales = parseEnabledLocales(restaurant.enabledLocales);
  const defaultLocale = restaurant.defaultLocale ?? "el";
  const targetLocales = enabledLocales.filter((l) => l !== defaultLocale);

  if (targetLocales.length === 0) {
    return NextResponse.json({ ok: true, translatedLocales: [] });
  }

  const optionGroups = parseOptionGroups(item.optionGroups as string | null);

  const translated: string[] = [];

  for (const locale of targetLocales) {
    // Build flat list of strings to translate: [name, description, ...groupLabels, ...choiceLabels]
    const strings: string[] = [
      item.name,
      item.description ?? "",
    ];
    const groupLabelCount = optionGroups.length;
    for (const g of optionGroups) {
      strings.push(g.label);
      for (const c of g.choices) {
        strings.push(c.label);
      }
    }

    const results = await translateTexts(strings, defaultLocale, locale);

    const translatedName = results[0] ?? item.name;
    const translatedDescription = results[1] || null;

    // Reconstruct option groups with translated labels
    let idx = 2;
    const translatedGroups: OptionGroup[] = optionGroups.map((g) => {
      const groupLabel = results[idx++] ?? g.label;
      const choices = g.choices.map((c) => ({
        ...c,
        label: results[idx++] ?? c.label,
      }));
      return { ...g, label: groupLabel, choices };
    });

    await prisma.menuItemTranslation.upsert({
      where: { menuItemId_locale: { menuItemId: item.id, locale } },
      create: {
        menuItemId: item.id,
        locale,
        name: translatedName,
        description: translatedDescription,
        optionGroups: translatedGroups.length > 0 ? JSON.stringify(translatedGroups) : null,
      },
      update: {
        name: translatedName,
        description: translatedDescription,
        optionGroups: translatedGroups.length > 0 ? JSON.stringify(translatedGroups) : null,
      },
    });

    translated.push(locale);
  }

  return NextResponse.json({ ok: true, translatedLocales: translated });
}
