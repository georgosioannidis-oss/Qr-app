/**
 * Adds tables 11–65 (55 tables) for the Moustakallis demo venue only.
 * Targets slug `moustakallis` if present, otherwise `demo-restaurant`. Other restaurants are untouched.
 *
 * Run: npx tsx prisma/add-moustakallis-tables-11-65.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const candidates = await prisma.restaurant.findMany({
    where: { slug: { in: ["moustakallis", "demo-restaurant"] } },
    select: { id: true, name: true, slug: true },
  });
  const restaurant =
    candidates.find((r) => r.slug === "moustakallis") ?? candidates.find((r) => r.slug === "demo-restaurant");
  if (!restaurant) {
    throw new Error(
      'No restaurant with slug "moustakallis" or "demo-restaurant". Create one or fix the slug, then re-run.'
    );
  }

  let diningSection = await prisma.tableSection.findFirst({
    where: { restaurantId: restaurant.id, name: "Dining room" },
  });
  if (!diningSection) {
    diningSection = await prisma.tableSection.create({
      data: { name: "Dining room", sortOrder: 0, restaurantId: restaurant.id },
    });
  }

  for (let n = 11; n <= 65; n++) {
    const token = `table-${n}`;
    const existing = await prisma.table.findUnique({
      where: { token },
      select: { id: true, restaurantId: true },
    });
    if (existing && existing.restaurantId !== restaurant.id) {
      throw new Error(
        `${token} already belongs to another restaurant (${existing.restaurantId}). Rename that table or pick different tokens.`
      );
    }
    const data = {
      name: `Table ${n}`,
      restaurantId: restaurant.id,
      tableSectionId: diningSection.id,
      sortOrder: n,
    };
    if (existing) {
      await prisma.table.update({ where: { token }, data: data });
    } else {
      await prisma.table.create({ data: { ...data, token } });
    }
  }

  console.log(
    `Tables 11–65 are set for "${restaurant.name}" (${restaurant.slug}). Guest menu URLs: /m/table-11 … /m/table-65`
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
