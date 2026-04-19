/**
 * Emoji prefix for guest `/m/[token]` category tabs and section titles.
 * Keys: Greek names (DB) and English names from `demo-guest-menu-en.json` (trimmed).
 */
const GUEST_CATEGORY_EMOJI: Record<string, string> = {
  "Κρύα ορεκτικά": "🧊",
  "Cold appetizers": "🧊",
  "Ζεστά ορεκτικά": "🔥",
  "Hot Starters": "🔥",
  "Σαλάτες": "🥗",
  Salads: "🥗",
  "Κουζίνα για χορτοφάγους": "🥬",
  Vegetarian: "🥬",
  "Ψάρια και θαλασσινά": "🐟",
  "Fish and seafood": "🐟",
  "Κυπριακά παραδοσιακά": "🍲",
  "Cypriot traditional": "🍲",
  Φιλέτα: "🥩",
  Fillets: "🥩",
  "Στη σχάρα": "🍖",
  "On the grill": "🍖",
  Μακαρονάδες: "🍝",
  Spaghetti: "🍝",
  Πίτσες: "🍕",
  Pizzas: "🍕",
  "Παιδικό μενού": "🧒",
  "Kids’ Menu": "🧒",
  "Kids' Menu": "🧒",
  Κοκτέιλ: "🍹",
  Cocktails: "🍹",
  "Gin Clock": "🍸",
  "Απεριτίφ & λικέρ": "🥂",
  "Aperitif & Liqueur": "🥂",
  "Μπύρες & σίδερ": "🍺",
  "Beers & cider": "🍺",
  Οινοπνευματώδη: "🥃",
  Spirits: "🥃",
  Αναψυκτικά: "🥤",
  Refreshments: "🥤",
  "Λευκά κρασιά": "🥂",
  White: "🥂",
  "Κόκκινα κρασιά": "🍷",
  "Red Wines": "🍷",
  "Ημίξηρα & ημίγλυκα κρασιά": "🔶",
  "Semi dry & semi sweet wines": "🔶",
  "Ροζέ κρασιά": "🌷",
  "Rosé wines": "🌷",
  "Σαμπάνιες & αφρώδη κρασιά": "🍾",
  "Champagnes & sparkling wines": "🍾",
  "Κρασί του σπιτιού": "🏡",
  "Home wine": "🏡",
  Επιδόρπια: "🍰",
  Desserts: "🍰",
  Παγωτά: "🍨",
  "Ice-Cream": "🍨",
  "Καφέδες & ζεστά ροφήματα": "☕",
  "Coffees & hot drinks": "☕",
  "Κρύοι καφέδες": "🧊",
  "Cold coffees": "🧊",
  "Ειδικοί καφέδες": "✨",
  "Specialty coffees": "✨",
};

export function guestCategoryEmoji(categoryDisplayName: string): string {
  const key = categoryDisplayName.trim();
  return GUEST_CATEGORY_EMOJI[key] ?? "";
}

/** Prefix "🍕 " when an emoji exists, else unchanged label. */
export function guestCategoryLabelWithEmoji(categoryDisplayName: string): string {
  const e = guestCategoryEmoji(categoryDisplayName);
  return e ? `${e} ${categoryDisplayName}` : categoryDisplayName;
}
