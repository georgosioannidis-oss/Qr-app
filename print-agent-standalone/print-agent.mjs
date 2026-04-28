#!/usr/bin/env node
/**
 * Standalone station auto-print agent (same behaviour as scripts/print-agent.mjs in the full app).
 * Customers only need this folder + Node — not the QR Menu source code.
 */

import { spawn } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

/** Preview ticket layout locally: `node scripts/print-agent.mjs --sample` (optional PRINT_AGENT_STATION=bar). */
const SAMPLE_MODE = process.argv.includes("--sample");
if (SAMPLE_MODE) {
  process.env.PRINT_AGENT_BASE_URL ||= "https://example.invalid";
  process.env.PRINT_AGENT_API_SECRET ||= "sample-not-used";
  process.env.PRINT_AGENT_RESTAURANT_SLUG ||= "sample";
  process.env.PRINT_AGENT_STATION ||= "kitchen";
}

const BASE =
  process.env.PRINT_AGENT_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "";
/** Trim + strip line breaks (common when pasting env values in PowerShell). */
const API_SECRET = (process.env.PRINT_AGENT_API_SECRET || "").trim().replace(/[\r\n]+/g, "");
const RESTAURANT_SLUG = (process.env.PRINT_AGENT_RESTAURANT_SLUG || "").trim().replace(/[\r\n]+/g, "");
const POLL_MS = Math.max(3000, parseInt(process.env.PRINT_AGENT_POLL_MS || "5000", 10) || 5000);
const PRINT_CMD = process.env.PRINT_COMMAND || "";
/** Ethernet / thermal: send ESC/POS text to printer IP (JetDirect raw port, usually 9100). */
const RAW_HOST = (process.env.PRINT_AGENT_RAW_HOST || "").trim();
const RAW_PORT = (() => {
  const n = parseInt(process.env.PRINT_AGENT_RAW_PORT || "9100", 10);
  if (!Number.isFinite(n) || n < 1 || n > 65535) return 9100;
  return n;
})();
const RAW_ASCII_ONLY = /^(1|true|yes)$/i.test(String(process.env.PRINT_AGENT_RAW_ASCII_ONLY || "").trim());
const STATION = (process.env.PRINT_AGENT_STATION || "").trim().toLowerCase();
const PDF_DIR = process.env.PRINT_AGENT_PDF_DIR || path.join(process.cwd(), "print-agent-pdfs");
const FONT_PATH = process.env.PRINT_AGENT_FONT_PATH || "";
const COUNTER_FILE =
  process.env.PRINT_AGENT_COUNTER_FILE || path.join(PDF_DIR, `${STATION}-ticket-counter.txt`);
const STATION_LABELS = {
  bar: "BAR",
  "cold-kitchen": "COLD KITCHEN",
  kitchen: "KITCHEN",
};
let nextTicketNumber = null;

if (
  !SAMPLE_MODE &&
  (!BASE || !API_SECRET || !RESTAURANT_SLUG || !STATION_LABELS[STATION])
) {
  console.error(
    "Missing PRINT_AGENT_BASE_URL (or NEXT_PUBLIC_APP_URL), PRINT_AGENT_API_SECRET, PRINT_AGENT_RESTAURANT_SLUG, or PRINT_AGENT_STATION.\n" +
      "Use the same PRINT_AGENT_API_SECRET on the server and this PC (see Dashboard → Options / Branding → Auto-print).\n" +
      "  PRINT_AGENT_BASE_URL=https://your-site.com   (no path after the domain)\n" +
      "  PRINT_AGENT_API_SECRET=long-random-shared-secret\n" +
      "  PRINT_AGENT_RESTAURANT_SLUG=your-dashboard-slug\n" +
      "  PRINT_AGENT_STATION=bar | cold-kitchen | kitchen\n" +
      "  PRINT_AGENT_PDF_DIR=./print-agent-pdfs\n" +
      "  npm start"
  );
  process.exit(1);
}

