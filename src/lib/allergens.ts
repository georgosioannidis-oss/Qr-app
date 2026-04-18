/**
 * Allergen & dietary codes for menu items (EU-style + common restaurant extras).
 * Stored on `MenuItem.allergenCodes` as JSON: `["gluten","milk",…]`.
 */

export const ALLERGEN_DEFS = [
  { code: "gluten", label: "Gluten" },
  { code: "crustaceans", label: "Crustaceans" },
  { code: "eggs", label: "Eggs" },
  { code: "fish", label: "Fish" },
  { code: "peanuts", label: "Peanuts" },
  { code: "soy", label: "Soy" },
  { code: "milk", label: "Milk" },
  { code: "nuts", label: "Nuts" },
  { code: "celery", label: "Celery" },
  { code: "mustard", label: "Mustard" },
  { code: "sesame", label: "Sesame" },
  { code: "lupin", label: "Lupin" },
  { code: "molluscs", label: "Molluscs" },
  { code: "alcohol", label: "Alcohol" },
  { code: "mushroom", label: "Mushroom" },
] as const;

export type AllergenCode = (typeof ALLERGEN_DEFS)[number]["code"];

const ALLOWED = new Set<string>(ALLERGEN_DEFS.map((d) => d.code));

const ORDER = new Map<string, number>(ALLERGEN_DEFS.map((d, i) => [d.code, i]));

export function allergenLabel(code: string): string {
  const d = ALLERGEN_DEFS.find((x) => x.code === code);
  return d?.label ?? code;
}

export function sortAllergenCodes(codes: string[]): string[] {
  return [...codes].sort((a, b) => (ORDER.get(a) ?? 999) - (ORDER.get(b) ?? 999));
}

/** Parse DB JSON / unknown into a sorted list of known codes only. */
export function parseStoredAllergenCodes(raw: unknown): string[] {
  if (raw == null || raw === "") return [];
  let v: unknown = raw;
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(v)) return [];
  // Legacy: sulphites markers use the alcohol icon / code only.
  const mapped = v.map((x) => {
    const c = String(x);
    return c === "sulphites" ? "alcohol" : c;
  });
  const uniq = [...new Set(mapped.filter((c) => ALLOWED.has(c)))];
  return sortAllergenCodes(uniq);
}

/** Normalize API body input to JSON for Prisma (or null if empty). */
export function normalizeAllergenCodesForSave(input: unknown): string | null {
  if (input == null) return null;
  if (!Array.isArray(input)) return null;
  const parsed = parseStoredAllergenCodes(input);
  return parsed.length > 0 ? JSON.stringify(parsed) : null;
}
