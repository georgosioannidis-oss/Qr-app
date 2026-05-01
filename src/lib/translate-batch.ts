import { SUPPORTED_LOCALES } from "@/lib/locale-config";

/** Google Cloud Translation API v2 ("Basic"). Set GOOGLE_TRANSLATE_API_KEY for live translation. */
async function translateViaGoogle(texts: string[], source: string, target: string): Promise<string[] | null> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY?.trim();
  if (!key) return null;

  const srcLocale = SUPPORTED_LOCALES.find((l) => l.code === source);
  const tgtLocale = SUPPORTED_LOCALES.find((l) => l.code === target);
  const srcCode = srcLocale?.googleCode ?? source;
  const tgtCode = tgtLocale?.googleCode ?? target;

  try {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: texts, source: srcCode, target: tgtCode, format: "text" }),
        signal: AbortSignal.timeout(20000),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      data?: { translations?: { translatedText: string }[] };
    };
    const translations = data.data?.translations;
    if (!Array.isArray(translations) || translations.length !== texts.length) return null;
    return translations.map((t) => t.translatedText ?? "");
  } catch {
    return null;
  }
}

/** LibreTranslate fallback. Set LIBRETRANSLATE_URL (e.g. https://libretranslate.com). */
async function translateViaLibreTranslate(texts: string[], source: string, target: string): Promise<string[] | null> {
  const base = process.env.LIBRETRANSLATE_URL?.replace(/\/$/, "");
  if (!base) return null;

  const out: string[] = [];
  for (const q of texts) {
    if (!q.trim()) { out.push(q); continue; }
    try {
      const res = await fetch(`${base}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q, source, target, format: "text" }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { translatedText?: string };
      out.push(data.translatedText ?? q);
    } catch {
      return null;
    }
  }
  return out;
}

/**
 * Translate an array of strings from source to target locale.
 * Tries Google Translate first (GOOGLE_TRANSLATE_API_KEY), then LibreTranslate (LIBRETRANSLATE_URL).
 * Returns originals if both are unavailable or fail.
 */
export async function translateTexts(texts: string[], source: string, target: string): Promise<string[]> {
  if (source === target || texts.length === 0) return texts;

  const nonEmpty = texts.map((t) => (t ?? "").trim());

  const google = await translateViaGoogle(nonEmpty, source, target);
  if (google) return google;

  const libre = await translateViaLibreTranslate(nonEmpty, source, target);
  if (libre) return libre;

  return texts;
}
