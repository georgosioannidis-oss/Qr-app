/**
 * Reads tmp-demo-menu-dump.json, translates el→en via MyMemory (free tier), writes src/data/demo-guest-menu-en.json
 * Run: node scripts/build-demo-menu-en.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

async function tr(text) {
  const t = text.trim();
  if (!t) return "";
  const u = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(t.slice(0, 450))}&langpair=el|en`;
  const res = await fetch(u);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const j = await res.json();
  const out = j?.responseData?.translatedText;
  if (typeof out !== "string") throw new Error(JSON.stringify(j).slice(0, 400));
  return out;
}

const dump = JSON.parse(readFileSync("tmp-demo-menu-dump.json", "utf8"));
const out = [];
let done = 0;
const total =
  dump.length + dump.reduce((s, c) => s + c.items.length, 0) + dump.reduce((s, c) => s + c.items.filter((i) => i.description.trim()).length, 0);

for (const cat of dump) {
  const categoryEn = await tr(cat.category);
  done++;
  process.stdout.write(`\r${done}/${total}`);
  await new Promise((r) => setTimeout(r, 350));
  const row = { category: cat.category, categoryEn, items: [] };
  for (const it of cat.items) {
    const nameEn = await tr(it.name);
    done++;
    process.stdout.write(`\r${done}/${total}`);
    await new Promise((r) => setTimeout(r, 350));
    let descriptionEn = "";
    if (it.description.trim()) {
      descriptionEn = await tr(it.description);
      done++;
      process.stdout.write(`\r${done}/${total}`);
      await new Promise((r) => setTimeout(r, 350));
    }
    row.items.push({
      name: it.name,
      nameEn,
      description: it.description,
      descriptionEn,
    });
  }
  out.push(row);
}

writeFileSync("src/data/demo-guest-menu-en.json", JSON.stringify(out));
console.log("\nWrote src/data/demo-guest-menu-en.json");
