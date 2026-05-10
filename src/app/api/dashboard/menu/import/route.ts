import { NextRequest, NextResponse } from "next/server";
import { getDashboardServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

type ImportChoice = { label: string; extra?: number };
type ImportOption = {
  label: string;
  required?: boolean;
  type?: "single" | "multi";
  choices: ImportChoice[];
};
type ImportItem = {
  name: string;
  price?: number;
  priceCents?: number;
  description?: string;
  options?: ImportOption[];
  skip?: boolean;
};
type ImportCategory = {
  category?: string;
  name?: string;
  existingId?: string | null;
  items: ImportItem[];
};

function checkPassword(pw: string): boolean {
  const expected = process.env.MENU_IMPORT_PASSWORD;
  return Boolean(expected && pw === expected);
}

function toCents(price: number): number {
  return Math.round((price ?? 0) * 100);
}

function makeId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
}

function buildOptionGroups(options: ImportOption[]): string | null {
  if (!Array.isArray(options) || options.length === 0) return null;
  return JSON.stringify(
    options.map((g) => ({
      id: makeId(),
      label: g.label ?? "",
      required: g.required ?? false,
      type: g.type === "multi" ? "multi" : "single",
      choices: (g.choices ?? []).map((c) => ({
        id: makeId(),
        label: c.label ?? "",
        priceCents: toCents(c.extra ?? 0),
      })),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getDashboardServerSession(req);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const restaurantId = session.user.restaurantId;

  let body: { action: string; password: string; data?: ImportCategory[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { action, password, data } = body;

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  // ── verify ─────────────────────────────────────────────────────────────────
  if (action === "verify") {
    return NextResponse.json({ ok: true });
  }

  // ── preview ────────────────────────────────────────────────────────────────
  if (action === "preview") {
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "data must be an array" }, { status: 400 });
    }

    const existingCategories = await prisma.menuCategory.findMany({
      where: { restaurantId },
      include: { items: { select: { name: true, price: true } } },
    });

    const categories = data.map((catData) => {
      const catName = ((catData.category ?? catData.name) ?? "").trim();
      const existing = existingCategories.find(
        (c) => c.name.toLowerCase() === catName.toLowerCase()
      );

      const items = (catData.items ?? []).map((item) => {
        const priceCents = item.priceCents ?? toCents(item.price ?? 0);
        const skip = existing
          ? existing.items.some(
              (i) =>
                i.name.toLowerCase() === (item.name ?? "").trim().toLowerCase() &&
                i.price === priceCents
            )
          : false;
        return {
          name: (item.name ?? "").trim(),
          priceCents,
          description: (item.description ?? "").trim(),
          options: item.options ?? [],
          skip,
        };
      });

      return {
        name: catName,
        existingId: existing?.id ?? null,
        willCreate: !existing,
        items,
      };
    });

    return NextResponse.json({ categories });
  }

  // ── import ─────────────────────────────────────────────────────────────────
  if (action === "import") {
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "data must be an array" }, { status: 400 });
    }

    let created = 0;
    let skipped = 0;
    let categoriesCreated = 0;

    const existingCategories = await prisma.menuCategory.findMany({
      where: { restaurantId },
      select: { id: true, name: true },
    });

    for (const catData of data) {
      const catName = ((catData.category ?? catData.name) ?? "").trim();
      if (!catName) continue;

      let categoryId: string = catData.existingId ?? "";

      if (!categoryId) {
        const existing = existingCategories.find(
          (c) => c.name.toLowerCase() === catName.toLowerCase()
        );
        if (existing) {
          categoryId = existing.id;
        } else {
          const agg = await prisma.menuCategory.aggregate({
            where: { restaurantId },
            _max: { sortOrder: true },
          });
          const newCat = await prisma.menuCategory.create({
            data: {
              restaurantId,
              name: catName,
              sortOrder: (agg._max.sortOrder ?? 0) + 1,
            },
          });
          categoryId = newCat.id;
          categoriesCreated++;
          existingCategories.push({ id: categoryId, name: catName });
        }
      }

      for (const item of catData.items ?? []) {
        if (item.skip) { skipped++; continue; }
        const name = (item.name ?? "").trim();
        if (!name) continue;
        const priceCents =
          typeof item.priceCents === "number" ? item.priceCents : toCents(item.price ?? 0);

        const dupe = await prisma.menuItem.findFirst({
          where: { categoryId, name: { equals: name, mode: "insensitive" }, price: priceCents },
          select: { id: true },
        });
        if (dupe) { skipped++; continue; }

        const sortAgg = await prisma.menuItem.aggregate({
          where: { categoryId },
          _max: { sortOrder: true },
        });

        await prisma.menuItem.create({
          data: {
            categoryId,
            name,
            description: (item.description ?? "").trim() || null,
            price: priceCents,
            sortOrder: (sortAgg._max.sortOrder ?? 0) + 1,
            optionGroups: buildOptionGroups(item.options ?? []),
          },
        });
        created++;
      }
    }

    return NextResponse.json({ created, skipped, categoriesCreated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
