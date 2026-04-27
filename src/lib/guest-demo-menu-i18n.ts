/**
 * Guest QR menu localization for the seeded Moustakallis venue (`slug: moustakallis`).
 * Dish copy merges `demo-guest-menu-en.json` / `demo-guest-menu-ru.json` (by Greek category + name); option labels use phrase maps.
 */
import demoGuestMenuEn from "@/data/demo-guest-menu-en.json";
import demoGuestMenuRu from "@/data/demo-guest-menu-ru.json";
import type { GuestMenuLang } from "@/lib/guest-menu-ui-strings";

export type { GuestMenuLang };

/** Bilingual guest menu; `demo-restaurant` kept so old DB rows still work until re-seeded. */
export const GUEST_MENU_BILINGUAL_SLUGS = ["moustakallis", "demo-restaurant"] as const;

export function isGuestMenuBilingualSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return (GUEST_MENU_BILINGUAL_SLUGS as readonly string[]).includes(slug);
}

type DemoEnCategory = (typeof demoGuestMenuEn)[number];
type DemoEnItem = DemoEnCategory["items"][number];
type DemoRuCategory = (typeof demoGuestMenuRu)[number];
type DemoRuItem = DemoRuCategory["items"][number];

type GuestOptionChoice = { id: string; label: string; priceCents: number };
type GuestOptionGroup = {
  id: string;
  label: string;
  required: boolean;
  type: "single" | "multi";
  choices: GuestOptionChoice[];
};

export type GuestMenuItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  optionGroups?: GuestOptionGroup[];
  allergenCodes?: string[];
};

export type GuestMenuCategory = {
  id: string;
  name: string;
  items: GuestMenuItem[];
};

/** Greek ingredient / fragment → English (for “Χωρίς …” lines). */
const INGREDIENT_EL_TO_EN: Record<string, string> = {
  μανιτάρια: "mushrooms",
  "βούτυρο σκόρδου": "garlic butter",
  "σάλτσα κρέμας": "cream sauce",
  φέτα: "feta",
  μέλι: "honey",
  βότανα: "herbs",
  γαρίδες: "shrimp",
  "σάλτσα ντομάτας": "tomato sauce",
  ελαιόλαδο: "olive oil",
  μύδια: "mussels",
  "λευκό κρασί": "white wine",
  κολοκύθια: "zucchini",
  αυγά: "eggs",
  σκόρδο: "garlic",
  βούτυρο: "butter",
  κρεμμύδια: "onions",
  μελιτζάνες: "eggplants",
  πιπεριές: "peppers",
  μελιτζάνα: "eggplant",
  ρίγανη: "oregano",
  λεμόνι: "lemon",
  "σάλτσα λεμονιού": "lemon sauce",
  ζαμπόν: "ham",
  μπέικον: "bacon",
  κρεμμύδι: "onion",
  τυρί: "cheese",
  λαχανικά: "vegetables",
  σουβλάκι: "souvlaki",
  σεφταλιά: "sheftalia",
  παϊδάκι: "lamb chops",
  πανσέτα: "pancetta",
  λουκάνικο: "sausage",
  χαλλούμι: "halloumi",
  "πράσινο πιπέρι": "green pepper",
  μουστάρδα: "mustard",
  κρασί: "wine",
  "σάλτσα σκόρδου": "garlic sauce",
  "σάλτσα κάρρυ": "curry sauce",
  ρύζι: "rice",
  πατάτες: "potatoes",
  πατάτα: "potato",
  κολοκύθι: "zucchini",
  κιμά: "minced meat",
  μπεσαμέλ: "béchamel",
  ντομάτα: "tomato",
  τζατζίκι: "tzatziki",
  "πράσινα φασόλια": "green beans",
  καρότα: "carrots",
  φασόλια: "beans",
  αγγούρι: "cucumber",
  ελιές: "olives",
  χταπόδι: "octopus",
  "πράσινα λαχανικά": "greens",
  μαγιονέζα: "mayonnaise",
  τόνο: "tuna",
  "φύλλα σαλάτας": "salad leaves",
  καβούρι: "crab",
  "σάλτσα θαλασσινών": "seafood sauce",
  ντομάτες: "tomatoes",
  ανανά: "pineapple",
  αυγό: "egg",
  "κρέμα γάλακτος": "cream",
};

