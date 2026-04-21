const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function shiftSortOrders(tx, categoryId, fromSortOrder, by) {
  const rows = await tx.menuItem.findMany({
    where: { categoryId, sortOrder: { gte: fromSortOrder } },
    orderBy: { sortOrder: "desc" },
    select: { id: true, sortOrder: true },
  });
  for (const row of rows) {
    await tx.menuItem.update({
      where: { id: row.id },
      data: { sortOrder: row.sortOrder + by },
    });
  }
}

async function splitOneToTwo(tx, itemId, first, second) {
  const original = await tx.menuItem.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      categoryId: true,
      sortOrder: true,
      imageUrl: true,
      isAvailable: true,
      quickPrep: true,
      allergenCodes: true,
      stationId: true,
    },
  });
  if (!original) return;

  await shiftSortOrders(tx, original.categoryId, original.sortOrder + 1, 1);

  await tx.menuItem.update({
    where: { id: original.id },
    data: {
      name: first.name,
      description: first.description,
      price: first.price,
      optionGroups: null,
    },
  });

  await tx.menuItem.create({
    data: {
      categoryId: original.categoryId,
      sortOrder: original.sortOrder + 1,
      name: second.name,
      description: second.description,
      price: second.price,
      imageUrl: original.imageUrl,
      isAvailable: original.isAvailable,
      quickPrep: original.quickPrep,
      optionGroups: null,
      allergenCodes: original.allergenCodes,
      stationId: original.stationId,
    },
  });
}

async function main() {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: "moustakallis" },
    select: { id: true },
  });
  if (!restaurant) throw new Error("Restaurant moustakallis not found");

  await prisma.$transaction(async (tx) => {
    const martiniOld = await tx.menuItem.findFirst({
      where: {
        name: "Martini Brut / Asti",
        category: { restaurantId: restaurant.id },
      },
      select: { id: true },
    });
    if (martiniOld) {
      await splitOneToTwo(
        tx,
        martiniOld.id,
        { name: "Martini Brut", description: "200ml.", price: 650 },
        { name: "Martini Asti", description: "200ml.", price: 650 }
      );
    }

    const proseccoOld = await tx.menuItem.findFirst({
      where: {
        name: "Maschio Prosecco NV",
        category: { restaurantId: restaurant.id },
      },
      select: { id: true },
    });
    if (proseccoOld) {
      await splitOneToTwo(
        tx,
        proseccoOld.id,
        { name: "Maschio Prosecco NV (200ml)", description: "Prosecco 200ml.", price: 650 },
        { name: "Maschio Prosecco NV (750ml)", description: "Prosecco 750ml.", price: 2000 }
      );
    }
  });

  console.log("Done: split prosecco and martini items for moustakallis.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