/** Modern Greek → Latin; strips accents from Latin; drops unsupported symbols to "?". */
const GREEK_TO_LATIN = (() => {
  const pairs = [
    ["Α", "A"],
    ["Β", "V"],
    ["Γ", "G"],
    ["Δ", "D"],
    ["Ε", "E"],
    ["Ζ", "Z"],
    ["Η", "I"],
    ["Θ", "TH"],
    ["Ι", "I"],
    ["Κ", "K"],
    ["Λ", "L"],
    ["Μ", "M"],
    ["Ν", "N"],
    ["Ξ", "X"],
    ["Ο", "O"],
    ["Π", "P"],
    ["Ρ", "R"],
    ["Σ", "S"],
    ["Τ", "T"],
    ["Υ", "Y"],
    ["Φ", "F"],
    ["Χ", "CH"],
    ["Ψ", "PS"],
    ["Ω", "O"],
    ["α", "a"],
    ["β", "v"],
    ["γ", "g"],
    ["δ", "d"],
    ["ε", "e"],
    ["ζ", "z"],
    ["η", "i"],
    ["θ", "th"],
    ["ι", "i"],
    ["κ", "k"],
    ["λ", "l"],
    ["μ", "m"],
    ["ν", "n"],
    ["ξ", "x"],
    ["ο", "o"],
    ["π", "p"],
    ["ρ", "r"],
    ["σ", "s"],
    ["ς", "s"],
    ["τ", "t"],
    ["υ", "y"],
    ["φ", "f"],
    ["χ", "ch"],
    ["ψ", "ps"],
    ["ω", "o"],
    ["Ά", "A"],
    ["Έ", "E"],
    ["Ή", "I"],
    ["Ί", "I"],
    ["Ό", "O"],
    ["Ύ", "Y"],
    ["Ώ", "O"],
    ["ά", "a"],
    ["έ", "e"],
    ["ή", "i"],
    ["ί", "i"],
    ["ό", "o"],
    ["ύ", "y"],
    ["ώ", "o"],
    ["Ϊ", "I"],
    ["Ϋ", "Y"],
    ["ϊ", "i"],
    ["ϋ", "y"],
    ["ΐ", "i"],
    ["ΰ", "y"],
  ];
  const m = Object.create(null);
  for (const [g, l] of pairs) m[g] = l;
  return m;
})();

function toTicketAsciiEnglish(input) {
  const s = String(input ?? "");
  let out = "";
  for (const ch of s) {
    const g = GREEK_TO_LATIN[ch];
    if (g != null) {
      out += g;
      continue;
    }
    if (ch.codePointAt(0) < 128) {
      out += ch;
      continue;
    }
    if (ch === "€") {
      out += "EUR";
      continue;
    }
    const stripped = ch.normalize("NFD").replace(/\p{M}/gu, "");
    if (stripped && /^[\x01-\x7F]+$/.test(stripped)) {
      out += stripped;
      continue;
    }
    out += "?";
  }
  return out;
}

/** Strip Greek tonos accent marks so dict matches work even when menu items lack accents. */
function stripTonos(s) {
  return s.normalize("NFD").replace(/́/g, "").normalize("NFC");
}

/** Short English labels for known option group titles (ticket layout). */
const TICKET_UI_SHORT = {
  "Για πόσα άτομα;": "Pax",
  "Για πόσα άτομα": "Pax",
  "Από πάνω στο πιάτο": "On plate",
  "Μέγεθος": "Size",
  "Σάλτσα": "Sauce",
  "Συνοδευτικό": "Side",
  "Τύπος": "Type",
  "Γεύση": "Flavor",
  "Χρώμα": "Color",
  "Αφαίρεση υλικών": "No",
  "Η επιπλέον σάλτσα": "Sauce",
  "Επιπλέον σάλτσα (+€2.00)": "Xtra sauce",
  "Προσθήκη mixer (+€1.50)": "+Mixer",
  "Προσθήκη πίτα (+€1.50)": "+Pita",
  "Αφαίρεση ρυζιού / λαχανικών": "No rice/veg",
  "Χωρίς λαχανικά": "No veg",
  "Χωρίς τηγανητές πατάτες — No chips": "No chips",
  "Συνοδευτικό πατάτας": "Potato side",
  "Προτίμηση ψησίματος": "Cook",
  "Γεύσεις (επιλέξτε 4)": "Flavors (4)",
  "Από πάνω": "On top",
  "Στο πλάι": "Side",
  "Έξτρα τυρί": "Xtra cheese",
  "Με τυρί (+€1.00)": "+Cheese",
  "Σάλτσα πιπεριού": "Pepper sauce",
  "Σάλτσα Νταϊάνα": "Diana sauce",
  "Βούτυρο σκόρδου": "Garlic butter",
  "Σάλτσα σκόρδου": "Garlic sauce",
  "Σάλτσα gravy": "Gravy",
};

