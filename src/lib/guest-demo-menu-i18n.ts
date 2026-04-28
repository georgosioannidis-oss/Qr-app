/**
 * Guest QR menu localization for the seeded Moustakallis venue (`slug: moustakallis`).
 * Dish copy merges demo-guest-menu-*.json (by Greek category + name); option labels use phrase maps.
 */
import demoGuestMenuEn from "@/data/demo-guest-menu-en.json";
import demoGuestMenuFr from "@/data/demo-guest-menu-fr.json";
import demoGuestMenuPl from "@/data/demo-guest-menu-pl.json";
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
type DemoFrCategory = (typeof demoGuestMenuFr)[number];
type DemoFrItem = DemoFrCategory["items"][number];
type DemoPlCategory = (typeof demoGuestMenuPl)[number];
type DemoPlItem = DemoPlCategory["items"][number];

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
  /** Greek category from DB; used for emoji lookup when `name` is localized (e.g. RU/FR/PL). */
  nameEl?: string;
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

/** Same keys as `INGREDIENT_EL_TO_EN`; French equivalents for modifier lines. */
const INGREDIENT_EL_TO_FR: Record<string, string> = {
  μανιτάρια: "champignons",
  "βούτυρο σκόρδου": "beurre à l'ail",
  "σάλτσα κρέμας": "sauce crème",
  φέτα: "feta",
  μέλι: "miel",
  βότανα: "herbes",
  γαρίδες: "crevettes",
  "σάλτσα ντομάτας": "sauce tomate",
  ελαιόλαδο: "huile d'olive",
  μύδια: "moules",
  "λευκό κρασί": "vin blanc",
  κολοκύθια: "courgettes",
  αυγά: "œufs",
  σκόρδο: "ail",
  βούτυρο: "beurre",
  κρεμμύδια: "oignons",
  μελιτζάνες: "aubergines",
  πιπεριές: "poivrons",
  μελιτζάνα: "aubergine",
  ρίγανη: "origan",
  λεμόνι: "citron",
  "σάλτσα λεμονιού": "sauce au citron",
  ζαμπόν: "jambon",
  μπέικον: "bacon",
  κρεμμύδι: "oignon",
  τυρί: "fromage",
  λαχανικά: "légumes",
  σουβλάκι: "souvlaki",
  σεφταλιά: "sheftalia",
  παϊδάκι: "côtelettes d'agneau",
  πανσέτα: "pancetta",
  λουκάνικο: "saucisse",
  χαλλούμι: "halloumi",
  "πράσινο πιπέρι": "poivron vert",
  μουστάρδα: "moutarde",
  κρασί: "vin",
  "σάλτσα σκόρδου": "sauce à l'ail",
  "σάλτσα κάρρυ": "sauce au curry",
  ρύζι: "riz",
  πατάτες: "pommes de terre",
  πατάτα: "pomme de terre",
  κολοκύθι: "courgette",
  κιμά: "viande hachée",
  μπεσαμέλ: "béchamel",
  ντομάτα: "tomate",
  τζατζίκι: "tzatziki",
  "πράσινα φασόλια": "haricots verts",
  καρότα: "carottes",
  φασόλια: "haricots",
  αγγούρι: "concombre",
  ελιές: "olives",
  χταπόδι: "poulpe",
  "πράσινα λαχανικά": "légumes verts",
  μαγιονέζα: "mayonnaise",
  τόνο: "thon",
  "φύλλα σαλάτας": "feuilles de salade",
  καβούρι: "crabe",
  "σάλτσα θαλασσινών": "sauce fruits de mer",
  ντομάτες: "tomates",
  ανανά: "ananas",
  αυγό: "œuf",
  "κρέμα γάλακτος": "crème",
};

