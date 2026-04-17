/**
 * Raster allergen icons (restaurant-provided PNGs) under `/public/allergens/*.png`.
 * Codes without a file fall back to inline SVG in `AllergenIcons.tsx`.
 */
const PHOTO_CODES = new Set([
  "alcohol",
  "celery",
  "crustaceans",
  "eggs",
  "fish",
  "gluten",
  "milk",
  "molluscs",
  "mustard",
  "peanuts",
  "sesame",
  "soy",
  "sulphites",
]);

export function allergenHasPhotoAsset(code: string): boolean {
  return PHOTO_CODES.has(code);
}

export function allergenPhotoSrc(code: string): string | null {
  return allergenHasPhotoAsset(code) ? `/allergens/${code}.png` : null;
}