/** Greek words / menu phrases → English (case-insensitive match). UI_SHORT wins on duplicate keys. */
const TICKET_PHRASE_EN = Object.assign(
  {
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
    Μέγεθος: "Size",
    "Επιπλέον σάλτσα (+€2.00)": "Extra sauce (+€2.00)",
    "Η επιπλέον σάλτσα": "Extra sauce (where)",
    "Το gravy sauce": "Gravy sauce",
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
    άτομα: "guests",
    // ── PASTA & GRAINS (longest phrases first) ──────────────────────────────
    "μακαρόνια καρμπονάρα": "pasta carbonara",
    "μακαρόνια μπολονέζε": "pasta bolognese",
    "μακαρόνια μπολονέζ": "pasta bolognese",
    "μακαρόνια με κιμά": "spaghetti bolognese",
    "μακαρόνια με σάλτσα": "pasta with sauce",
    "μακαρόνια": "pasta",
    "μακαρόνι": "pasta",
    "σπαγγέτι": "spaghetti",
    "σπαγέτι": "spaghetti",
    "καρμπονάρα": "carbonara",
    "μπολονέζε": "bolognese",
    "μπολονέζ": "bolognese",
    "αραμπιάτα": "arrabbiata",
    "λαζάνια": "lasagne",
    "ριζότο": "risotto",
    "πίτσα": "pizza",
    "πένες": "penne",
    "φαρφάλες": "farfalle",
    "τορτελίνια": "tortellini",
    "ραβιόλια": "ravioli",
    // ── PROTEINS ────────────────────────────────────────────────────────────
    "κοτοπουλάκι": "chicken",
    "κοτόπουλο": "chicken",
    "χοιρινό": "pork",
    "μοσχαράκι": "veal",
    "μοσχάρι": "beef",
    "βοδινό": "beef",
    "αρνάκι": "lamb",
    "αρνί": "lamb",
    "κατσίκι": "goat",
    "κουνέλι": "rabbit",
    "πάπια": "duck",
    "τόνος": "tuna",
    "σολομός": "salmon",
    "μπακαλιάρος": "cod",
    "τσιπούρα": "sea bream",
    "λαβράκι": "sea bass",
    "γλώσσα": "sole",
    "σκορπιός": "scorpionfish",
    "ροφός": "grouper",
    "συναγρίδα": "red snapper",
    "ψάρι": "fish",
    "καλαμαράκια": "calamari",
    "καλαμάρια": "calamari",
    "σουπιές": "cuttlefish",
    "σούπια": "cuttlefish",
    "αστακός": "lobster",
    "καραβίδα": "crayfish",
    // ── MEAT DISHES ─────────────────────────────────────────────────────────
    "μπριζόλα χοιρινή": "pork chop",
    "μπριζόλα μοσχαρίσια": "beef steak",
    "μπριζόλα": "chop",
    "παϊδάκια": "lamb chops",
    "κεμπάπ": "kebab",
    "γύρος": "gyros",
    "σνίτσελ": "schnitzel",
    "κεφτεδάκια": "meatballs",
    "κεφτέδες": "meatballs",
    "κεφτέδας": "meatball",
    "σουτζουκάκια": "meat patties in tomato sauce",
    "μουσακάς": "moussaka",
    "παστίτσιο": "pastitsio",
    "παπουτσάκια": "stuffed aubergines",
    "γεμιστά": "stuffed vegetables",
    "ντολμάδες": "dolmades",
    "κλέφτικο": "kleftiko",
    "σπετζοφάι": "spicy sausage stew",
    "ιμάμ μπαϊλντί": "imam bayildi",
    "μπριάμ": "mixed vegetable bake",
    "κοκκινιστό": "in tomato sauce",
    "γιαχνί": "stewed",
    // ── STARTERS / MEZEDES ──────────────────────────────────────────────────
    "ταραμοσαλάτα": "taramasalata",
    "μελιτζανοσαλάτα": "aubergine dip",
    "τυροκαυτερή": "spicy cheese dip",
    "σκορδαλιά": "garlic dip",
    "χούμους": "hummus",
    "σαγανάκι": "saganaki",
    "τυροπιτάκια": "cheese pies",
    "τυρόπιτα": "cheese pie",
    "σπανακόπιτα": "spinach pie",
    "κροκέτες": "croquettes",
    "μανιταροπιτάκια": "mushroom pies",
    "χαλουμοπιτάκια": "halloumi pies",
    // ── VEGETABLES & SIDES ──────────────────────────────────────────────────
    "φασολάκια κοκκινιστά": "green beans in tomato sauce",
    "φασολάκια": "green beans",
    "φασολάκι": "green bean",
    "κολοκυθάκια": "zucchini",
    "μπάμιες": "okra",
    "αγκινάρες": "artichokes",
    "σπανάκι": "spinach",
    "χόρτα": "wild greens",
    "παντζάρια": "beetroot",
    "φακές": "lentils",
    "ρεβίθια": "chickpeas",
    "αβοκάντο": "avocado",
    "καλαμπόκι": "corn",
    "μανιτάρι": "mushroom",
    "τρούφα": "truffle",
    // ── SALADS ──────────────────────────────────────────────────────────────
    "χωριάτικη σαλάτα": "greek salad",
    "χωριάτικη": "greek salad",
    "μαρουλοσαλάτα": "lettuce salad",
    "τονοσαλάτα": "tuna salad",
    "κοτοσαλάτα": "chicken salad",
    "σαλάτα εποχής": "seasonal salad",
    "σαλάτα": "salad",
    "μαρούλι": "lettuce",
    "ρόκα": "rocket",
    "κινόα": "quinoa",
    // ── COOKING METHODS ─────────────────────────────────────────────────────
    "ψητό": "grilled",
    "ψητή": "grilled",
    "ψητός": "grilled",
    "τηγανητό": "fried",
    "τηγανητή": "fried",
    "τηγανητός": "fried",
    "βραστό": "boiled",
    "βραστή": "boiled",
    "φούρνου": "oven-baked",
    "σχάρας": "chargrilled",
    "κανονικό": "regular",
    "κανονικός": "regular",
    "μεγάλο": "large",
    "μεγάλη": "large",
    "μικρό": "small",
    "μικρή": "small",
    "μέτριο": "medium",
    "μισό": "half",
    "διπλό": "double",
    "εξτρα": "extra",
    "φρέσκο": "fresh",
    "φρέσκια": "fresh",
    "μαριναρισμένο": "marinated",
    "με σάλτσα": "with sauce",
    "χωρίς σάλτσα": "no sauce",
    // ── SOUPS ───────────────────────────────────────────────────────────────
    "ψαρόσουπα": "fish soup",
    "κοτόσουπα": "chicken soup",
    "κρεατόσουπα": "meat soup",
    "φακόσουπα": "lentil soup",
    "σούπα": "soup",
    // ── BREAD ───────────────────────────────────────────────────────────────
    "ψωμί": "bread",
    "φρυγανιές": "toast",
    "κριτσίνια": "breadsticks",
    "πεϊνιρλί": "cheese bread boat",
    // ── DESSERTS ────────────────────────────────────────────────────────────
    "κρέμα καραμελέ": "crème caramel",
    "παγωτό βανίλια": "vanilla ice cream",
    "παγωτό σοκολάτα": "chocolate ice cream",
    "παγωτό": "ice cream",
    "κέικ σοκολάτας": "chocolate cake",
    "κέικ": "cake",
    "τάρτα": "tart",
    "τιραμισού": "tiramisu",
    "μπακλαβάς": "baklava",
    "λουκουμάδες": "loukoumades",
    "γαλακτομπούρεκο": "galaktoboureko",
    "μελόπιτα": "honey pie",
    "ρυζόγαλο": "rice pudding",
    "χαλβάς": "halva",
    "κουραμπιές": "shortbread",
    "μελομακάρονο": "honey cookie",
    "μους σοκολάτας": "chocolate mousse",
    "μους": "mousse",
    "σορμπέ": "sorbet",
    "βάφλα": "waffle",
    "κρέπα": "crepe",
    "πάστα": "pastry",
    "εκλέρ": "eclair",
    // ── DRINKS ──────────────────────────────────────────────────────────────
    "μπύρα βαρέλι": "draft beer",
    "μπύρα": "beer",
    "νερό": "water",
    "μεταλλικό νερό": "sparkling water",
    "χυμός πορτοκάλι": "orange juice",
    "χυμός": "juice",
    "αναψυκτικό": "soft drink",
    "φραπέ": "frappe",
    "καπουτσίνο": "cappuccino",
    "εσπρέσο": "espresso",
    "ελληνικός καφές": "greek coffee",
    "καφές φίλτρου": "filter coffee",
    "καφές": "coffee",
    "τσάι": "tea",
    "χαμομήλι": "chamomile",
    "ούζο": "ouzo",
    "τσίπουρο": "tsipouro",
    "ρακή": "raki",
    "κονιάκ": "cognac",
    "ουίσκι": "whisky",
    "βότκα": "vodka",
    "τζιν": "gin",
    "ρούμι": "rum",
    "σαμπάνια": "champagne",
    "κρασί ερυθρό": "red wine",
    "κρασί λευκό": "white wine",
    "κρασί ροζέ": "rosé wine",
    "κοκτέιλ": "cocktail",
    "λικέρ": "liqueur",
    "μοχίτο": "mojito",
    "σπρίτζ": "spritz",
    // ── CONNECTIVES ─────────────────────────────────────────────────────────
    "με": "with",
    "και": "and",
    "για": "for",
    "σεφ": "chef",
    "σάλτσα": "sauce",
    // ── MISSING DISHES / CYPRIOT ─────────────────────────────────────────────
    "σούπα της ημέρας": "soup of the day",
    "σούπα τις ημέρας": "soup of the day",
    "σαλάτα θαλασσινών": "seafood salad",
    "σαλάτα με θαλασσινά": "seafood salad",
    "σαλάτα του σεφ": "chef's salad",
    "ελληνική σαλάτα": "greek salad",
    "πράσινη σαλάτα": "green salad",
    "ελληνική": "greek",
    "πράσινη": "green",
    "θαλασσινά": "seafood",
    "θαλασσινών": "seafood",
    "οχταποδοσαλάτα": "octopus salad",
    "τονοσαλάτα": "tuna salad",
    "γαριδοσαλάτα": "shrimp salad",
    "κοτοσαλάτα": "chicken salad",
    "παντζαροσαλάτα": "beetroot salad",
    "καλαμάρια τηγανητά": "fried calamari",
    "καλαμάρι τηγανητό": "fried calamari",
    "σκορδόψωμο": "garlic bread",
    "ταχίνι": "tahini",
    "γιαούρτι": "yogurt",
    "λούντζα": "lountza",
    "κουπέπια": "koupepia",
    "τουρλού": "mixed vegetable stew",
    "χορτοφάγους": "vegetarian",
    "χορτοφάγος": "vegetarian",
    "χορτοφάγο": "vegetarian",
    "λούβια": "black-eyed peas",
    "λούβι": "black-eyed peas",
    "κολοκάσι": "taro",
    "φασολάκι": "green bean",
    "κοκτέιλ": "cocktail",
    "κοκτέηλ": "cocktail",
    "κοκτέιλ γαρίδας": "shrimp cocktail",
    "αβοκάντο με γαρίδες": "avocado with shrimp",
  },
  TICKET_UI_SHORT
);

