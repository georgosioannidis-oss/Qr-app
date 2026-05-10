"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { AllergenIconRow } from "@/components/AllergenIcons";
import type { GuestMenuCategory as Category, GuestMenuItem as Item } from "@/lib/guest-demo-menu-i18n";

type CartItem = Item & {
  quantity: number;
  notes?: string;
  selectedOptions?: Record<string, string | string[]>;
  optionPriceModifier?: number;
  optionSummary?: string;
};

function cartLineKey(c: CartItem) {
  return `${c.id}|${c.notes ?? ""}|${JSON.stringify(c.selectedOptions ?? {})}`;
}

type Props = {
  categories: Category[];
  tableToken: string;
  tableName: string;
  restaurantSlug: string;
  payAtTableCardEnabled: boolean;
  payAtTableCashEnabled: boolean;
  usesOnlineCheckout: boolean;
};

function StaffOptionsModal({
  item,
  onAdd,
  onClose,
  formatPrice,
}: {
  item: Item;
  onAdd: (notes: string, selectedOptions: Record<string, string | string[]>, optionPriceModifier: number, optionSummary?: string) => void;
  onClose: () => void;
  formatPrice: (cents: number) => string;
}) {
  const groups = useMemo(() => {
    const raw = Array.isArray(item.optionGroups) ? item.optionGroups : [];
    const byId = new Map<string, (typeof raw)[number]>();
    for (const g of raw) {
      const existing = byId.get(g.id);
      if (!existing) {
        byId.set(g.id, g);
        continue;
      }
      // Defensive merge for duplicate option-group ids.
      const seen = new Set(existing.choices.map((c) => c.id));
      const mergedChoices = existing.choices.slice();
      for (const choice of g.choices) {
        if (seen.has(choice.id)) continue;
        seen.add(choice.id);
        mergedChoices.push(choice);
      }
      byId.set(g.id, { ...existing, required: existing.required || g.required, choices: mergedChoices });
    }
    return Array.from(byId.values());
  }, [item.optionGroups]);

  const [selections, setSelections] = useState<Record<string, string | string[]>>({});
  const [notes, setNotes] = useState("");

  const optionPriceModifier = groups.reduce((sum, g) => {
    const sel = selections[g.id];
    if (g.type === "single" && typeof sel === "string") {
      return sum + (g.choices.find((c) => c.id === sel)?.priceCents ?? 0);
    }
    if (g.type === "multi" && Array.isArray(sel)) {
      return sum + sel.reduce((s, id) => s + (g.choices.find((c) => c.id === id)?.priceCents ?? 0), 0);
    }
    return sum;
  }, 0);

  const canSubmit = groups.every((g) => {
    const sel = selections[g.id];
    if (g.required) {
      if (g.type === "single") return typeof sel === "string" && sel;
      return Array.isArray(sel) && sel.length > 0;
    }
    return true;
  });

  const optionSummary = groups
    .map((g) => {
      const sel = selections[g.id];
      if (g.type === "single" && typeof sel === "string") return g.choices.find((c) => c.id === sel)?.label;
      if (g.type === "multi" && Array.isArray(sel)) {
        return sel.map((id) => g.choices.find((c) => c.id === id)?.label).filter(Boolean).join(", ");
      }
      return null;
    })
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className="fixed inset-0 z-30 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(90vh,720px)] min-h-0 w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 pr-1">
            <h3 className="text-xl font-bold leading-tight text-ink sm:text-lg">{item.name}</h3>
            {item.allergenCodes?.length ? <AllergenIconRow codes={item.allergenCodes} /> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-full bg-surface text-ink border-2 border-border hover:bg-ink/5 flex items-center justify-center text-lg leading-none font-bold"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) onAdd(notes.trim(), selections, optionPriceModifier, optionSummary);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-3">
            <p className="mb-4 text-base leading-relaxed text-ink-muted sm:text-sm">Choose options</p>
            <div className="space-y-5">
              {groups.map((g, groupIdx) => (
                <div key={`${g.id}-${groupIdx}`} className="pb-4 border-b border-border last:border-0">
                  <p className="text-base font-semibold text-ink mb-2 sm:text-sm">
                    {g.label}
                    {g.required && <span className="text-red-600 ml-0.5">*</span>}
                  </p>
                  {g.type === "single" ? (
                    <div className="space-y-2">
                      {g.choices.map((c, choiceIdx) => (
                        <label
                          key={`${g.id}-${c.id}-${choiceIdx}`}
                          className={`flex min-h-[48px] items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                            selections[g.id] === c.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-ink/20"
                          }`}
                        >
                          <input
                            type="radio"
                            name={g.id}
                            value={c.id}
                            checked={selections[g.id] === c.id}
                            onChange={() => setSelections((prev) => ({ ...prev, [g.id]: c.id }))}
                            className="sr-only"
                          />
                          <span className="flex-1 font-medium text-ink">
                            {c.label}
                            {c.priceCents > 0 && (
                              <span className="text-ink-muted font-normal ml-1">+{formatPrice(c.priceCents)}</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {g.choices.map((c, choiceIdx) => (
                        <label
                          key={`${g.id}-${c.id}-${choiceIdx}`}
                          className={`flex min-h-[48px] items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                            (selections[g.id] as string[] | undefined)?.includes(c.id)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-ink/20"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean((selections[g.id] as string[] | undefined)?.includes(c.id))}
                            onChange={(e) => {
                              const arr = ((selections[g.id] as string[] | undefined) ?? []).filter(
                                (id) => id !== c.id
                              );
                              if (e.target.checked) arr.push(c.id);
                              setSelections((prev) => ({ ...prev, [g.id]: arr }));
                            }}
                            className="h-5 w-5 min-h-[20px] min-w-[20px] shrink-0 rounded border-2 border-primary text-primary"
                          />
                          <span className="flex-1 font-medium text-ink">
                            {c.label}
                            {c.priceCents > 0 && (
                              <span className="text-ink-muted font-normal ml-1">+{formatPrice(c.priceCents)}</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-5">
              <label className="mb-2 block text-base font-semibold text-ink sm:text-sm">
                Kitchen note{" "}
                <span className="font-normal text-ink-muted">(optional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. no onions"
                className="w-full rounded-xl border-2 border-border bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-muted/70 focus:border-primary focus:outline-none sm:text-sm"
                maxLength={300}
              />
            </div>
          </div>
          <div className="shrink-0 border-t border-border bg-card px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] shadow-[0_-6px_16px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-lg font-bold text-ink tabular-nums">
                {formatPrice(item.price + optionPriceModifier)}
              </span>
              <button
                type="submit"
                disabled={!canSubmit}
                className="min-h-[48px] flex-1 rounded-xl bg-primary py-3.5 text-base font-semibold text-white shadow-md ring-1 ring-black/10 transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
              >
                Add to order
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function StaffOrderView({
  categories,
  tableToken,
  tableName,
  restaurantSlug,
  payAtTableCardEnabled,
  payAtTableCashEnabled,
  usesOnlineCheckout,
}: Props) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  const formatPrice = useCallback(
    (cents: number) =>
      new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100),
    []
  );

  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [optionsModalItem, setOptionsModalItem] = useState<Item | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderedItems, setOrderedItems] = useState<CartItem[]>([]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!showSuccess) return;
    const t = window.setTimeout(() => {
      router.push(`/${restaurantSlug}/dashboard/wait-staff`);
    }, 2000);
    return () => window.clearTimeout(t);
  }, [showSuccess, router, restaurantSlug]);

  const allItems = useMemo(
    () => categories.flatMap((c) => c.items.map((item) => ({ item, categoryName: c.name }))),
    [categories]
  );

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q) return allItems.filter(({ item }) => item.name.toLowerCase().includes(q));
    if (activeCategoryId) {
      const cat = categories.find((c) => c.id === activeCategoryId);
      return cat ? cat.items.map((item) => ({ item, categoryName: cat.name })) : [];
    }
    return allItems;
  }, [search, activeCategoryId, allItems, categories]);

  const totalCents = cart.reduce((sum, i) => sum + (i.price + (i.optionPriceModifier ?? 0)) * i.quantity, 0);
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  const addToCart = (
    item: Item,
    notes?: string,
    selectedOptions?: Record<string, string | string[]>,
    optionPriceModifier?: number,
    optionSummary?: string
  ) => {
    const newLine: CartItem = {
      ...item,
      quantity: 1,
      notes,
      selectedOptions,
      optionPriceModifier: optionPriceModifier ?? 0,
      optionSummary,
    };
    setCart((prev) => {
      const key = cartLineKey(newLine);
      const existing = prev.find((c) => cartLineKey(c) === key);
      if (existing) return prev.map((c) => (cartLineKey(c) === key ? { ...c, quantity: c.quantity + 1 } : c));
      return [...prev, newLine];
    });
    setOptionsModalItem(null);
  };

  const updateQuantity = (line: CartItem, delta: number) => {
    setCart((prev) =>
      prev.flatMap((c) => {
        if (cartLineKey(c) !== cartLineKey(line)) return [c];
        const q = c.quantity + delta;
        return q <= 0 ? [] : [{ ...c, quantity: q }];
      })
    );
  };

  const removeFromCart = (line: CartItem) => {
    setCart((prev) => prev.filter((c) => cartLineKey(c) !== cartLineKey(line)));
  };

  const submitOrder = async (paymentPreference?: "card" | "cash") => {
    if (cart.length === 0) return;
    setIsPlacing(true);
    const snapshot = [...cart];
    try {
      const payload: Record<string, unknown> = {
        tableToken,
        items: cart.map((c) => ({
          menuItemId: c.id,
          quantity: c.quantity,
          unitPrice: c.price,
          notes: c.notes ?? undefined,
          selectedOptions: c.selectedOptions ?? undefined,
          optionPriceModifier: c.optionPriceModifier ?? 0,
        })),
        totalAmount: totalCents,
        isStaffOrder: true,
        ...(paymentPreference ? { paymentPreference } : {}),
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data: { error?: string } = {};
      try {
        if (text) data = JSON.parse(text);
      } catch {
        if (!res.ok) throw new Error("Invalid response from server");
      }
      if (!res.ok) throw new Error(data.error ?? "Failed to place order");
      setOrderedItems(snapshot);
      setCart([]);
      setCartOpen(false);
      setPaymentModalOpen(false);
      setShowSuccess(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to place order. Try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    if (usesOnlineCheckout) { void submitOrder(); return; }
    if (payAtTableCardEnabled && payAtTableCashEnabled) { setPaymentModalOpen(true); return; }
    if (payAtTableCardEnabled) void submitOrder("card");
    else void submitOrder("cash");
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface">
        <div className="max-w-sm w-full bg-card rounded-3xl shadow-lg border border-border p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl mx-auto mb-4 ring-1 ring-green-200">
            ✓
          </div>
          <h2 className="text-xl font-bold text-ink mb-1">Order sent</h2>
          <p className="text-sm text-ink-muted mb-6">Table {tableName}</p>
          <ul className="text-left text-sm space-y-2 mb-6 border border-border rounded-xl p-4 bg-surface">
            {orderedItems.map((line) => (
              <li key={cartLineKey(line)} className="flex justify-between gap-2">
                <span className="text-ink font-medium">
                  {line.name}
                  {line.optionSummary && (
                    <span className="text-ink-muted font-normal"> · {line.optionSummary}</span>
                  )}
                  {" "}× {line.quantity}
                </span>
                <span className="tabular-nums shrink-0 text-ink">
                  {formatPrice((line.price + (line.optionPriceModifier ?? 0)) * line.quantity)}
                </span>
              </li>
            ))}
            <li className="flex justify-between gap-2 pt-2 border-t border-border font-bold text-ink">
              <span>Total</span>
              <span className="tabular-nums">
                {formatPrice(orderedItems.reduce((s, l) => s + (l.price + (l.optionPriceModifier ?? 0)) * l.quantity, 0))}
              </span>
            </li>
          </ul>
          <p className="text-xs text-ink-muted mb-4">Returning to tables in a moment…</p>
          <button
            type="button"
            onClick={() => router.push(`/${restaurantSlug}/dashboard/wait-staff`)}
            className="min-h-[48px] w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold shadow-sm ring-1 ring-black/10"
          >
            Back to tables
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          type="button"
          onClick={() => router.push(`/${restaurantSlug}/dashboard/wait-staff`)}
          className="min-h-[44px] min-w-[44px] rounded-full hover:bg-ink/5 flex items-center justify-center text-ink text-xl"
          aria-label="Back to tables"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[0.7rem] text-ink-muted leading-none uppercase tracking-wide">Taking order for</p>
          <p className="text-base font-bold text-ink truncate">{tableName}</p>
        </div>
        {totalItems > 0 && (
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-white shadow-sm"
          >
            <span className="min-w-[1.1rem] text-center">{totalItems}</span>
            <span className="tabular-nums">{formatPrice(totalCents)}</span>
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="px-4 pt-3 pb-2 bg-card border-b border-border">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </span>
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setActiveCategoryId(null); }}
            placeholder="Search items…"
            className="w-full rounded-xl border-2 border-border bg-surface pl-9 pr-8 py-2.5 text-base text-ink placeholder:text-ink-muted/70 focus:border-primary focus:outline-none sm:text-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); searchRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink font-bold text-sm"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category chips */}
      <div className="bg-card border-b border-border">
        <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-none" style={{ scrollbarWidth: "none" }}>
          <button
            type="button"
            onClick={() => { setActiveCategoryId(null); setSearch(""); }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium border-2 transition-colors ${
              !activeCategoryId && !search
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-ink-muted hover:border-ink/20 hover:text-ink"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { setActiveCategoryId(c.id); setSearch(""); }}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium border-2 transition-colors whitespace-nowrap ${
                activeCategoryId === c.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-ink-muted hover:border-ink/20 hover:text-ink"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: totalItems > 0 ? "5rem" : "1rem" }}>
        {visibleItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <p className="text-ink-muted text-sm">No items found</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {visibleItems.map(({ item, categoryName }) => {
              const cartQty = cart.filter((c) => c.id === item.id).reduce((s, c) => s + c.quantity, 0);
              const hasOptions = Array.isArray(item.optionGroups) && item.optionGroups.length > 0;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (hasOptions) setOptionsModalItem(item);
                      else addToCart(item);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-ink/[0.03] active:bg-ink/[0.06] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink text-[0.9375rem] leading-snug">{item.name}</p>
                      {(search || !activeCategoryId) && (
                        <p className="text-xs text-ink-muted/70 mt-0.5">{categoryName}</p>
                      )}
                      {hasOptions && (
                        <p className="text-[0.7rem] text-ink-muted/60 mt-0.5">• options available</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {cartQty > 0 && (
                        <span className="min-w-[1.25rem] h-5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center px-1.5 tabular-nums">
                          {cartQty}
                        </span>
                      )}
                      <span className="tabular-nums text-sm font-semibold text-ink">{formatPrice(item.price)}</span>
                      <span className="text-ink-muted/50 text-base font-bold select-none">+</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Options modal */}
      {optionsModalItem && (
        <StaffOptionsModal
          item={optionsModalItem}
          onAdd={(notes, selectedOptions, optionPriceModifier, optionSummary) =>
            addToCart(optionsModalItem, notes, selectedOptions, optionPriceModifier, optionSummary)
          }
          onClose={() => setOptionsModalItem(null)}
          formatPrice={formatPrice}
        />
      )}

      {/* Payment modal */}
      {paymentModalOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setPaymentModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-card rounded-t-3xl sm:rounded-2xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-ink mb-1">Payment method</h3>
            <p className="text-sm text-ink-muted mb-5">
              Total: <span className="font-semibold text-ink">{formatPrice(totalCents)}</span>
            </p>
            <div className="space-y-3">
              {payAtTableCardEnabled && (
                <button
                  type="button"
                  onClick={() => { void submitOrder("card"); }}
                  disabled={isPlacing}
                  className="w-full min-h-[52px] rounded-xl border-2 border-border bg-surface px-4 py-3 text-left font-semibold text-ink hover:border-primary hover:bg-primary/5 disabled:opacity-60 transition-colors"
                >
                  Card at table
                </button>
              )}
              {payAtTableCashEnabled && (
                <button
                  type="button"
                  onClick={() => { void submitOrder("cash"); }}
                  disabled={isPlacing}
                  className="w-full min-h-[52px] rounded-xl border-2 border-border bg-surface px-4 py-3 text-left font-semibold text-ink hover:border-primary hover:bg-primary/5 disabled:opacity-60 transition-colors"
                >
                  Cash
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-[35] flex items-end justify-center bg-black/50"
          onClick={() => setCartOpen(false)}
        >
          <div
            className="w-full max-w-lg max-h-[88vh] overflow-auto rounded-t-3xl bg-card shadow-2xl p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[1.35rem] font-bold leading-tight text-ink">Order — {tableName}</h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="min-h-[44px] min-w-[44px] rounded-full bg-surface text-ink border-2 border-border hover:bg-ink/5 flex items-center justify-center text-lg leading-none font-bold"
                aria-label="Close cart"
              >
                ✕
              </button>
            </div>
            {cart.length === 0 ? (
              <p className="mb-6 rounded-xl border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-ink-muted">
                Cart is empty
              </p>
            ) : (
              <ul className="mb-5 space-y-2">
                {cart.map((line) => (
                  <li
                    key={cartLineKey(line)}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink text-sm leading-snug">{line.name}</p>
                      {line.optionSummary && (
                        <p className="text-xs text-ink-muted mt-0.5">{line.optionSummary}</p>
                      )}
                      {line.notes && (
                        <p className="text-xs text-ink-muted/60 mt-0.5 italic">{line.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(line, -1)}
                        className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center text-ink font-bold text-base hover:bg-ink/5"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-bold tabular-nums text-ink">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(line, 1)}
                        className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center text-ink font-bold text-base hover:bg-ink/5"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                      <span className="ml-1 text-sm font-semibold tabular-nums text-ink w-16 text-right">
                        {formatPrice((line.price + (line.optionPriceModifier ?? 0)) * line.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(line)}
                        className="ml-1 w-7 h-7 rounded-full border-2 border-red-300 text-red-500 flex items-center justify-center text-xs font-bold hover:bg-red-50"
                        aria-label={`Remove ${line.name}`}
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-medium text-ink-muted">Total</span>
              <span className="text-xl font-bold tabular-nums text-ink">{formatPrice(totalCents)}</span>
            </div>
            <button
              type="button"
              onClick={() => { setCartOpen(false); handlePlaceOrder(); }}
              disabled={isPlacing || cart.length === 0}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-semibold text-white shadow-lg ring-1 ring-black/10 transition-all hover:bg-primary-hover disabled:opacity-60"
            >
              {isPlacing ? (
                <>
                  <Spinner className="h-5 w-5 border-white border-t-transparent" label="Placing order…" />
                  Placing order…
                </>
              ) : (
                "Place order"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Cart strip */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[25] border-t border-border bg-card pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="max-w-lg mx-auto flex items-center gap-2 px-4 py-3">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="flex-1 flex items-center justify-between rounded-xl bg-surface border-2 border-border px-4 py-2 hover:bg-ink/[0.03] transition-colors"
            >
              <span className="text-sm text-ink-muted">
                {totalItems} item{totalItems !== 1 ? "s" : ""}
              </span>
              <span className="text-base font-bold tabular-nums text-ink">{formatPrice(totalCents)}</span>
            </button>
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isPlacing}
              className="shrink-0 min-h-[44px] rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white shadow-md ring-1 ring-black/10 hover:bg-primary-hover disabled:opacity-60 transition-colors"
            >
              {isPlacing ? "…" : "Order"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