/** Exact Greek UI strings on option groups / choices → English. */
const OPTION_PHRASE_EL_TO_EN: Record<string, string> = {
  Μέγεθος: "Size",
  "Επιπλέον σάλτσα (+€2.00)": "Extra sauce (+€2.00)",
  "Η επιπλέον σάλτσα": "Extra sauce (where to serve)",
  "Σάλτσα πιπεριού": "Pepper sauce",
  "Σάλτσα Νταϊάνα": "Diana sauce",
  "Βούτυρο σκόρδου": "Garlic butter",
  "Σάλτσα σκόρδου": "Garlic sauce",
  "Σάλτσα gravy": "Gravy sauce",
  "Από πάνω στο πιάτο": "On the dish",
  "Προσθήκη mixer (+€1.50)": "Add mixer (+€1.50)",
  "Προσθήκη πίτα (+€1.50)": "Add pita (+€1.50)",
  "Αφαίρεση υλικών": "Remove ingredients",
  "Αφαίρεση ρυζιού / λαχανικών": "Remove rice / vegetables",
  "Χωρίς λαχανικά": "No vegetables",
  "Συνοδευτικό πατάτας": "Potato side",
  "Προτίμηση ψησίματος": "Cooking preference",
  Τύπος: "Type",
  "Γεύσεις (επιλέξτε 4)": "Flavours (pick 4)",
  Γεύση: "Flavour",
  Χρώμα: "Colour",
  Σάλτσα: "Sauce",
  Συνοδευτικό: "Side",
  "Το gravy sauce": "Gravy sauce",
  "Από πάνω": "On top",
  "Στο πλάι": "On the side",
  "Έξτρα τυρί": "Extra cheese",
  "Με τυρί (+€1.00)": "With cheese (+€1.00)",
  Πιπεράτη: "Pepper",
  Νταϊάνα: "Diana",
  Σκόρδου: "Garlic",
  Κρέμας: "Cream",
  Κόλα: "Cola",
  Σόδα: "Soda",
  Λεμονάδα: "Lemonade",
  Τόνικ: "Tonic",
  "Χυμός πορτοκάλι": "Orange juice",
  Πίτα: "Pita",
  "Τηγανιτές πατάτες": "French fries",
  Μπανάνα: "Banana",
  Φράουλα: "Strawberry",
  Βανίλια: "Vanilla",
  Σοκολάτα: "Chocolate",
  Λευκό: "White",
  Κόκκινο: "Red",
  Ροζέ: "Rosé",
  Ανάμικτος: "Mixed",
  Μήλο: "Apple",
  Πορτοκάλι: "Orange",
  "Με αυγό": "With egg",
  "Με ανανά": "With pineapple",
  "Σάλτσα κρέμας": "Cream sauce",
  "Σάλτσα ντομάτας": "Tomato sauce",
};

/** Same keys as `INGREDIENT_EL_TO_EN`; Russian equivalents for modifier lines. */
const INGREDIENT_EL_TO_RU: Record<string, string> = {
  μανιτάρια: "грибы",
  "βούτυρο σκόρδου": "чесночное масло",
  "σάλτσα κρέμας": "сливочный соус",
  φέτα: "фета",
  μέλι: "мёд",
  βότανα: "травы",
  γαρίδες: "креветки",
  "σάλτσα ντομάτας": "томатный соус",
  ελαιόλαδο: "оливковое масло",
  μύδια: "мидии",
  "λευκό κρασί": "белое вино",
  κολοκύθια: "кабачки",
  αυγά: "яйца",
  σκόρδο: "чеснок",
  βούτυρο: "масло",
  κρεμμύδια: "лук",
  μελιτζάνες: "баклажаны",
  πιπεριές: "перец",
  μελιτζάνα: "баклажан",
  ρίγανη: "орегано",
  λεμόνι: "лимон",
  "σάλτσα λεμονιού": "лимонный соус",
  ζαμπόν: "ветчина",
  μπέικον: "бекон",
  κρεμμύδι: "лук",
  τυρί: "сыр",
  λαχανικά: "овощи",
  σουβλάκι: "сувлаки",
  σεφταλιά: "шефталья",
  παϊδάκι: "бараньи рёбрышки",
  πανσέτα: "панчетта",
  λουκάνικο: "колбаса",
  χαλλούμι: "халлуми",
  "πράσινο πιπέρι": "зелёный перец",
  μουστάρδα: "горчица",
  κρασί: "вино",
  "σάλτσα σκόρδου": "чесночный соус",
  "σάλτσα κάρρυ": "соус карри",
  ρύζι: "рис",
  πατάτες: "картофель",
  πατάτα: "картофель",
  κολοκύθι: "кабачок",
  κιμά: "фарш",
  μπεσαμέλ: "бешамель",
  ντομάта: "помидор",
  τζατζίκι: "цацики",
  "πράσινα φασόλια": "стручковая фасоль",
  καρότα: "морковь",
  φασόλια: "фасоль",
  αγγούρι: "огурец",
  ελιές: "оливки",
  χταπόδι: "осьминог",
  "πράσινα λαχανικά": "зелень",
  μαγιονέζα: "майонез",
  τόνο: "тунец",
  "φύλλα σαλάτας": "салатные листья",
  καβούρι: "краб",
  "σάλτσα θαλασσινών": "морской соус",
  ντομάτες: "помидоры",
  ανανά: "ананас",
  αυγό: "яйцо",
  "κρέμα γάλακτος": "сливки",
};