// Tonos-stripped version of phrase map — menu items may be saved without accent marks.
const TICKET_PHRASE_EN_NORM = (() => {
  const m = Object.create(null);
  const entries = Object.entries(TICKET_PHRASE_EN).sort(([a], [b]) => b.length - a.length);
  for (const [k, v] of entries) {
    const kn = stripTonos(k);
    if (!m[kn]) m[kn] = v;
  }
  return m;
})();

function normSpaces(s) {
  return String(s).replace(/\s+/g, " ").trim();
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Replace longest Greek phrases first (case-insensitive). */
function replacePhrasesInsensitive(text, map) {
  let x = text;
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    const re = new RegExp(escapeRegExp(k), "giu");
    x = x.replace(re, map[k]);
  }
  return x;
}

/** All user-visible ticket text → English words + ASCII for thermal. */
function ticketEnglishText(s) {
  let x = normSpaces(String(s ?? ""));
  if (!x) return "";
  x = stripTonos(x);
  x = replacePhrasesInsensitive(x, TICKET_PHRASE_EN_NORM);
  x = x.replace(/(\d+)\s*ατομα/giu, "$1 guests");
  x = x.replace(/Χωρις\s+/giu, "No ");
  x = normSpaces(x.replace(/\s+/g, " "));
  return toTicketAsciiEnglish(x);
}

