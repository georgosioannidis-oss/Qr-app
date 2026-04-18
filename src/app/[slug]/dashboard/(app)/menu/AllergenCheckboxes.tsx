"use client";

import { ALLERGEN_DEFS, sortAllergenCodes } from "@/lib/allergens";

export function AllergenCheckboxes({
  value,
  onChange,
  labelClass,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  labelClass: string;
}) {
  const toggle = (code: string) => {
    if (value.includes(code)) onChange(value.filter((c) => c !== code));
    else onChange(sortAllergenCodes([...value, code]));
  };

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <p className={labelClass}>Allergens &amp; dietary</p>
      <p className="mt-1 text-xs text-ink-muted">
        Shown as small icons next to the dish name on the guest menu. Always confirm with staff if a guest has an allergy.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ALLERGEN_DEFS.map((d) => (
          <label
            key={d.code}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 bg-card px-2.5 py-2 text-xs font-medium text-ink shadow-sm transition hover:border-primary/35"
          >
            <input
              type="checkbox"
              checked={value.includes(d.code)}
              onChange={() => toggle(d.code)}
              className="h-3.5 w-3.5 shrink-0 rounded border-border text-primary focus:ring-primary/30"
            />
            <span className="leading-snug">{d.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
