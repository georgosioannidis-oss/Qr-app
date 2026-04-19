/**
 * Guest QR menu localization for the seeded Moustakallis venue (`slug: moustakallis`).
 * Dish copy merges `demo-guest-menu-en.json` (by Greek category + name); option labels use phrase maps.
 */
import demoGuestMenuEn from "@/data/demo-guest-menu-en.json";
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

function translateIngredientFragment(el: string): string {
  const t = INGREDIENT_EL_TO_EN[el.trim().toLowerCase()];
  return t ?? el;
}

/** Translate option group / choice labels for English guest view. */
export function translateDemoOptionLabel(el: string): string {
  const trimmed = el.trim();
  const direct = OPTION_PHRASE_EL_TO_EN[trimmed];
  if (direct) return direct;
  const wo = "Χωρίς ";
  if (trimmed.startsWith(wo)) {
    const rest = trimmed.slice(wo.length).trim();
    return `No ${translateIngredientFragment(rest)}`;
  }
  return trimmed;
}

function localizeOptionGroups(groups: GuestOptionGroup[] | undefined, lang: GuestMenuLang): GuestOptionGroup[] | undefined {
  if (!groups?.length || lang !== "en") return groups;
  return groups.map((g) => ({
    ...g,
    label: translateDemoOptionLabel(g.label),
    choices: g.choices.map((c) => ({
      ...c,
      label: translateDemoOptionLabel(c.label),
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

export function localizeGuestMenuCategories(
  categories: GuestMenuCategory[],
  lang: GuestMenuLang,
  restaurantSlug: string | null | undefined
): GuestMenuCategory[] {
  if (!isGuestMenuBilingualSlug(restaurantSlug) || lang === "el") {
    return categories;
  }
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