function compactOptionSegment(segment) {
  let s = normSpaces(segment);
  if (!s) return "";
  const colonIdx = s.indexOf(":");
  if (colonIdx > 0) {
    const group = normSpaces(s.slice(0, colonIdx));
    const value = normSpaces(s.slice(colonIdx + 1));
    if (/^Για πόσα άτομα;?$/u.test(group)) {
      const m = value.match(/^(\d+)\s*άτομα$/u);
      if (m) return `Pax ${m[1]}`;
      return value ? `Pax ${value}` : "Pax";
    }
    const short = TICKET_UI_SHORT[group] ?? TICKET_UI_SHORT[group.replace(/;$/u, "")];
    if (short) return value ? `${short}: ${value}` : short;
  }
  const sortedKeys = Object.keys(TICKET_UI_SHORT).sort((a, b) => b.length - a.length);
  for (const el of sortedKeys) {
    if (s.startsWith(el + ":")) {
      const rest = normSpaces(s.slice(el.length + 1));
      const en = TICKET_UI_SHORT[el];
      return rest ? `${en}: ${rest}` : en;
    }
  }
  const onlyPax = s.match(/^(\d+)\s*άτομα$/u);
  if (onlyPax) return `Pax ${onlyPax[1]}`;
  return s;
}

/** Option summary line: compact groups, then full English pass. */
function compactTicketDetailText(raw) {
  const parts = String(raw ?? "")
    .split(/\s*·\s*/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(compactOptionSegment);
  return ticketEnglishText(parts.join(" | "));
}

function wrapLine(text, width, indent = "") {
  const source = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!source) return [indent];
  const words = source.split(" ");
  const rows = [];
  let current = indent;
  const max = Math.max(8, width);

  for (const word of words) {
    if (current.trim().length === 0) {
      if ((indent + word).length <= max) {
        current = indent + word;
      } else {
        rows.push(...chunkLongWord(word, max, indent));
        current = indent;
      }
      continue;
    }
    const next = `${current} ${word}`;
    if (next.length <= max) {
      current = next;
      continue;
    }
    rows.push(current);
    if ((indent + word).length <= max) {
      current = indent + word;
    } else {
      rows.push(...chunkLongWord(word, max, indent));
      current = indent;
    }
  }
  if (current.trim().length > 0) rows.push(current);
  return rows;
}

