/**
 * Raster allergen marks shipped under `/public/allergens/{code}.png`.
 * When a file exists for a code, `AllergenIconRow` shows that image; otherwise it falls back to inline SVG.
 */

const PHOTO_CODES = new Set<string>([
  "gluten",
  "crustaceans",
  "eggs",
  "fish",
  "peanuts",
  "soy",
  "milk",
  "nuts",
  "celery",
  "mustard",
  "sesame",
  "lupin",
  "molluscs",
  "alcohol",
]);

export function allergenHasPhotoAsset(code: string): boolean {
  return PHOTO_CODES.has(code);
}

export function allergenPhotoSrc(code: string): string | null {
  return PHOTO_CODES.has(code) ? `/allergens/${code}.png` : null;
}
