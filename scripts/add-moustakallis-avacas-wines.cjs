const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function addAtBottom(categoryId, name, description, price) {
  const exists = await prisma.menuItem.findFirst({
    where: { categoryId, name },
    select: { id: true },
  });
  if (exists) return;

  const maxSort = await prisma.menuItem.aggregate({
    where: { categoryId },
    _max: { sortOrder: true },
  });

  await prisma.menuItem.create({
    data: {
      categoryId,
      name,
      description,
      price,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      isAvailable: true,
    },
  });
}

async function main() {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: "moustakallis" },
    select: { id: true },
  });
  if (!restaurant) throw new Error("Restaurant moustakallis not found");

  const whiteAnchor = await prisma.menuItem.findFirst({
    where: {
      name: "Vouni Panayia – Alina (λευκό)",
      category: { restaurantId: restaurant.id },
    },
    select: { categoryId: true },
  });
  const redAnchor = await prisma.menuItem.findFirst({
    where: {
      name: "Vasilikon – Agios Onoufrios",
      category: { restaurantId: restaurant.id },
    },
    select: { categoryId: true },
  });

  if (!whiteAnchor?.categoryId || !redAnchor?.categoryId) {
    throw new Error("Could not locate white/red wine categories");
  }

  await addAtBottom(whiteAnchor.categoryId, "AVACAS (Xynisteri)", "Λευκό κρασί. 187ml.", 450);
  await addAtBottom(redAnchor.categoryId, "AVACAS Rosalino", "Κόκκινο κρασί. 187ml.", 450);

  console.log("Done: added AVACAS wines at bottom for moustakallis.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