const OPTION_PHRASE_EL_TO_FR: Record<string, string> = {
  Μέγεθος: "Taille",
  "Επιπλέον σάλτσα (+€2.00)": "Sauce supplémentaire (+€2,00)",
  "Η επιπλέον σάλτσα": "Sauce supplémentaire (où servir)",
  "Σάλτσα πιπεριού": "Sauce au poivre",
  "Σάλτσα Νταϊάνα": "Sauce Diana",
  "Βούτυρο σκόρδου": "Beurre à l'ail",
  "Σάλτσα σκόρδου": "Sauce à l'ail",
  "Σάλτσα gravy": "Sauce gravy",
  "Από πάνω στο πιάτο": "Sur l'assiette",
  "Προσθήκη mixer (+€1.50)": "Ajouter un mixer (+€1,50)",
  "Προσθήκη πίτα (+€1.50)": "Ajouter une pita (+€1,50)",
  "Αφαίρεση υλικών": "Retirer des ingrédients",
  "Αφαίρεση ρυζιού / λαχανικών": "Sans riz / légumes",
  "Χωρίς λαχανικά": "Sans légumes",
  "Συνοδευτικό πατάτας": "Accompagnement pommes de terre",
  "Προτίμηση ψησίματος": "Cuisson souhaitée",
  Τύπος: "Type",
  "Γεύσεις (επιλέξτε 4)": "Parfums (en choisir 4)",
  Γεύση: "Parfum",
  Χρώμα: "Couleur",
  Σάλτσα: "Sauce",
  Συνοδευτικό: "Accompagnement",
  "Το gravy sauce": "Sauce gravy",
  "Από πάνω": "Par-dessus",
  "Στο πλάι": "À côté",
  "Έξτρα τυρί": "Fromage en plus",
  "Με τυρί (+€1.00)": "Avec fromage (+€1,00)",
  Πιπεράτη: "Piquant",
  Νταϊάνα: "Diana",
  Σκόρδου: "Ail",
  Κρέμας: "Crème",
  Κόλα: "Cola",
  Σόδα: "Soda",
  Λεμονάδα: "Limonade",
  Τόνικ: "Tonic",
  "Χυμός πορτοκάλι": "Jus d'orange",
  Πίτα: "Pita",
  "Τηγανιτές πατάτες": "Frites",
  Μπανάνα: "Banane",
  Φράουλα: "Fraise",
  Βανίλια: "Vanille",
  Σοκολάτα: "Chocolat",
  Λευκό: "Blanc",
  Κόκκινο: "Rouge",
  Ροζέ: "Rosé",
  Ανάμικτος: "Mixte",
  Μήλο: "Pomme",
  Πορτοκάλι: "Orange",
  "Με αυγό": "Avec œuf",
  "Με ανανά": "Avec ananas",
  "Σάλτσα κρέμας": "Sauce crème",
};

/** Same keys as `INGREDIENT_EL_TO_EN`; Polish equivalents for modifier lines. */
const INGREDIENT_EL_TO_PL: Record<string, string> = {
  μανιτάρια: "grzyby",
  "βούτυρο σκόρδου": "masło czosnkowe",
  "σάλτσα κρέμας": "sos śmietanowy",
  φέτα: "feta",
  μέλι: "miód",
  βότανα: "zioła",
  γαρίδες: "krewetki",
  "σάλτσα ντομάτας": "sos pomidorowy",
  ελαιόλαδο: "oliwa z oliwek",
  μύδια: "małże",
  "λευκό κρασί": "białe wino",
  κολοκύθια: "cukinie",
  αυγά: "jajka",
  σκόρδο: "czosnek",
  βούτυρο: "masło",
  κρεμμύδια: "cebula",
  μελιτζάνες: "bakłażany",
  πιπεριές: "papryka",
  μελιτζάνα: "bakłażan",
  ρίγανη: "oregano",
  λεμόνι: "cytryna",
  "σάλτσα λεμονιού": "sos cytrynowy",
  ζαμπόν: "szynka",
  μπέικον: "bekon",
  κρεμμύδι: "cebula",
  τυρί: "ser",
  λαχανικά: "warzywa",
  σουβλάκι: "souvlaki",
  σεφταλιά: "sheftalia",
  παϊδάκι: "żeberka jagnięce",
  πανσέτα: "pancetta",
  λουκάνικο: "kiełbasa",
  χαλλούμι: "halloumi",
  "πράσινο πιπέρι": "zielona papryka",
  μουστάρδα: "musztarda",
  κρασί: "wino",
  "σάλτσα σκόρδου": "sos czosnkowy",
  "σάλτσα κάρρυ": "sos curry",
  ρύζι: "ryż",
  πατάτες: "ziemniaki",
  πατάτα: "ziemniak",
  κολοκύθι: "cukinia",
  κιμά: "mięso mielone",
  μπεσαμέλ: "beszamel",
  ντομάτα: "pomidor",
  τζατζίκι: "tzatziki",
  "πράσινα φασόλια": "zielona fasolka szparagowa",
  καρότα: "marchew",
  φασόλια: "fasola",
  αγγούρι: "ogórek",
  ελιές: "oliwki",
  χταπόδι: "ośmiornica",
  "πράσινα λαχανικά": "zielenina",
  μαγιονέζα: "majonez",
  τόνο: "tuńczyk",
  "φύλλα σαλάτας": "liście sałaty",
  καβούρι: "krab",
  "σάλτσα θαλασσινών": "sos owoców morza",
  ντομάτες: "pomidory",
  ανανά: "ananas",
  αυγό: "jajko",
  "κρέμα γάλακτος": "śmietana",
};

