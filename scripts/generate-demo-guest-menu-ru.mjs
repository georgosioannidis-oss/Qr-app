/**
 * Build src/data/demo-guest-menu-ru.json from demo-guest-menu-en.json.
 * Uses MyMemory public API (langpair en|ru). Run: node scripts/generate-demo-guest-menu-ru.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const enPath = path.join(root, "src/data/demo-guest-menu-en.json");
const outPath = path.join(root, "src/data/demo-guest-menu-ru.json");

const cache = new Map();

async function translate(text) {
  const t = (text ?? "").trim();
  if (!t) return "";
  if (cache.has(t)) return cache.get(t);
  const u = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(t.slice(0, 450))}&langpair=en|ru`;
  const res = await fetch(u);
  const data = await res.json();
  const out = (data.responseData?.translatedText ?? t).trim();
  const ok = data.responseStatus === 200;
  if (!ok) console.error("mm status", data.responseStatus, t.slice(0, 40));
  cache.set(t, out);
  await new Promise((r) => setTimeout(r, 150));
  return out;
}

const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
const toTranslate = new Set();
for (const cat of en) {
  toTranslate.add((cat.categoryEn || cat.category).trim());
  for (const it of cat.items) {
    toTranslate.add((it.nameEn || it.name).trim());
    const d = (it.descriptionEn || "").trim();
    if (d) toTranslate.add(d);
  }
}

const list = [...toTranslate].filter(Boolean);
console.error("Unique strings:", list.length);
let i = 0;
for (const s of list) {
  i++;
  if (i % 25 === 0) console.error("done", i, "/", list.length);
  await translate(s);
}

const out = en.map((cat) => ({
  category: cat.category,
  categoryRu: cache.get((cat.categoryEn || cat.category).trim()) ?? cat.category,
  items: cat.items.map((it) => ({
    name: it.name,
    nameRu: cache.get((it.nameEn || it.name).trim()) ?? it.name,
    descriptionRu: (() => {
      const d = (it.descriptionEn || "").trim();
      return d ? cache.get(d) ?? "" : "";
    })(),
  })),
}));

fs.writeFileSync(outPath, JSON.stringify(out), "utf8");
console.log("Wrote", outPath);
