export const SUPPORTED_LOCALES = [
  { code: "el", name: "Greek",   nativeName: "Ελληνικά", flag: "🇬🇷", googleCode: "el" },
  { code: "en", name: "English", nativeName: "English",  flag: "🇬🇧", googleCode: "en" },
  { code: "sr", name: "Serbian", nativeName: "Srpski",   flag: "🇷🇸", googleCode: "sr" },
  { code: "ru", name: "Russian", nativeName: "Русский",  flag: "🇷🇺", googleCode: "ru" },
  { code: "fr", name: "French",  nativeName: "Français", flag: "🇫🇷", googleCode: "fr" },
  { code: "pl", name: "Polish",  nativeName: "Polski",   flag: "🇵🇱", googleCode: "pl" },
  { code: "de", name: "German",  nativeName: "Deutsch",  flag: "🇩🇪", googleCode: "de" },
  { code: "es", name: "Spanish", nativeName: "Español",  flag: "🇪🇸", googleCode: "es" },
  { code: "zh", name: "Chinese", nativeName: "中文",     flag: "🇨🇳", googleCode: "zh-CN" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe",   flag: "🇹🇷", googleCode: "tr" },
] as const;

export type SupportedLocale = typeof SUPPORTED_LOCALES[number]["code"];

export function getLocaleInfo(code: string) {
  return SUPPORTED_LOCALES.find((l) => l.code === code);
}

export function parseEnabledLocales(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid = new Set(SUPPORTED_LOCALES.map((l) => l.code));
    return parsed.filter((c): c is string => typeof c === "string" && valid.has(c as SupportedLocale));
  } catch {
    return [];
  }
}
