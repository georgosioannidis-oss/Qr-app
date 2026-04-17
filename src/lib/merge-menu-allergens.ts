import { parseStoredAllergenCodes, sortAllergenCodes } from "@/lib/allergens";
import { DEMO_MENU_ALLERGENS_BY_NAME } from "@/data/demo-menu-allergens-by-name";

/**
 * Guest menu + dashboard display:
 * - If `allergenCodes` has never been saved on the item (`null` / empty string), use the
 *   printed-menu defaults from `DEMO_MENU_ALLERGENS_BY_NAME` when the dish name matches.
 * - After staff save allergens once, the database value is the only source (so icons can be corrected).
 */
export function resolvedMenuItemAllergenCodes(itemName: string, dbRaw: unknown): string[] {
  const fromDb = parseStoredAllergenCodes(dbRaw);
  const hasSavedAllergenField =
    dbRaw != null && typeof dbRaw === "string" && dbRaw.trim() !== "";
  if (hasSavedAllergenField) {
    return sortAllergenCodes(fromDb);
  }
  return sortAllergenCodes(DEMO_MENU_ALLERGENS_BY_NAME[itemName] ?? []);
}