const OPTION_PHRASE_EL_TO_RU: Record<string, string> = {
  Μέγεθος: "Размер",
  "Επιπλέον σάλτσα (+€2.00)": "Доп. соус (+€2.00)",
  "Η επιπλέον σάλτσα": "Доп. соус (куда подать)",
  "Σάλτσα πιπεριού": "Перечный соус",
  "Σάλτσα Νταϊάνα": "Соус Диана",
  "Βούτυρο σκόρδου": "Чесночное масло",
  "Σάλτσα σκόρδου": "Чесночный соус",
  "Σάλτσα gravy": "Соус подливка",
  "Από πάνω στο πιάτο": "На блюде",
  "Προσθήκη mixer (+€1.50)": "Добавить миксер (+€1.50)",
  "Προσθήκη πίτα (+€1.50)": "Добавить питу (+€1.50)",
  "Αφαίρεση υλικών": "Убрать ингредиенты",
  "Αφαίρεση ρυζιού / λαχανικών": "Без риса / овощей",
  "Χωρίς λαχανικά": "Без овощей",
  "Συνοδευτικό πατάτας": "Гарнир из картофеля",
  "Προτίμηση ψησίματος": "Пожелание по прожарке",
  Τύπος: "Тип",
  "Γεύσεις (επιλέξτε 4)": "Вкусы (выберите 4)",
  Γεύση: "Вкус",
  Χρώμα: "Цвет",
  Σάλτσα: "Соус",
  Συνοδευτικό: "Гарнир",
  "Το gravy sauce": "Соус подливка",
  "Από πάνω": "Сверху",
  "Στο πλάι": "Сбоку",
  "Έξτρα τυρί": "Доп. сыр",
  "Με τυρί (+€1.00)": "С сыром (+€1.00)",
  Πιπεράτη: "Острый",
  Νταϊάνα: "Диана",
  Σκόρδου: "Чесночный",
  Κρέμας: "Сливочный",
  Κόλα: "Кола",
  Σόδα: "Сода",
  Λεμονάδα: "Лимонад",
  Τόνικ: "Тоник",
  "Χυμός πορτοκάλι": "Апельсиновый сок",
  Πίτα: "Пита",
  "Τηγανιτές πατάτες": "Картофель фри",
  Μπανάνα: "Банан",
  Φράουλα: "Клубника",
  Βανίλια: "Ваниль",
  Σοκολάτα: "Шоколад",
  Λευκό: "Белое",
  Κόκκινο: "Красное",
  Ροζέ: "Розе",
  Ανάμικτος: "Ассорти",
  Μήλο: "Яблоко",
  Πορτοκάλι: "Апельсин",
  "Με αυγό": "С яйцом",
  "Με ανανά": "С ананасом",
  "Σάλτσα κρέμας": "Сливочный соус",
};

function translateIngredientFragment(el: string, lang: "en" | "ru"): string {
  const key = el.trim().toLowerCase();
  const map = lang === "ru" ? INGREDIENT_EL_TO_RU : INGREDIENT_EL_TO_EN;
  const t = map[key];
  return t ?? el;
}

