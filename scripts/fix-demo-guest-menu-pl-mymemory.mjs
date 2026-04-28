import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const plPath = path.join(root, "src/data/demo-guest-menu-pl.json");
const enPath = path.join(root, "src/data/demo-guest-menu-en.json");

const BAD = /MYMEMORY/i;

const catEnToPl = {
  "Desserts ": "Desery",
  "Ice-Cream": "Lody",
  "Coffees & hot drinks": "Kawa i gorące napoje",
  "Cold coffees": "Zimna kawa",
  "Specialty coffees": "Kawy specjalne",
};

const nameEnToPl = {
  Baklava: "Baklawa",
  "Poached pear": "Gruszka w syropie",
  "Best-ever Carrot Cake": "Ciasto marchewkowe",
  "Caramel cream": "Krem karmelowy",
  "Extra ice cream ball": "Dodatkowa porcja lodów",
  "Mixed ice cream": "Lody mieszane",
  "Banana Split": "Banana split",
  "Special ice cream": "Lody specjalne",
  "Cypriot coffee": "Kawa cypryjska",
  Nescafé: "Nescafé",
  "Filter coffee": "Kawa filtrowana",
  Espresso: "Espresso",
  "Double Espresso": "Podwójne espresso",
  Cappuccino: "Cappuccino",
  Late: "Latte",
  Teas: "Herbata",
  "Nescafe Frappe": "Frappé",
  "Freddo Espresso ": "Freddo espresso",
  "Freddo cappuccino ": "Freddo cappuccino",
  "Cyprus coffee": "Kawa cypryjska",
  Calypso: "Calypso",
  "Irish Coffee": "Irish coffee",
  "Royal coffee": "Kawa royal",
  Lumumba: "Lumumba",
};

const descEnToPl = {
  "Homemade phyllo stuffed with chopped nuts and syrup.":
    "Domowe ciasto filo z posiekanymi orzechami i syropem.",
  "Slowly cooked in rich blackcurrant syrup, served with ice cream.":
    "Duszone w syropie z czarnej porzeczki, podawane z lodami.",
  "Carrot cake.": "Ciasto marchewkowe.",
  "Caramel cream.": "Krem karmelowy.",
  "4 balls of your choice with fresh cream.":
    "4 gałki do wyboru ze świeżą śmietaną.",
  "Fresh banana and ice cream with fresh cream.":
    "Świeży banan i lody ze świeżą śmietaną.",
  "Mixed ice cream with strawberry liqueur, Blue Curaçao and fresh cream.":
    "Lody mieszane z likierem truskawkowym, Blue Curaçao i śmietaną.",
  "Filter coffee.": "Kawa filtrowana.",
  "With zivania and fresh cream.": "Z zivanią i śmietaną.",
  "With Tia Maria and fresh cream.": "Z Tia Maria i śmietaną.",
  "With whiskey and fresh cream.": "Z whisky i śmietaną.",
  "With brandy and fresh cream.": "Z brandy i śmietaną.",
  "Warm chocolate with brandy and fresh cream.":
    "Gorąca czekolada z brandy i śmietaną.",
};

const pl = JSON.parse(fs.readFileSync(plPath, "utf8"));
const en = JSON.parse(fs.readFileSync(enPath, "utf8"));

const itemMap = new Map();
for (const c of en) {
  for (const it of c.items) {
    itemMap.set(`${c.category}\0${it.name}`, it);
  }
}

let fixed = 0;
for (const c of pl) {
  const ec = en.find((x) => x.category === c.category);
  if (ec && BAD.test(c.categoryPl ?? "")) {
    const key = ec.categoryEn ?? "";
    c.categoryPl = catEnToPl[key] ?? catEnToPl[key.trim()] ?? key.trim();
    fixed++;
  }
  for (const it of c.items) {
    const ei = itemMap.get(`${c.category}\0${it.name}`);
    if (!ei) continue;
    if (BAD.test(it.namePl ?? "")) {
      const ne = ei.nameEn?.trim() ?? "";
      it.namePl = (nameEnToPl[ei.nameEn] ?? nameEnToPl[ne] ?? ne) || it.name;
      fixed++;
    }
    if (BAD.test(it.descriptionPl ?? "")) {
      const de = (ei.descriptionEn ?? "").trim();
      it.descriptionPl = descEnToPl[de] ?? de;
      fixed++;
    }
  }
}

fs.writeFileSync(plPath, JSON.stringify(pl), "utf8");
console.log("patched fields:", fixed);
let left = JSON.stringify(pl).match(/MYMEMORY/g);
console.log("MYMEMORY remaining:", left ? left.length : 0);