const OPTION_PHRASE_EL_TO_PL: Record<string, string> = {
  Μέγεθος: "Rozmiar",
  "Επιπλέον σάλτσα (+€2.00)": "Dodatkowy sos (+€2,00)",
  "Η επιπλέον σάλτσα": "Dodatkowy sos (gdzie podać)",
  "Σάλτσα πιπεριού": "Sos pieprzowy",
  "Σάλτσα Νταϊάνα": "Sos Diana",
  "Βούτυρο σκόρδου": "Masło czosnkowe",
  "Σάλτσα σκόρδου": "Sos czosnkowy",
  "Σάλτσα gravy": "Sos gravy",
  "Από πάνω στο πιάτο": "Na talerzu",
  "Προσθήκη mixer (+€1.50)": "Dodaj mixer (+€1,50)",
  "Προσθήκη πίτα (+€1.50)": "Dodaj pitę (+€1,50)",
  "Αφαίρεση υλικών": "Usuń składniki",
  "Αφαίρεση ρυζιού / λαχανικών": "Bez ryżu / warzyw",
  "Χωρίς λαχανικά": "Bez warzyw",
  "Συνοδευτικό πατάτας": "Dodatek ziemniaczany",
  "Προτίμηση ψησίματος": "Preferencje pieczenia",
  Τύπος: "Rodzaj",
  "Γεύσεις (επιλέξτε 4)": "Smaki (wybierz 4)",
  Γεύση: "Smak",
  Χρώμα: "Kolor",
  Σάλτσα: "Sos",
  Συνοδευτικό: "Dodatek",
  "Το gravy sauce": "Sos gravy",
  "Από πάνω": "Na wierzchu",
  "Στο πλάι": "Z boku",
  "Έξτρα τυρί": "Dodatkowy ser",
  "Με τυρί (+€1.00)": "Z serem (+€1,00)",
  Πιπεράτη: "Ostry",
  Νταϊάνα: "Diana",
  Σκόρδου: "Czosnkowy",
  Κρέμας: "Śmietankowy",
  Κόλα: "Cola",
  Σόδα: "Soda",
  Λεμονάδα: "Limonada",
  Τόνικ: "Tonic",
  "Χυμός πορτοκάλι": "Sok pomarańczowy",
  Πίτα: "Pita",
  "Τηγανιτές πατάτες": "Frytki",
  Μπανάνα: "Banan",
  Φράουλα: "Truskawka",
  Βανίλια: "Wanilia",
  Σοκολάτα: "Czekolada",
  Λευκό: "Białe",
  Κόκκινο: "Czerwone",
  Ροζέ: "Różowe",
  Ανάμικτος: "Mieszane",
  Μήλο: "Jabłko",
  Πορτοκάλι: "Pomarańcza",
  "Με αυγό": "Z jajkiem",
  "Με ανανά": "Z ananasem",
  "Σάλτσα κρέμας": "Sos śmietanowy",
};

type IngredientTargetLang = "en" | "ru" | "fr" | "pl";

function translateIngredientFragment(el: string, lang: IngredientTargetLang): string {
  const key = el.trim().toLowerCase();
  const map =
    lang === "ru"
      ? INGREDIENT_EL_TO_RU
      : lang === "fr"
        ? INGREDIENT_EL_TO_FR
        : lang === "pl"
          ? INGREDIENT_EL_TO_PL
          : INGREDIENT_EL_TO_EN;
  const t = map[key];
  return t ?? el;
}

