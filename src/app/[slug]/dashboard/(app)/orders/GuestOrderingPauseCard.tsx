"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

type SectionRow = { id: string; name: string; paused: boolean };
type TableRow = {
  id: string;
  name: string;
  paused: boolean;
  sectionId: string | null;
  sectionName: string | null;
};

type PausePayload = {
  paused?: boolean;
  sections?: SectionRow[];
  tables?: TableRow[];
};

/**
 * Orders dashboard: pause new orders from guest QR menus — whole venue, by table section, or per table.
 */
export function GuestOrderingPauseCard() {
  const [restaurantPaused, setRestaurantPaused] = useState<boolean | null>(null);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRestaurant, setSavingRestaurant] = useState(false);
  const [patchingKey, setPatchingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/restaurant/guest-ordering-pause");
      if (!res.ok) throw new Error("Could not load");
      const data = (await res.json()) as PausePayload;
      setRestaurantPaused(data.paused === true);
      setSections(Array.isArray(data.sections) ? data.sections : []);
      setTables(Array.isArray(data.tables) ? data.tables : []);
    } catch {
      setRestaurantPaused(null);
      setSections([]);
      setTables([]);
      toast.error("Could not load QR ordering status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedTables = useMemo(() => {
    return [...tables].sort((a, b) => {
      const aUn = a.sectionName == null ? 1 : 0;
      const bUn = b.sectionName == null ? 1 : 0;
      if (aUn !== bUn) return aUn - bUn;
      const an = (a.sectionName ?? "").toLowerCase();
      const bn = (b.sectionName ?? "").toLowerCase();
      if (an !== bn) return an.localeCompare(bn);
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  }, [tables]);

  const toggleRestaurant = async (next: boolean) => {
    setSavingRestaurant(true);
    try {
      const res = await fetch("/api/dashboard/restaurant/guest-ordering-pause", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused: next }),
      });
      if (!res.ok) {
        const t = await res.text();
        let msg = "Could not update";
        try {
          const d = JSON.parse(t) as { error?: string };
          if (typeof d.error === "string") msg = d.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      const data = (await res.json()) as { paused?: boolean };
      setRestaurantPaused(data.paused === true);
      toast.success(
        data.paused ? "Whole venue: guest menus paused — no new QR orders." : "Whole venue: guest menus accepting orders again."
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    } finally {
      setSavingRestaurant(false);
    }
  };

  const patchSection = async (id: string, next: boolean) => {
    setPatchingKey(`section:${id}`);
    try {
      const res = await fetch("/api/dashboard/restaurant/guest-ordering-pause", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId: id, paused: next }),
      });
      if (!res.ok) {
        const t = await res.text();
        let msg = "Could not update section";
        try {
          const d = JSON.parse(t) as { error?: string };
          if (typeof d.error === "string") msg = d.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      await load();
      toast.success(next ? "Section paused for guest ordering." : "Section resumed for guest ordering.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    } finally {
      setPatchingKey(null);
    }
  };

  const patchTable = async (id: string, next: boolean) => {
    setPatchingKey(`table:${id}`);
    try {
      const res = await fetch("/api/dashboard/restaurant/guest-ordering-pause", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: id, paused: next }),
      });
      if (!res.ok) {
        const t = await res.text();
        let msg = "Could not update table";
        try {
          const d = JSON.parse(t) as { error?: string };
          if (typeof d.error === "string") msg = d.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      await load();
      toast.success(next ? "Table paused for guest ordering." : "Table resumed for guest ordering.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    } finally {
      setPatchingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="mb-6 flex items-center gap-2 rounded-2xl border border-border bg-card/80 px-4 py-4 text-sm text-ink-muted">
        <Spinner className="h-4 w-4 border-primary border-t-transparent" />
        Loading ordering controls…
      </div>
    );
  }

  if (restaurantPaused === null) {
    return null;
  }

  const rowBtn =
    "inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50";

  return (
    <div className="mb-6 space-y-4">
      <div
        className={`rounded-2xl border px-4 py-4 shadow-sm ${
          restaurantPaused
            ? "border-amber-400/60 bg-amber-500/10 group-data-[theme=dark]/dashboard:border-amber-500/45 group-data-[theme=dark]/dashboard:bg-amber-500/15"
            : "border-border bg-card/80"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-semibold text-ink">Guest QR ordering — whole venue</p>
            <p className="mt-1 text-sm text-ink-muted leading-relaxed">
              {restaurantPaused
                ? "Every table’s QR menu shows “not taking orders.” Use section or single-table pauses below when you only need part of the floor."
                : "Pauses all tables at once. For one room (e.g. dining) or one table only, use the controls below instead."}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            {restaurantPaused ? (
              <button
                type="button"
                disabled={savingRestaurant}
                onClick={() => void toggleRestaurant(false)}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
              >
                {savingRestaurant ? <Spinner className="h-4 w-4 border-white border-t-transparent" /> : null}
                Resume all guest orders
              </button>
            ) : (
              <button
                type="button"
                disabled={savingRestaurant}
                onClick={() => void toggleRestaurant(true)}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-amber-500/70 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-950 shadow-sm hover:bg-amber-100 disabled:opacity-50"
              >
                {savingRestaurant ? <Spinner className="h-4 w-4 border-amber-900 border-t-transparent" /> : null}
                Pause new QR orders (everywhere)
              </button>
            )}
          </div>
        </div>
      </div>

      <details className="rounded-2xl border border-border bg-card/80 px-4 py-3 shadow-sm">
        <summary className="cursor-pointer list-none font-semibold text-ink select-none [&::-webkit-details-marker]:hidden">
          <span className="underline-offset-2 hover:underline">Pause by table area (section)</span>
        </summary>
        <p className="mt-2 text-sm text-ink-muted leading-relaxed">
          Pauses QR ordering for every table in that area. Sections are the groups you set up under{" "}
          <strong className="text-ink">Tables</strong> (e.g. dining room, terrace).
        </p>
        {sections.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">No table sections yet. Add them under Tables to use area pauses.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {sections.map((s) => {
              const busy = patchingKey === `section:${s.id}`;
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0">
                  <span className="min-w-0 font-medium text-ink">{s.name}</span>
                  {s.paused ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void patchSection(s.id, false)}
                      className={`${rowBtn} bg-primary text-white`}
                    >
                      {busy ? <Spinner className="h-3.5 w-3.5 border-white border-t-transparent" /> : "Resume section"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void patchSection(s.id, true)}
                      className={`${rowBtn} border border-amber-600/50 bg-amber-50 text-amber-950 hover:bg-amber-100`}
                    >
                      {busy ? <Spinner className="h-3.5 w-3.5 border-amber-900 border-t-transparent" /> : "Pause section"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </details>

      <details className="rounded-2xl border border-border bg-card/80 px-4 py-3 shadow-sm">
        <summary className="cursor-pointer list-none font-semibold text-ink select-none [&::-webkit-details-marker]:hidden">
          <span className="underline-offset-2 hover:underline">Pause single tables</span>
        </summary>
        <p className="mt-2 text-sm text-ink-muted leading-relaxed">
          Pauses only that table’s QR link. Guests still see the menu but cannot check out until you resume.
        </p>
        {sortedTables.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">No tables yet.</p>
        ) : (
          <ul className="mt-3 max-h-72 divide-y divide-border overflow-y-auto overscroll-contain">
            {sortedTables.map((t) => {
              const busy = patchingKey === `table:${t.id}`;
              const area = t.sectionName ?? "Unassigned";
              return (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0">
                  <div className="min-w-0">
                    <span className="font-medium text-ink">{t.name}</span>
                    <span className="ml-2 text-xs text-ink-muted">({area})</span>
                  </div>
                  {t.paused ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void patchTable(t.id, false)}
                      className={`${rowBtn} bg-primary text-white`}
                    >
                      {busy ? <Spinner className="h-3.5 w-3.5 border-white border-t-transparent" /> : "Resume"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void patchTable(t.id, true)}
                      className={`${rowBtn} border border-amber-600/50 bg-amber-50 text-amber-950 hover:bg-amber-100`}
                    >
                      {busy ? <Spinner className="h-3.5 w-3.5 border-amber-900 border-t-transparent" /> : "Pause table"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </details>
    </div>
  );
}
