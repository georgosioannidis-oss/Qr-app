import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const prisma = new PrismaClient();
const r = await prisma.restaurant.findFirst({
  where: { slug: { in: ["moustakallis", "demo-restaurant"] } },
  select: { id: true },
});
if (!r) {
  console.error("moustakallis (or demo-restaurant) not found");
  process.exit(1);
}
const cats = await prisma.menuCategory.findMany({
  where: { restaurantId: r.id },
  orderBy: { sortOrder: "asc" },
  include: {
    items: { orderBy: { sortOrder: "asc" }, select: { name: true, description: true } },
  },
});
const out = cats.map((c) => ({
  category: c.name,
  items: c.items.map((i) => ({ name: i.name, description: i.description ?? "" })),
}));
writeFileSync("tmp-demo-menu-dump.json", JSON.stringify(out));
console.log(out.length, "categories", out.reduce((s, c) => s + c.items.length, 0), "items");
await prisma.$disconnect();