function chunkLongWord(word, width, indent = "") {
  const rows = [];
  const avail = Math.max(1, width - indent.length);
  for (let i = 0; i < word.length; i += avail) {
    rows.push(indent + word.slice(i, i + avail));
  }
  return rows;
}

function pushBlankLines(rows, count = 1) {
  for (let i = 0; i < count; i++) rows.push("");
}

function shortStationHeading() {
  if (STATION === "bar") return "BAR";
  if (STATION === "cold-kitchen") return "COLD";
  return "KITCHEN";
}

function centerLine(text, width) {
  const t = String(text).slice(0, width);
  const pad = Math.max(0, Math.floor((width - t.length) / 2));
  return " ".repeat(pad) + t;
}

function itemOptionLines(it, w) {
  const lines = [];
  if (it.selectedOptionsSummary) {
    const opts = String(it.selectedOptionsSummary)
      .split(/\s*·\s*/)
      .map((p) => ticketEnglishText(compactOptionSegment(p.trim())).toUpperCase())
      .filter(Boolean);
    for (const opt of opts) {
      lines.push(...wrapLine(opt, w, "   "));
    }
  }
  if (it.notes) {
    lines.push(...wrapLine(ticketEnglishText(it.notes).toUpperCase(), w, "   "));
  }
  return lines;
}

function printItems(items, rows, w) {
  for (const it of items) {
    rows.push(...wrapLine(`${it.quantity}  ${ticketEnglishText(it.name).toUpperCase()}`, w));
    rows.push(...itemOptionLines(it, w));
  }
}

function formatTicketLines(order) {
  const w = 28;
  const sep = "-".repeat(w);
  const rows = [];

  // Header
  rows.push(sep);
  rows.push(centerLine("SEAT IN", w));
  rows.push(centerLine("*** TABLE ***", w));
  rows.push(centerLine(ticketEnglishText(order.tableName).toUpperCase(), w));
  rows.push(sep);
  rows.push("");

  if (STATION === "bar") {
    if (order.items.length > 0) {
      rows.push("Bar");
      rows.push("-".repeat("Bar".length));
      printItems(order.items, rows, w);
      rows.push("");
    }
  } else {
    // Split items: cold kitchen → Starters, others → Main Course
    const starters = order.items.filter((it) => it.routedStation === "Cold kitchen");
    const mains = order.items.filter((it) => it.routedStation !== "Cold kitchen");

    if (starters.length > 0) {
      rows.push("Starters");
      rows.push("-".repeat("Starters".length));
      printItems(starters, rows, w);
      rows.push("");
    }

    if (mains.length > 0) {
      rows.push("Main Course");
      rows.push("-".repeat("Main Course".length));
      printItems(mains, rows, w);
      rows.push("");
    }
  }

  rows.push(sep);
  return rows;
}

function sanitizeFilePart(value) {
  return String(value)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 64);
}