function optionPhraseMap(lang: GuestMenuLang): Record<string, string> {
  if (lang === "ru") return OPTION_PHRASE_EL_TO_RU;
  if (lang === "fr") return OPTION_PHRASE_EL_TO_FR;
  if (lang === "pl") return OPTION_PHRASE_EL_TO_PL;
  return OPTION_PHRASE_EL_TO_EN;
}

/** Translate option group / choice labels for localized guest views. */
export function translateDemoOptionLabel(el: string, lang: GuestMenuLang = "en"): string {
  if (lang === "el") return el;
  const trimmed = el.trim();
  const phraseMap = optionPhraseMap(lang);
  const direct = phraseMap[trimmed];
  if (direct) return direct;
  const wo = "Χωρίς ";
  if (trimmed.startsWith(wo)) {
    const rest = trimmed.slice(wo.length).trim();
    if (lang === "ru") return `Без ${translateIngredientFragment(rest, "ru")}`;
    if (lang === "fr") return `Sans ${translateIngredientFragment(rest, "fr")}`;
    if (lang === "pl") return `Bez ${translateIngredientFragment(rest, "pl")}`;
    return `No ${translateIngredientFragment(rest, "en")}`;
  }
  return trimmed;
}

function localizeOptionGroups(groups: GuestOptionGroup[] | undefined, lang: GuestMenuLang): GuestOptionGroup[] | undefined {
  if (!groups?.length || (lang !== "en" && lang !== "ru" && lang !== "fr" && lang !== "pl")) return groups;
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

function buildDemoLookupFr(): Map<string, DemoFrItem> {
  const map = new Map<string, DemoFrItem>();
  for (const cat of demoGuestMenuFr as DemoFrCategory[]) {
    for (const it of cat.items) {
      map.set(`${cat.category}\t${it.name}`, it);
    }
  }
  return map;
}

const demoLookupFr = buildDemoLookupFr();

function buildDemoLookupPl(): Map<string, DemoPlItem> {
  const map = new Map<string, DemoPlItem>();
  for (const cat of demoGuestMenuPl as DemoPlCategory[]) {
    for (const it of cat.items) {
      map.set(`${cat.category}\t${it.name}`, it);
    }
  }
  return map;
}

const demoLookupPl = buildDemoLookupPl();

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
        nameEl: c.name,
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
  if (lang === "ru") {
    return categories.map((c) => {
      const row = (demoGuestMenuRu as DemoRuCategory[]).find((x) => x.category === c.name);
      const catNameRu = row?.categoryRu?.trim() || c.name;
      return {
        ...c,
        nameEl: c.name,
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
  if (lang === "fr") {
    return categories.map((c) => {
      const row = (demoGuestMenuFr as DemoFrCategory[]).find((x) => x.category === c.name);
      const catNameFr = row?.categoryFr?.trim() || c.name;
      return {
        ...c,
        nameEl: c.name,
        name: catNameFr,
        items: c.items.map((item) => {
          const fr = demoLookupFr.get(`${c.name}\t${item.name}`);
          const nameFr = fr?.nameFr?.trim() || item.name;
          const descFr = fr?.descriptionFr?.trim();
          const description =
            descFr && descFr.length > 0 ? descFr : item.description;
          return {
            ...item,
            name: nameFr,
            description,
            optionGroups: localizeOptionGroups(item.optionGroups, lang),
          };
        }),
      };
    });
  }
  if (lang === "pl") {
    return categories.map((c) => {
      const row = (demoGuestMenuPl as DemoPlCategory[]).find((x) => x.category === c.name);
      const catNamePl = row?.categoryPl?.trim() || c.name;
      return {
        ...c,
        nameEl: c.name,
        name: catNamePl,
        items: c.items.map((item) => {
          const pl = demoLookupPl.get(`${c.name}\t${item.name}`);
          const namePl = pl?.namePl?.trim() || item.name;
          const descPl = pl?.descriptionPl?.trim();
          const description =
            descPl && descPl.length > 0 ? descPl : item.description;
          return {
            ...item,
            name: namePl,
            description,
            optionGroups: localizeOptionGroups(item.optionGroups, lang),
          };
        }),
      };
    });
  }
  return categories;
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
