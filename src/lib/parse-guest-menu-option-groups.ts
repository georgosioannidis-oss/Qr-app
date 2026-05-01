export function parseGuestMenuOptionGroups(raw: unknown):
  | {
      id: string;
      label: string;
      required: boolean;
      type: "single" | "multi";
      choices: { id: string; label: string; priceCents: number }[];
    }[]
  | undefined {
  if (raw == null) return undefined;
  let v: unknown = raw;
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      return undefined;
    }
  }
  if (!Array.isArray(v) || v.length === 0) return undefined;
  const out: NonNullable<ReturnType<typeof parseGuestMenuOptionGroups>> = [];
  for (const entry of v) {
    if (!entry || typeof entry !== "object") continue;
    const g = entry as Record<string, unknown>;
    const id = typeof g.id === "string" ? g.id : "";
    const label = typeof g.label === "string" ? g.label : "";
    if (!id || !label) continue;
    const required = g.required === true;
    const type: "single" | "multi" = g.type === "multi" ? "multi" : "single";
    const choicesRaw = g.choices;
    if (!Array.isArray(choicesRaw)) continue;
    const choices: { id: string; label: string; priceCents: number }[] = [];
    for (const c of choicesRaw) {
      if (!c || typeof c !== "object") continue;
      const ch = c as Record<string, unknown>;
      const cid = typeof ch.id === "string" ? ch.id : "";
      const cl = typeof ch.label === "string" ? ch.label : "";
      if (!cid || !cl) continue;
      const priceCents =
        typeof ch.priceCents === "number" && Number.isFinite(ch.priceCents)
          ? Math.round(ch.priceCents)
          : 0;
      choices.push({ id: cid, label: cl, priceCents });
    }
    if (choices.length === 0) continue;
    out.push({ id, label, required, type, choices });
  }
  return out.length > 0 ? out : undefined;
}
