/**
 * Default allergen codes keyed by exact `MenuItem.name` from `prisma/seed.ts`
 * (Moustakalis-style demo menu). Based on the printed PDF icons + your note that
 * e.g. Ταραμοσαλάτα shows ψάρι, αυγό, γλουτένη, σόγια.
 *
 * Guest UI merges these with whatever is saved in the database on each item.
 */

function e(names: string[], codes: string[]): Record<string, string[]> {
  return Object.fromEntries(names.map((n) => [n, [...codes]]));
}

const S = ["sulphites"];
const A = ["alcohol"];
const G = ["gluten"];

export const DEMO_MENU_ALLERGENS_BY_NAME: Record<string, string[]> = {
  // —— Κρύα ορεκτικά ——
  Ταραμοσαλάτα: ["fish", "eggs", "gluten", "soy"],
  Ταχίνι: ["sesame", "garlic"],
  Παντζαροσαλάτα: ["vegetarian"],
  Τζατζίκι: ["milk", "garlic"],
  Χούμους: ["vegetarian", "sesame"],
  Τυροκαυτερή: ["milk", "mustard"],
  Ελιές: ["vegetarian", "sulphites"],
  Γιαούρτι: ["milk"],
  Φέτα: ["milk"],
  "Γαρίδες κοκτέιλ": ["crustaceans", "eggs", "mustard"],
  "Αβοκάντο με γαρίδες": ["crustaceans", "eggs", "mustard"],
  Πίτα: ["gluten", "vegetarian"],

  // —— Ζεστά ορεκτικά ——
  Λουκάνικο: ["sulphites"],
  "Μανιτάρια με σάλτσα σκόρδου": ["milk", "gluten", "garlic", "mushroom"],
  Χαλλούμι: ["milk"],
  "Σαγανάκι με μέλι": ["milk", "gluten", "eggs"],
  Λούντζα: [],
  "Γαρίδες σαγανάκι": ["crustaceans", "milk"],
  Κουπέπια: [],
  Μύδια: ["molluscs", "milk"],
  "Κολοκύθια με αυγά": ["eggs", "vegetarian"],
  Σκορδόψωμο: ["gluten", "vegetarian", "garlic"],
  Τουρλού: ["vegetarian"],
  "Μύδια σαγανάκι": ["molluscs", "milk"],
  "Καλαμάρι τηγανιτό": ["molluscs", "gluten"],
  "Σούπα της ημέρας": [],
  "Μελιτζάνες με σκόρδο": ["vegetarian", "garlic", "milk"],

  // —— Ψάρια —— (second Μύδια / Καλαμάρι share same names as warm section)
  Ψαρομεζέδες: ["gluten", "eggs", "crustaceans", "molluscs", "fish", "peanuts", "soy", "milk", "sulphites"],
  "Τσιπούρα σχάρας": ["fish"],
  Λαυράκι: ["fish"],
  "Ξιφίας σχάρας": ["fish"],
  Σολομός: ["fish", "milk"],
  "Γαρίδες Ακάμα": ["crustaceans", "milk"],
  "Καλαμάρι στη σχάρα": ["molluscs"],
  Οχταπόδι: ["molluscs"],

  // —— Στη σχάρα ——
  "Μεζές κρεατικών": ["gluten", "eggs", "crustaceans", "fish", "peanuts", "soy", "milk", "sulphites"],
  Σεφταλιές: ["gluten"],
  "Διάφορα σχάρας": ["gluten", "milk", "sulphites"],
  "Σουβλάκι κοτόπουλο": [],
  "Σουβλάκι χοιρινό": [],
  "Μπριζόλα χοιρινή": [],
  Παϊδάκια: [],
  "Πανσέτα σχάρας": [],
  "Αρνίσιο συκώτι": [],

  // —— Μακαρονάδες / πίτσες / παιδικό ——
  "Μακαρόνια ναπολιτάνα": ["gluten", "vegetarian"],
  "Μακαρόνια μπολωνέζ": ["gluten"],
  "Μακαρόνια καρμπονάρα": ["gluten", "milk", "mushroom"],
  "Μακαρόνια με θαλασσινά": ["gluten", "milk", "crustaceans", "molluscs"],
  "Πίτσα ανάμικτη": ["gluten", "milk"],
  "Πίτσα μαργαρίτα": ["gluten", "milk"],
  "Πίτσα λαχανικών": ["gluten", "milk"],
  "Κοτόπουλο μπουκιές": ["gluten"],
  "Παναρισμένες γαρίδες": ["gluten", "crustaceans"],
  Μπέργκερ: ["gluten"],
  "Mickey Mouse": ["milk"],
  "Donald Duck": [],

  // —— Κοκτέιλ ——
  "Gin Fizz": ["sulphites", "alcohol"],
  "Sex on the Beach": ["alcohol"],
  "Pina Colada": ["milk", "alcohol"],
  "Long Island Iced Tea": ["alcohol"],
  "Blue Lagoon": ["alcohol"],
  "Aperol Spritz": ["sulphites", "alcohol"],
  Screwdriver: ["alcohol"],
  "Brandy Sour": ["alcohol", "sulphites"],
  "Ouzo Special": ["alcohol"],
  "Tequila Sunrise": ["alcohol"],
  "Bloody Mary": ["celery", "alcohol", "soy"],

  // —— Καφές / παγωτά ——
  Καπουτσίνο: ["milk"],
  Λάτε: ["milk"],
  "Freddo cappuccino": ["milk"],
  "Cyprus coffee": ["alcohol", "milk"],
  Calypso: ["alcohol", "milk"],
  "Irish coffee": ["alcohol", "milk"],
  "Royal coffee": ["alcohol", "milk"],
  Lumumba: ["alcohol", "milk"],
  "Ανάμικτο παγωτό": ["milk", "nuts"],
  "Banana split": ["milk"],
  "Special ice cream": ["milk", "alcohol"],

  // —— Επιδόρπια ——
  "Lava cake": ["milk", "eggs", "nuts", "gluten"],
  Σοκολατίνα: ["milk", "eggs", "nuts", "gluten"],
  "Μους σοκολάτας": ["milk", "eggs", "nuts", "alcohol"],
  Cheesecake: ["milk", "gluten"],
  "Γιαούρτι με μέλι": ["milk"],
  Μπακλαβάς: ["nuts", "gluten"],
  "Αχλάδι ποσέ": ["milk"],
  "Κέικ καρότου": ["milk", "eggs", "nuts", "gluten"],
  "Κρέμα καραμελέ": ["milk", "alcohol"],

  // —— Φιλέτα / κοτόπουλο ——
  "Στέικ μοσχαρίσιο πιπεράτο": ["gluten", "milk", "celery", "mustard", "sulphites", "garlic"],
  "Στέικ μοσχαρίσιο Νταϊάνα": ["mustard", "alcohol", "gluten", "soy", "milk", "eggs"],
  "Στέικ μοσχαρίσιο με σάλτσα σκόρδου": ["garlic", "milk", "gluten"],
  "Γκάμον στέικ": ["eggs"],
  "Κοτόπουλο πιπεράτο": ["gluten", "mustard", "soy", "milk", "alcohol", "eggs", "celery"],
  "Κοτόπουλο Νταϊάνα": ["gluten", "mustard", "soy", "milk", "alcohol", "eggs", "celery"],
  "Κοτόπουλο με σάλτσα σκόρδου": ["milk", "garlic", "gluten"],
  "Κοτόπουλο Κιέβου": ["gluten", "eggs", "milk", "garlic"],
  "Κοτόπουλο κάρρυ": ["milk"],
  "Κοτόπουλο «Μουστάκαλλης»": ["gluten", "milk"],
  "Στέικ μοσχαρίσιο φιλέτο": [],
  "Τι-μπον στέικ": [],
  "Κοτόπουλο φιλέτο": [],

  // —— Κυπριακά / χορτοφαγικά / σαλάτες ——
  Κλέφτικο: ["milk", "celery", "mustard", "gluten", "soy"],
  Μουσακάς: ["milk", "eggs", "gluten"],
  Στιφάδο: ["sulphites"],
  Αφέλια: ["sulphites", "gluten"],
  Γεμιστά: ["milk"],
  "Φασολάκι κοκκινιστό με αρνί": [],
  "Μουσακάς για χορτοφάγους": ["milk", "eggs", "gluten", "vegetarian"],
  Φασολάκι: ["vegetarian"],
  Φακές: ["vegetarian"],
  Λουβί: ["vegetarian"],
  "Ελληνική σαλάτα": ["milk", "vegetarian"],
  "Χωριάτικη σαλάτα": ["milk", "vegetarian"],
  "Ντομάτα και κρεμμύδι": ["vegetarian"],
  "Πράσινη σαλάτα": ["vegetarian"],
  Οχταποδοσαλάτα: ["molluscs", "fish", "eggs", "mustard"],
  Τονοσαλάτα: ["fish", "eggs", "mustard"],
  "Σαλάτα με θαλασσινά": ["crustaceans", "fish", "molluscs", "mustard"],
  "Σαλάτα του σεφ": ["crustaceans", "fish", "milk", "mustard"],
  Γαριδοσαλάτα: ["crustaceans", "eggs", "mustard"],

  ...e(
    [
      "Martini Brut / Asti",
      "Κρασί του σπιτιού (ποτήρι)",
      "Κρασί του σπιτιού (καράφα 0.5L)",
      "Κρασί του σπιτιού (καράφα 1L)",
    ],
    S
  ),

  ...e(
    [
      "Strongbow",
      "Kopparberg",
    ],
    ["sulphites", "gluten"]
  ),

  ...e(
    [
      "KEO βαρελίσια",
      "KEO μπουκάλι",
      "Carlsberg",
      "Leon",
      "Heineken",
      "Guinness",
      "Μπύρα χωρίς αλκοόλ",
    ],
    G
  ),

  ...e(
    [
      "Monkey 47",
      "Silent Pool",
      "Bombay Sapphire",
      "Hendricks",
      "The Botanist",
      "Tanqueray No.10",
      "Gin Mare",
      "Whitley Neill",
      "Gordon's",
      "Ουίσκι J&B",
      "Ουίσκι Red Label",
      "Ουίσκι Famous Grouse",
      "Ουίσκι Chivas",
      "Ουίσκι Black Label",
      "Βότκα Standard",
      "Βότκα Grey Goose",
      "Ρούμι",
      "Τεκίλα",
      "Martini",
      "Campari",
      "Κουμανδαρία",
      "Ούζο",
      "Baileys",
      "Tia Maria",
      "Disaronno",
      "Μαστίχα",
      "Ζιβανία",
    ],
    A
  ),

  ...e(
    [
      "Vasilikon – Vasilissa",
      "Vasilikon – Vasilikon",
      "Vasilikon – Omma",
      "Vouni Panayia – Alina (λευκό)",
      "Vouni Panayia – Promara",
      "Kolios – Persefoni",
      "Kolios – Iris",
      "Kyperounda – Petrites",
      "Kyperounda – Alimos",
      "Tsiakkas – Sauvignon Blanc",
      "Sterna – Kelaidonis",
      "Chablis – Domaine Servin",
      "Bourgogne – Bouchard Père & Fils",
      "Bishop's Leap – Sauvignon Blanc",
      "Montes – Chardonnay",
      "Bertani Velante – Pinot Grigio",
      "Boutari – Μοσχοφίλερο",
      "Vasilikon – Agios Onoufrios",
      "Vasilikon – Aeon",
      "Vasilikon – Methi",
      "Kyperounda – Andesites",
      "Kyperounda – Psila Klimata",
      "Kolios – Ayios Fotios",
      "Kolios – Statos",
      "Vouni Panayia – Barba Yiannis",
      "Vouni Panayia – Yiannoudi",
      "Vlassides – Shiraz",
      "Vlassides – Artion",
      "Makkas – Merlot",
      "Domaine Denis Carré – Pinot Noir",
      "Le Tours Seguy – Merlot",
      "Purple Angel – Carménère",
      "Alpha – Cabernet Sauvignon",
      "Bertani – Ripasso",
      "Castello Banfi – Chianti",
      "Vouni Panayia – Alina (ημίξηρο)",
      "Kolios – Status99",
      "Fikardos – Katerina",
      "Sterna (ημίγλυκο)",
      "Avakas – Cornelious",
      "Vasilikon – Εινάλια",
      "Fikardos – Valentina",
      "Kalamos – Demetra",
      "Sterna (ροζέ)",
      "Vouni Panayia – Pampela",
      "Ezousa – Eros",
      "Eagle Creek – Zinfandel",
      "Montes Cherub – Syrah & Grenache",
      "Mateus – Sogrape",
      "Dom Pérignon Brut",
      "Veuve Clicquot Rosé Brut NV",
      "Moët & Chandon Rosé Impérial NV",
      "Veuve Clicquot Yellow Label Brut NV",
      "Moët & Chandon Brut Impérial NV",
      "Beato Bartolomeo Prosecco NV",
      "Maschio Prosecco NV",
      "Henkell Trocken",
    ],
    S
  ),

  "Milk shake": ["milk", "nuts"],
};