/** Translate option group / choice labels for English or Russian guest view. */
export function translateDemoOptionLabel(el: string, lang: GuestMenuLang = "en"): string {
  if (lang === "el") return el;
  const trimmed = el.trim();
  const phraseMap = lang === "ru" ? OPTION_PHRASE_EL_TO_RU : OPTION_PHRASE_EL_TO_EN;
  const direct = phraseMap[trimmed];
  if (direct) return direct;
  const wo = "Χωρίς ";
  if (trimmed.startsWith(wo)) {
    const rest = trimmed.slice(wo.length).trim();
    if (lang === "ru") return `Без ${translateIngredientFragment(rest, "ru")}`;
    return `No ${translateIngredientFragment(rest, "en")}`;
  }
  return trimmed;
}

function localizeOptionGroups(groups: GuestOptionGroup[] | undefined, lang: GuestMenuLang): GuestOptionGroup[] | undefined {
  if (!groups?.length || (lang !== "en" && lang !== "ru")) return groups;
  return groups.map((g) => ({
    ...g,
    label: translateDemoOptionLabel(g.label, lang),
    choices: g.choices.map((c) => ({
      ...c,
      label: translateDemoOptionLabel(c.label, lang),
    })),
  }));
}

function buildDemoLookup(): Map<string, DemoEnItem> {
  const map = new Map<string, DemoEnItem>();
  for (const cat of demoGuestMenuEn as DemoEnCategory[]) {
    for (const it of cat.items) {
      map.set(`${cat.category}\t${it.name}`, it);
    }
  }
  return map;
}

const demoLookup = buildDemoLookup();

function buildDemoLookupRu(): Map<string, DemoRuItem> {
  const map = new Map<string, DemoRuItem>();
  for (const cat of demoGuestMenuRu as DemoRuCategory[]) {
    for (const it of cat.items) {
      map.set(`${cat.category}\t${it.name}`, it);
    }
  }
  return map;
}

const demoLookupRu = buildDemoLookupRu();

export function localizeGuestMenuCategories(
  categories: GuestMenuCategory[],
  lang: GuestMenuLang,
  restaurantSlug: string | null | undefined
): GuestMenuCategory[] {
  if (!isGuestMenuBilingualSlug(restaurantSlug) || lang === "el") {
    return categories;
  }
  if (lang === "en") {
    return categories.map((c) => {
      const row = (demoGuestMenuEn as DemoEnCategory[]).find((x) => x.category === c.name);
      const catNameEn = row?.categoryEn?.trim() || c.name;
      return {
        ...c,
        name: catNameEn,
        items: c.items.map((item) => {
          const en = demoLookup.get(`${c.name}\t${item.name}`);
          const nameEn = en?.nameEn?.trim() || item.name;
          const descEn = en?.descriptionEn?.trim();
          const description =
            descEn && descEn.length > 0 ? descEn : item.description;
          return {
            ...item,
            name: nameEn,
            description,
            optionGroups: localizeOptionGroups(item.optionGroups, lang),
          };
        }),
      };
    });
  }
  return categories.map((c) => {
    const row = (demoGuestMenuRu as DemoRuCategory[]).find((x) => x.category === c.name);
    const catNameRu = row?.categoryRu?.trim() || c.name;
    return {
      ...c,
      name: catNameRu,
      items: c.items.map((item) => {
        const ru = demoLookupRu.get(`${c.name}\t${item.name}`);
        const nameRu = ru?.nameRu?.trim() || item.name;
        const descRu = ru?.descriptionRu?.trim();
        const description =
          descRu && descRu.length > 0 ? descRu : item.description;
        return {
          ...item,
          name: nameRu,
          description,
          optionGroups: localizeOptionGroups(item.optionGroups, lang),
        };
      }),
    };
  });
}

/** Build the comma-separated modifier line for cart / receipts from current (localized) labels. */
export function guestOptionSummaryFromSelection(
  item: Pick<GuestMenuItem, "optionGroups">,
  selections: Record<string, string | string[]> | undefined
): string | undefined {
  const groups = item.optionGroups;
  if (!groups?.length || !selections) return undefined;
  const parts = groups
    .map((g) => {
      const sel = selections[g.id];
      if (g.type === "single" && typeof sel === "string") {
        return g.choices.find((c) => c.id === sel)?.label;
      }
      if (g.type === "multi" && Array.isArray(sel)) {
        return sel
          .map((id) => g.choices.find((c) => c.id === id)?.label)
          .filter(Boolean)
          .join(", ");
      }
      return null;
    })
    .filter(Boolean);
  if (parts.length === 0) return undefined;
  return parts.join(", ");
}