function toWinAnsiSafeText(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

function buildTicketFileName(order) {
  const ts = new Date(order.createdAt).toISOString().replace(/[:.]/g, "-");
  const table = sanitizeFilePart(order.tableName);
  const idShort = sanitizeFilePart(order.id).slice(0, 10);
  const station = sanitizeFilePart(STATION);
  return `${ts}_${station}_${table}_${idShort}.pdf`;
}

async function loadPdfFont(doc) {
  const candidates = [
    FONT_PATH,
    "C:\\Windows\\Fonts\\arial.ttf",
    "C:\\Windows\\Fonts\\segoeui.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  ].filter(Boolean);

  doc.registerFontkit(fontkit);
  for (const fontPath of candidates) {
    try {
      await access(fontPath);
      const bytes = await readFile(fontPath);
      const font = await doc.embedFont(bytes, { subset: true });
      return { font, unicode: true, fontPath };
    } catch {
      // Try next candidate.
    }
  }

  const fallback = await doc.embedFont(StandardFonts.Courier);
  return { font: fallback, unicode: false, fontPath: null };
}

async function renderTicketPdf(order) {
  const doc = await PDFDocument.create();
  let page = doc.addPage([226.77, 700]);
  const fontInfo = await loadPdfFont(doc);
  const font = fontInfo.font;

  const rows = formatTicketLines(order);
  const fontSize = 14;
  const lineHeight = 20;
  let y = page.getHeight() - 24;

  for (const row of rows) {
    if (y < 24) {
      y = page.getHeight() - 24;
      page = doc.addPage([226.77, 700]);
    }
    const text = fontInfo.unicode ? row : toWinAnsiSafeText(row);
    page.drawText(text, {
      x: 12,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight;
  }
  return { bytes: await doc.save(), fontPath: fontInfo.fontPath, usingUnicode: fontInfo.unicode };
}

async function writeTicketPdf(order) {
  await mkdir(PDF_DIR, { recursive: true });
  const filePath = path.join(PDF_DIR, buildTicketFileName(order));
  const rendered = await renderTicketPdf(order);
  await writeFile(filePath, Buffer.from(rendered.bytes));
  return { filePath, fontPath: rendered.fontPath, usingUnicode: rendered.usingUnicode };
}

async function readLastTicketNumber() {
  try {
    const raw = await readFile(COUNTER_FILE, "utf8");
    const n = Number.parseInt(raw.trim(), 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

async function reserveNextTicketNumber() {
  if (nextTicketNumber == null) {
    const last = await readLastTicketNumber();
    nextTicketNumber = last + 1;
  }
  const current = nextTicketNumber;
  nextTicketNumber += 1;
  await mkdir(path.dirname(COUNTER_FILE), { recursive: true });
  await writeFile(COUNTER_FILE, String(current), "utf8");
  return current;
}

function buildEscPosPayload(lines) {
  const chunks = [Buffer.from([0x1b, 0x40])]; // ESC @ initialize
  const body = `${lines.join("\n")}\n\n`;
  chunks.push(Buffer.from(body, "utf8"));
  return Buffer.concat(chunks);
}

function sendRawToNetworkPrinter(buffer) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: RAW_HOST, port: RAW_PORT });
    let settled = false;
    const fail = () => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(false);
    };
    const ok = () => {
      if (settled) return;
      settled = true;
      resolve(true);
    };
    socket.setTimeout(20000);
    socket.once("timeout", () => {
      console.error(`Raw print: timeout connecting or sending to ${RAW_HOST}:${RAW_PORT}`);
      fail();
    });
    socket.once("error", (err) => {
      console.error(`Raw print: ${err.message} (${RAW_HOST}:${RAW_PORT})`);
      fail();
    });
    socket.once("connect", () => {
      socket.write(buffer, (err) => {
        if (err) {
          console.error("Raw print: write failed:", err.message);
          fail();
          return;
        }
        socket.end();
      });
    });
    socket.once("finish", () => ok());
  });
}

async function sendPdfToPrinter(pdfFilePath) {
  if (!PRINT_CMD) {
    console.log(`PDF saved: ${pdfFilePath}`);
    return true;
  }

  const escapedPath = `"${pdfFilePath.replace(/"/g, '\\"')}"`;
  const command = PRINT_CMD.includes("{file}")
    ? PRINT_CMD.replaceAll("{file}", escapedPath)
    : `${PRINT_CMD} ${escapedPath}`;

  return new Promise((resolve) => {
    const child = spawn(command, { shell: true, stdio: ["ignore", "inherit", "inherit"] });
    child.on("error", (err) => {
      console.error("Print command failed:", err.message);
      resolve(false);
    });
    child.on("close", (code) => resolve(code === 0));
  });
}

/** Sends ticket to network raw printer (TCP) or runs PRINT_COMMAND on the PDF. */
async function sendToPrinter(pdfFilePath, order) {
  if (RAW_HOST) {
    const lines = formatTicketLines(order).map((line) => (RAW_ASCII_ONLY ? toWinAnsiSafeText(line) : line));
    const payload = buildEscPosPayload(lines);
    const ok = await sendRawToNetworkPrinter(payload);
    if (ok) console.log(`Raw print OK → ${RAW_HOST}:${RAW_PORT} (${pdfFilePath})`);
    return ok;
  }
  return sendPdfToPrinter(pdfFilePath);
}

async function fetchPending() {
  const qs = new URLSearchParams({ station: STATION, slug: RESTAURANT_SLUG });
  const res = await fetch(`${BASE}/api/print-agent/pending?${qs}`, {
    headers: { "X-Print-Agent-Secret": API_SECRET },
  });
  if (res.status === 401) {
    console.error("Unauthorized — check PRINT_AGENT_API_SECRET and PRINT_AGENT_RESTAURANT_SLUG.");
    return null;
  }
  if (res.status === 503) {
    console.error("Server not configured — set PRINT_AGENT_API_SECRET on the server and redeploy.");
    return null;
  }
  if (!res.ok) {
    console.error("pending HTTP", res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return Array.isArray(data.orders) ? data.orders : [];
}

async function ack(orderId) {
  const qs = new URLSearchParams({ slug: RESTAURANT_SLUG });
  const res = await fetch(`${BASE}/api/print-agent/ack?${qs}`, {
    method: "POST",
    headers: {
      "X-Print-Agent-Secret": API_SECRET,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ orderId, stationKey: STATION }),
  });
  return res.ok;
}

let ticking = false;
let loggedNoOrdersHint = false;

async function tick() {
  if (ticking) return;
  ticking = true;
  try {
    const orders = await fetchPending();
    if (orders == null) return;
    if (orders.length === 0 && !loggedNoOrdersHint) {
      loggedNoOrdersHint = true;
      console.error(
        "Poll OK — no tickets yet. Kitchen only sees orders that are already in the kitchen flow (status not \"pending\"), " +
          "sent to kitchen if waiter relay is on, not yet printed for this station, and with at least one item routed to kitchen/cold kitchen (not bar-only). " +
          "PDFs appear in your folder only when a ticket is printed."
      );
    }
    for (const order of orders) {
      const ticketNumber = await reserveNextTicketNumber();
      const printableOrder = { ...order, ticketNumber };
      const { filePath, fontPath, usingUnicode } = await writeTicketPdf(printableOrder);
      if (!usingUnicode) {
        console.error("Unicode font not found; ticket text may show ? characters.");
      } else if (fontPath) {
        console.error(`PDF font: ${fontPath}`);
      }
      const ok = await sendToPrinter(filePath, printableOrder);
      if (!ok) {
        console.error("Skipping ack for", order.id, "(print failed)");
        continue;
      }
      const acked = await ack(order.id);
      if (!acked) console.error("Ack failed for", order.id, "(will retry next poll)");
    }
  } finally {
    ticking = false;
  }
}

if (SAMPLE_MODE) {
  const mockOrder = {
    id: "clsample0123456789abcdefghij",
    station: STATION,
    stationLabel: STATION_LABELS[STATION],
    restaurantName: "Moustakallis Tavern",
    tableName: "Table 5",
    status: "in_kitchen",
    createdAt: new Date().toISOString(),
    totalAmount: 4590,
    stationTotalAmount: 3200,
    items:
      STATION === "bar"
        ? [
            {
              quantity: 2,
              name: "Aperol Spritz",
              unitPrice: 850,
              notes: "",
              selectedOptionsSummary: "",
              routedStation: "Bar",
            },
          ]
        : [
            {
              quantity: 1,
              name: "Τζατζίκι",
              unitPrice: 450,
              notes: "",
              selectedOptionsSummary: "",
              routedStation: "Cold kitchen",
            },
            {
              quantity: 2,
              name: "Σουβλάκι χοιρινό",
              unitPrice: 1250,
              notes: "No onion",
              selectedOptionsSummary: "Μέγεθος: Large",
              routedStation: "Kitchen",
            },
            {
              quantity: 1,
              name: "Μουσακάς",
              unitPrice: 850,
              notes: "",
              selectedOptionsSummary: "",
              routedStation: "Kitchen",
            },
          ],
  };
  console.error(`Sample ticket (station=${STATION}, 28 columns, SEAT IN layout)\n`);
  console.log(formatTicketLines(mockOrder).join("\n"));
  process.exit(0);
}

console.error(`Print agent polling ${BASE} for ${STATION_LABELS[STATION]} every ${POLL_MS}ms`);
console.error(`PDF output folder: ${PDF_DIR}`);
console.error(`Ticket counter file: ${COUNTER_FILE}`);
if (RAW_HOST) {
  console.error(`Network raw print: ${RAW_HOST}:${RAW_PORT}`);
  if (RAW_ASCII_ONLY) console.error("Raw print: PRINT_AGENT_RAW_ASCII_ONLY — non-Latin chars may become ?");
  if (PRINT_CMD) console.error("PRINT_COMMAND ignored while PRINT_AGENT_RAW_HOST is set.");
} else if (PRINT_CMD) {
  console.error(`Print command enabled: ${PRINT_CMD}`);
  console.error('Use "{file}" placeholder to control argument position.');
} else {
  console.error(
    "PDF-only mode: each ticket is saved under the PDF folder above when the server returns an order (no printer needed)."
  );
}
await tick();
setInterval(tick, POLL_MS);
