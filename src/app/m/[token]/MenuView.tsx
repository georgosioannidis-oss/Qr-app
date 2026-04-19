"use client";

/**
 * Guest menu UI: category tabs, item cards, cart drawer, optional modifiers, Stripe checkout redirect.
 * Data comes from the server page (`page.tsx`); this file only handles interaction state and API calls.
 */

import { useState, useEffect, useRef, useCallback, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { AllergenIconRow } from "@/components/AllergenIcons";
import { confirmDestructiveAction } from "@/lib/confirm-destructive";
import { createGuestSessionId } from "@/lib/guest-session-id";
import {
  guestOptionSummaryFromSelection,
  isGuestMenuBilingualSlug,
  localizeGuestMenuCategories,
  type GuestMenuCategory as Category,
  type GuestMenuItem as Item,
} from "@/lib/guest-demo-menu-i18n";
import { guestCategoryLabelWithEmoji } from "@/lib/guest-category-emoji";
import { getGuestMenuUiStrings, type GuestMenuLang, type GuestMenuUiStrings } from "@/lib/guest-menu-ui-strings";

const GUEST_MENU_LANG_KEY = "guestMenuDemoLang";

function findGuestItemById(categories: Category[], id: string): Item | undefined {
  for (const c of categories) {
    const hit = c.items.find((i) => i.id === id);
    if (hit) return hit;
  }
  return undefined;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

/** Simple credit-card glyph for the pay-at-table modal */
function PaymentCardGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="5" y="11" width="38" height="26" rx="4" stroke="currentColor" strokeWidth="2.2" />
      <path d="M5 19h38" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="10" y="27" width="14" height="4" rx="1.5" fill="currentColor" opacity="0.35" />
      <rect x="28" y="27" width="10" height="4" rx="1.5" fill="currentColor" opacity="0.2" />
    </svg>
  );
}

/** Bill / banknote glyph for cash — single note (no stacked “ghost” shape) */
function PaymentCashGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="7" y="13" width="34" height="22" rx="3" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="24" cy="24" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="24" cy="24" r="2.5" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

/** Bell — “call waiter” floating action */
function WaiterBellGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

type CartItem = Item & {
  quantity: number;
  notes?: string;
  selectedOptions?: Record<string, string | string[]>;
  optionPriceModifier?: number;
  optionSummary?: string; // e.g. "Medium, Extra cheese" for display
};

function cartLineKey(c: CartItem) {
  return `${c.id}|${c.notes ?? ""}|${JSON.stringify(c.selectedOptions ?? {})}`;
}

function itemHasOptionGroups(item: Item): boolean {
  return Array.isArray(item.optionGroups) && item.optionGroups.length > 0;
}

/** If true, guest must open the options modal (required choices). */
function itemHasRequiredOptionGroup(item: Item): boolean {
  const g = item.optionGroups;
  return Array.isArray(g) && g.some((og) => Boolean(og?.required));
}

type TableOrderSummary = {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  itemCount: number;
  /** True when staff must still send this order to the kitchen (wait-staff relay). */
  waiterRelayPending?: boolean;
};

function formatOrderWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

type Props = {
  restaurantName: string;
  tableName: string;
  tableToken: string;
  tableLogoUrl?: string;
  paidSuccess?: boolean;
  usesOnlineCheckout?: boolean;
  payAtTableCardEnabled?: boolean;
  payAtTableCashEnabled?: boolean;
  /** Kitchen overload: block new guest orders from this QR link (staff flow unchanged). */
  guestOrderingPaused?: boolean;
  categories: Category[];
  /** When `demo-restaurant` or `moustakallis`, guest can switch EL/EN for menu + UI. */
  restaurantSlug?: string | null;
};

export function MenuView({
  restaurantName,
  tableName,
  tableToken,
  tableLogoUrl,
  paidSuccess = false,
  usesOnlineCheckout = false,
  payAtTableCardEnabled = true,
  payAtTableCashEnabled = true,
  guestOrderingPaused = false,
  categories,
  restaurantSlug = null,
}: Props) {
  const formatPrice = useCallback(
    (cents: number) =>
      new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100),
    []
  );

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [isPlacing, setIsPlacing] = useState(false);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [showPaidSuccess, setShowPaidSuccess] = useState(paidSuccess);
  const [showPostOrderThankYou, setShowPostOrderThankYou] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false);
  const [orderHistory, setOrderHistory] = useState<TableOrderSummary[] | null>(null);
  const [orderHistoryLoading, setOrderHistoryLoading] = useState(false);
  const [orderHistoryError, setOrderHistoryError] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [optionsModalItem, setOptionsModalItem] = useState<Item | null>(null);
  const [imagePreviewItem, setImagePreviewItem] = useState<Item | null>(null);
  const router = useRouter();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [menuSearch, setMenuSearch] = useState("");
  const [searchMenuOpen, setSearchMenuOpen] = useState(false);
  const [allergenInfoOpen, setAllergenInfoOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [flashItemId, setFlashItemId] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const pullStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [callWaiterBusy, setCallWaiterBusy] = useState(false);

  const bilingual = useMemo(() => isGuestMenuBilingualSlug(restaurantSlug), [restaurantSlug]);
  const [menuLang, setMenuLang] = useState<GuestMenuLang>("el");
  useEffect(() => {
    if (!bilingual || typeof window === "undefined") return;
    try {
      const s = localStorage.getItem(GUEST_MENU_LANG_KEY);
      if (s === "en" || s === "el") setMenuLang(s);
    } catch {
      /* ignore */
    }
  }, [bilingual]);
  useEffect(() => {
    if (!bilingual || typeof window === "undefined") return;
    try {
      localStorage.setItem(GUEST_MENU_LANG_KEY, menuLang);
    } catch {
      /* ignore */
    }
  }, [bilingual, menuLang]);
  const ui = useMemo(
    () => getGuestMenuUiStrings(bilingual ? menuLang : "en"),
    [bilingual, menuLang]
  );
  const localizedCategories = useMemo(
    () =>
      bilingual ? localizeGuestMenuCategories(categories, menuLang, restaurantSlug) : categories,
    [bilingual, categories, menuLang, restaurantSlug]
  );
  const displayCategories = useMemo(() => {
    const q = menuSearch.trim().toLowerCase();
    if (!q) return localizedCategories;
    return localizedCategories
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            (i.description?.toLowerCase().includes(q) ?? false)
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [localizedCategories, menuSearch]);

  useEffect(() => {
    if (!bilingual) return;
    setCart((prev) =>
      prev.map((line) => {
        const item = findGuestItemById(localizedCategories, line.id);
        if (!item) return line;
        return {
          ...line,
          name: item.name,
          description: item.description,
          optionGroups: item.optionGroups,
          optionSummary: guestOptionSummaryFromSelection(item, line.selectedOptions),
        };
      })
    );
  }, [bilingual, menuLang, localizedCategories]);

  /** Set on the client only — avoids SSR/localStorage mismatch and hydration issues. */
  const [guestSessionId, setGuestSessionId] = useState("");
  useEffect(() => {
    try {
      const key = "qr_menu_guest_sid";
      let sid = localStorage.getItem(key);
      if (!sid) {
        sid = createGuestSessionId();
        localStorage.setItem(key, sid);
      }
      setGuestSessionId(sid);
    } catch {
      setGuestSessionId(createGuestSessionId());
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (bilingual) {
      document.documentElement.lang = menuLang;
      return;
    }
    const nav = navigator.language?.split("-")[0]?.trim();
    if (nav && /^[a-z]{2}$/i.test(nav)) {
      document.documentElement.lang = nav.toLowerCase();
    }
  }, [bilingual, menuLang]);

  const callWaiter = useCallback(async () => {
    setCallWaiterBusy(true);
    toast.success(ui.callWaiterSent);
    try {
      const res = await fetch("/api/customer/waiter-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableToken }),
      });
      if (!res.ok) {
        const text = await res.text();
        let data: { error?: string } = {};
        try { if (text) data = JSON.parse(text); } catch { /* ignore */ }
        toast.error(data.error ?? ui.callWaiterFailed);
      }
    } catch {
      toast.error(ui.callWaiterFailed);
    } finally {
      setCallWaiterBusy(false);
    }
  }, [tableToken, ui]);

  useEffect(() => {
    if (!displayCategories.some((c) => c.id === activeCategory)) {
      setActiveCategory(displayCategories[0]?.id ?? "");
    }
  }, [displayCategories, activeCategory]);

  /** Highlight the category in view while scrolling the full menu. */
  useEffect(() => {
    const root = mainRef.current;
    if (!root || displayCategories.length === 0) return;
    const elements = displayCategories
      .map((c) => document.getElementById(`menu-cat-${c.id}`))
      .filter((n): n is HTMLElement => n != null);
    if (elements.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting && e.intersectionRatio > 0)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (top?.target?.id?.startsWith("menu-cat-")) {
          setActiveCategory(top.target.id.slice("menu-cat-".length));
        }
      },
      { root, rootMargin: "-28% 0px -55% 0px", threshold: [0, 0.08, 0.2, 0.35, 0.5] }
    );
    elements.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [displayCategories]);

  const scrollToCategory = useCallback(
    (id: string) => {
      setActiveCategory(id);
      document.getElementById(`menu-cat-${id}`)?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    },
    [prefersReducedMotion]
  );

  useEffect(() => {
    if (!orderHistoryOpen || !guestSessionId) return;
    let cancelled = false;
    async function load() {
      setOrderHistoryLoading(true);
      setOrderHistoryError(null);
      try {
        const res = await fetch(
          `/api/orders/for-table?tableToken=${encodeURIComponent(tableToken)}&guestSessionId=${encodeURIComponent(guestSessionId)}`
        );
        const text = await res.text();
        let data: { error?: string; orders?: TableOrderSummary[] } = {};
        try {
          if (text) data = JSON.parse(text) as { error?: string; orders?: TableOrderSummary[] };
        } catch {
          if (!cancelled) {
            setOrderHistoryError(ui.couldNotLoadOrders);
            setOrderHistory(null);
          }
          return;
        }
        if (!res.ok) {
          if (!cancelled) {
            setOrderHistoryError(data.error || ui.couldNotLoadOrders);
            setOrderHistory(null);
          }
          return;
        }
        if (!cancelled) setOrderHistory(Array.isArray(data.orders) ? data.orders : []);
      } catch {
        if (!cancelled) {
          setOrderHistoryError(ui.couldNotLoadOrders);
          setOrderHistory(null);
        }
      } finally {
        if (!cancelled) setOrderHistoryLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [orderHistoryOpen, tableToken, guestSessionId, ui]);

  useEffect(() => {
    if (!searchMenuOpen) return;
    const t = window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 50);
    return () => window.clearTimeout(t);
  }, [searchMenuOpen]);

  useEffect(() => {
    if (!searchMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchMenuOpen]);

  useEffect(() => {
    if (!allergenInfoOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAllergenInfoOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [allergenInfoOpen]);

  const totalCents = cart.reduce(
    (sum, i) => sum + (i.price + (i.optionPriceModifier ?? 0)) * i.quantity,
    0
  );
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  const addToCart = (
    item: Item,
    notes?: string,
    selectedOptions?: Record<string, string | string[]>,
    optionPriceModifier?: number,
    optionSummary?: string,
    opts?: { flashQuickAdd?: boolean }
  ) => {
    setCart((prev) => {
      const newLine: CartItem = {
        ...item,
        quantity: 1,
        notes,
        selectedOptions,
        optionPriceModifier: optionPriceModifier ?? 0,
        optionSummary,
      };
      const key = cartLineKey(newLine);
      const existing = prev.find((c) => cartLineKey(c) === key);
      if (existing) {
        return prev.map((c) => (cartLineKey(c) === key ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, newLine];
    });
    setOptionsModalItem(null);
    if (opts?.flashQuickAdd) {
      setFlashItemId(item.id);
      window.setTimeout(() => setFlashItemId(null), 1800);
    }
  };

  const updateQuantity = (line: CartItem, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (cartLineKey(c) !== cartLineKey(line)) return c;
          const q = c.quantity + delta;
          return q <= 0 ? null : { ...c, quantity: q };
        })
        .filter((c): c is CartItem => c !== null)
    );
  };

  const removeFromCart = (line: CartItem) => {
    setCart((prev) => prev.filter((c) => cartLineKey(c) !== cartLineKey(line)));
  };

  const submitOrder = async (paymentPreference?: "card" | "cash") => {
    if (cart.length === 0) return;
    if (!usesOnlineCheckout) {
      const needsPick =
        payAtTableCardEnabled &&
        payAtTableCashEnabled &&
        (paymentPreference !== "card" && paymentPreference !== "cash");
      if (needsPick) {
        toast.error(ui.choosePayment);
        return;
      }
    }
    setIsPlacing(true);

    const savedCart = [...cart];
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
      guestSessionId: guestSessionId || undefined,
    };
    if (!usesOnlineCheckout && paymentPreference) {
      payload.paymentPreference = paymentPreference;
    }

    if (!usesOnlineCheckout) {
      setPaymentModalOpen(false);
      setCart([]);
      setCartOpen(false);
      setShowPostOrderThankYou(true);
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data: { error?: string; orderId?: string; checkoutUrl?: string } = {};
      try {
        if (text) data = JSON.parse(text);
      } catch {
        if (!res.ok) throw new Error("Invalid response from server");
      }
      if (!res.ok) throw new Error(data.error ?? "Failed to place order");

      if (usesOnlineCheckout) {
        setPaymentModalOpen(false);
        if (data.checkoutUrl) {
          setPayUrl(data.checkoutUrl);
        } else {
          setCart([]);
          setCartOpen(false);
          setShowPostOrderThankYou(true);
        }
      }
    } catch (e) {
      if (!usesOnlineCheckout) {
        setCart(savedCart);
        setShowPostOrderThankYou(false);
      }
      toast.error(e instanceof Error ? e.message : ui.orderFailedGeneric);
    } finally {
      setIsPlacing(false);
    }
  };

  const handlePlaceOrderClick = () => {
    if (cart.length === 0) return;
    if (usesOnlineCheckout) {
      void submitOrder();
      return;
    }
    if (payAtTableCardEnabled && payAtTableCashEnabled) {
      setPaymentModalOpen(true);
      return;
    }
    if (payAtTableCardEnabled) void submitOrder("card");
    else void submitOrder("cash");
  };

  const thankYouIcon = (
    <div
      className={`w-16 h-16 rounded-full bg-primary/15 text-primary flex items-center justify-center text-3xl mx-auto mb-4 ring-1 ring-primary/25 ${
        prefersReducedMotion ? "" : "motion-safe:animate-pulse"
      }`}
    >
      ⏳
    </div>
  );

  if (showPaidSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface">
        <div className="max-w-sm w-full text-center bg-card rounded-3xl shadow-lg border border-border p-8">
          {thankYouIcon}
          <h2 className="text-xl font-bold text-ink mb-6 leading-snug">{ui.paymentSuccessfulCombined}</h2>
          <button
            type="button"
            onClick={() => setShowPaidSuccess(false)}
            className="min-h-[48px] w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold shadow-sm ring-1 ring-black/10"
          >
            {ui.backToMenu}
          </button>
        </div>
      </div>
    );
  }

  if (showPostOrderThankYou) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface">
        <div className="max-w-sm w-full text-center bg-card rounded-3xl shadow-lg border border-border p-8">
          {tableLogoUrl ? (
            <img src={tableLogoUrl} alt="" className="h-10 w-auto mx-auto mb-3 object-contain" />
          ) : null}
          {thankYouIcon}
          <h2 className="text-xl font-bold text-ink mb-6 leading-snug">{ui.thankYouAfterOrder}</h2>
          <button
            type="button"
            onClick={() => setShowPostOrderThankYou(false)}
            className="min-h-[48px] w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold shadow-sm ring-1 ring-black/10"
          >
            {ui.backToMenu}
          </button>
        </div>
      </div>
    );
  }

  if (guestOrderingPaused) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface">
        <div className="max-w-md w-full rounded-3xl border border-border bg-card p-8 shadow-sm text-center">
          {tableLogoUrl ? (
            <img src={tableLogoUrl} alt="" className="h-12 w-auto mx-auto mb-4 object-contain" />
          ) : null}
          <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted mb-1">{restaurantName}</p>
          <p className="text-xs text-ink-muted mb-5">{tableName}</p>
          <div className="w-14 h-14 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-200 flex items-center justify-center text-2xl mx-auto mb-4 ring-1 ring-amber-500/25">
            ⏸
          </div>
          <h2 className="text-xl font-bold text-ink mb-3 leading-snug">{ui.orderingPausedTitle}</h2>
          <p className="text-base leading-relaxed text-ink-muted sm:text-sm">{ui.orderingPausedHint}</p>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface">
        <div className="max-w-md w-full rounded-3xl border border-border bg-card p-8 shadow-sm text-center">
          <h2 className="text-xl font-bold text-ink mb-2">{ui.emptyMenuTitle}</h2>
          <p className="text-base leading-relaxed text-ink-muted mb-4 sm:text-sm">{ui.emptyMenuHint}</p>
          <p className="text-sm text-ink-muted sm:text-xs">{ui.emptyMenuWrongLink}</p>
        </div>
      </div>
    );
  }

  if (payUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface">
        <div className="max-w-sm w-full text-center bg-card rounded-3xl shadow-lg border border-border p-8">
          <h2 className="text-xl font-bold text-ink mb-6 leading-snug">{ui.stripePayPrompt}</h2>
          <a
            href={payUrl}
            className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-center shadow-md ring-1 ring-black/10"
          >
            {ui.payNow}
          </a>
        </div>
      </div>
    );
  }

  const onMainTouchStart = (e: React.TouchEvent) => {
    const el = mainRef.current;
    if (!el || el.scrollTop > 0) return;
    pullStartY.current = e.touches[0].clientY;
  };

  const onMainTouchMove = (e: React.TouchEvent) => {
    if (pullStartY.current == null) return;
    const el = mainRef.current;
    if (!el || el.scrollTop > 0) return;
    const dy = e.touches[0].clientY - pullStartY.current;
    if (dy > 0) setPullDistance(Math.min(dy, 80));
  };

  const onMainTouchEnd = () => {
    if (pullDistance > 48) {
      startRefreshTransition(() => { router.refresh(); });
    }
    pullStartY.current = null;
    setPullDistance(0);
  };

  const catalogChromeOnly =
    !cartOpen &&
    !orderHistoryOpen &&
    !paymentModalOpen &&
    !optionsModalItem &&
    !imagePreviewItem &&
    !searchMenuOpen &&
    !allergenInfoOpen;

  const mainBottomPad =
    totalItems > 0
      ? "pb-[calc(7.75rem+env(safe-area-inset-bottom,0px))]"
      : "pb-[calc(4rem+env(safe-area-inset-bottom,0px))]";

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-surface">
      <header className="sticky top-0 z-[15] shrink-0 border-b border-border bg-surface/95 shadow-sm backdrop-blur-[6px]">
        <div className="px-4 pt-3 pb-1.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {tableLogoUrl && (
                <img
                  src={tableLogoUrl}
                  alt=""
                  className="h-10 w-auto max-w-[100px] object-contain object-left shrink-0"
                />
              )}
              <div className="min-w-0">
                <h1 className="line-clamp-2 break-words text-[1.35rem] font-bold leading-tight tracking-tight text-ink sm:text-xl">
                  {restaurantName}
                </h1>
                <p className="mt-0.5 line-clamp-2 break-words text-base text-ink-muted sm:text-sm">
                  {tableName}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <button
                type="button"
                onClick={() => setOrderHistoryOpen(true)}
                className="min-h-[44px] rounded-xl border-2 border-border bg-card px-3 py-2 text-sm font-semibold text-ink shadow-sm hover:border-primary/40 hover:bg-primary/5"
              >
                {ui.yourOrders}
              </button>
              {bilingual ? (
                <div
                  className="flex flex-wrap justify-end gap-1.5"
                  role="group"
                  aria-label={ui.menuLanguageGroupAria}
                >
                  <button
                    type="button"
                    onClick={() => setMenuLang("el")}
                    className={`flex min-h-[34px] items-center gap-1 rounded-full border-2 px-2.5 py-1 text-xs font-semibold transition-colors ${
                      menuLang === "el"
                        ? "border-primary bg-primary/10 text-ink"
                        : "border-border bg-card text-ink-muted hover:border-ink/20"
                    }`}
                    aria-pressed={menuLang === "el"}
                  >
                    <span className="text-base leading-none" aria-hidden>
                      🇬🇷
                    </span>
                    {ui.langGreek}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMenuLang("en")}
                    className={`flex min-h-[34px] items-center gap-1 rounded-full border-2 px-2.5 py-1 text-xs font-semibold transition-colors ${
                      menuLang === "en"
                        ? "border-primary bg-primary/10 text-ink"
                        : "border-border bg-card text-ink-muted hover:border-ink/20"
                    }`}
                    aria-pressed={menuLang === "en"}
                  >
                    <span className="text-base leading-none" aria-hidden>
                      🇬🇧
                    </span>
                    {ui.langEnglish}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-2 [-webkit-overflow-scrolling:touch]">
          {displayCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => scrollToCategory(c.id)}
              className={`relative shrink-0 min-h-[32px] whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium leading-tight transition-all sm:min-h-[34px] sm:px-3 sm:py-1 sm:text-[0.8125rem] ${
                activeCategory === c.id
                  ? "bg-primary text-white shadow-md ring-1 ring-black/10 after:absolute after:left-1/2 after:top-0.5 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-white/90 after:content-['']"
                  : "bg-card text-ink border border-border shadow-sm hover:border-ink/25 hover:bg-surface"
              }`}
            >
              {guestCategoryLabelWithEmoji(c.name)}
            </button>
          ))}
        </div>
        <div className="border-t border-border/50 bg-surface/90 px-4 py-1.5">
          <p className="text-center text-[0.65rem] leading-snug text-ink-muted sm:text-[0.7rem]">
            {ui.allergenTrustLine}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-1 pb-1.5">
          <button
            type="button"
            onClick={() => setAllergenInfoOpen(true)}
            className="inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-ink shadow-sm ring-1 ring-black/[0.03] transition-colors hover:border-primary/35 hover:bg-primary/[0.04] active:scale-[0.98] sm:min-h-[32px] sm:text-[0.8125rem]"
            aria-haspopup="dialog"
            aria-expanded={allergenInfoOpen}
            aria-controls="guest-allergen-info-dialog"
          >
            <svg className="h-3.5 w-3.5 shrink-0 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span>{ui.infoButton}</span>
          </button>
          <button
            type="button"
            onClick={() => setSearchMenuOpen(true)}
            className="inline-flex min-h-[34px] max-w-full shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-ink shadow-sm ring-1 ring-black/[0.03] transition-colors hover:border-primary/35 hover:bg-primary/[0.04] active:scale-[0.98] sm:min-h-[32px] sm:text-[0.8125rem]"
            aria-haspopup="dialog"
            aria-expanded={searchMenuOpen}
            aria-controls="guest-menu-search-dialog"
          >
            <svg className="h-3.5 w-3.5 shrink-0 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <span className="truncate">{ui.searchButton}</span>
            {menuSearch.trim() ? (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" title={menuSearch} aria-hidden />
            ) : null}
          </button>
        </div>
      </header>

      <main
        ref={mainRef}
        className={`relative mx-auto min-h-0 w-full max-w-lg flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-4 py-5 ${mainBottomPad}`}
        onTouchStart={onMainTouchStart}
        onTouchMove={onMainTouchMove}
        onTouchEnd={onMainTouchEnd}
        style={{
          transform:
            pullDistance && !prefersReducedMotion
              ? `translateY(${pullDistance * 0.35}px)`
              : undefined,
        }}
      >
        {isRefreshing ? (
          <div
            className="pointer-events-none absolute inset-0 z-[5] flex flex-col bg-surface/85 px-4 py-6 backdrop-blur-[2px]"
            aria-busy="true"
            aria-live="polite"
          >
            <p className="mb-3 text-center text-xs font-medium text-ink-muted">{ui.menuRefreshing}</p>
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-[4.25rem] rounded-xl border border-border bg-card ${
                    prefersReducedMotion ? "" : "animate-pulse"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : null}
        {displayCategories.length === 0 && menuSearch.trim() ? (
          <p className="py-12 text-center text-sm text-ink-muted">{ui.searchNoResults}</p>
        ) : (
          displayCategories.map((cat, catIndex) => (
          <section
            key={cat.id}
            id={`menu-cat-${cat.id}`}
            className={catIndex > 0 ? "mt-8 border-t border-border/60 pt-6" : ""}
          >
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {guestCategoryLabelWithEmoji(cat.name)}
            </h2>
            <ul className="space-y-2">
              {cat.items.map((item) => (
                <li
                  key={item.id}
                  className={`flex flex-row gap-3 rounded-xl border bg-card p-2.5 shadow-sm transition-all hover:shadow-md ${
                    flashItemId === item.id
                      ? "border-emerald-500 ring-2 ring-emerald-400/50"
                      : "border-border"
                  }`}
                >
                  {item.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImagePreviewItem(item)}
                      className="shrink-0 self-start"
                      aria-label={ui.viewPhoto}
                    >
                      <img
                        src={item.imageUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    </button>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex min-w-0 flex-row items-baseline justify-between gap-2">
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1">
                        <p className="min-w-0 text-sm font-semibold leading-snug text-ink">{item.name}</p>
                        {item.allergenCodes?.length ? (
                          <AllergenIconRow codes={item.allergenCodes} />
                        ) : null}
                      </div>
                      <span className="shrink-0 text-sm font-bold tabular-nums text-primary">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="line-clamp-2 text-xs leading-snug text-ink-muted">{item.description}</p>
                    )}
                    {itemHasOptionGroups(item) && !itemHasRequiredOptionGroup(item) ? (
                      <p className="text-[0.65rem] leading-snug text-ink-muted sm:text-xs">{ui.optionalExtrasHint}</p>
                    ) : null}
                    <div className="mt-0.5 flex min-w-0 flex-row flex-wrap items-center justify-end gap-1.5">
                      {flashItemId === item.id ? (
                        <span
                          className={`mr-1 text-sm font-semibold text-emerald-600 ${
                            prefersReducedMotion ? "" : "motion-safe:animate-pulse"
                          }`}
                          aria-live="polite"
                        >
                          ✓
                        </span>
                      ) : null}
                      {!itemHasOptionGroups(item) ? (
                        <button
                          type="button"
                          onClick={() =>
                            addToCart(item, undefined, undefined, undefined, undefined, {
                              flashQuickAdd: true,
                            })
                          }
                          className="min-h-[40px] min-w-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-black/10 transition-colors hover:bg-primary-hover"
                        >
                          {ui.order}
                        </button>
                      ) : itemHasRequiredOptionGroup(item) ? (
                        <button
                          type="button"
                          onClick={() => setOptionsModalItem(item)}
                          className="min-h-[40px] min-w-0 rounded-full border-2 border-primary bg-card px-3 py-1.5 text-xs font-semibold text-primary shadow-sm transition-colors hover:bg-primary/10"
                        >
                          {ui.customise}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setOptionsModalItem(item)}
                            className="min-h-[40px] min-w-0 rounded-full border-2 border-primary bg-card px-3 py-1.5 text-xs font-semibold text-primary shadow-sm transition-colors hover:bg-primary/10"
                          >
                            {ui.customise}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              addToCart(item, undefined, undefined, undefined, undefined, {
                                flashQuickAdd: true,
                              })
                            }
                            className="min-h-[40px] min-w-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-black/10 transition-colors hover:bg-primary-hover"
                          >
                            {ui.order}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          ))
        )}
      </main>

      {catalogChromeOnly ? (
        <div
          className="pointer-events-none fixed right-3 z-[18] flex flex-col items-center gap-1 sm:right-4"
          style={{
            bottom: totalItems > 0 ? "6.75rem" : "max(1rem, env(safe-area-inset-bottom, 0px))",
          }}
        >
          <button
            type="button"
            onClick={() => void callWaiter()}
            disabled={callWaiterBusy}
            className={`pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg ring-2 ring-violet-400/50 transition hover:bg-violet-700 disabled:opacity-55 dark:bg-violet-600 dark:ring-violet-400/35 dark:hover:bg-violet-500 ${
              prefersReducedMotion ? "" : "active:scale-95"
            }`}
            aria-label={ui.callWaiterAria}
            title={ui.callWaiterAria}
          >
            {callWaiterBusy ? (
              <Spinner className="h-5 w-5 border-white border-t-transparent" label="" />
            ) : (
              <WaiterBellGlyph className="h-5 w-5" />
            )}
          </button>
          <span className="pointer-events-none max-w-[6rem] text-center text-[0.68rem] font-medium leading-tight text-ink-muted">
            {ui.callWaiterCaption}
          </span>
        </div>
      ) : null}

      {optionsModalItem && (
        <ItemOptionsModal
          item={optionsModalItem}
          ui={ui}
          onAdd={(notes, selectedOptions, optionPriceModifier, optionSummary) =>
            addToCart(
              optionsModalItem,
              notes,
              selectedOptions,
              optionPriceModifier,
              optionSummary
            )
          }
          onClose={() => setOptionsModalItem(null)}
          formatPrice={formatPrice}
        />
      )}

      {imagePreviewItem && (
        <div
          className="fixed inset-0 z-30 bg-black/60 flex items-center justify-center px-4"
          onClick={() => setImagePreviewItem(null)}
        >
          <div
            className="max-w-md w-full bg-card rounded-3xl border border-border shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {imagePreviewItem.imageUrl && (
              <img
                src={imagePreviewItem.imageUrl}
                alt={imagePreviewItem.name}
                loading="lazy"
                decoding="async"
                className="w-full max-h-[60vh] object-cover"
              />
            )}
            <div className="p-4">
              <p className="font-semibold text-ink text-base">{imagePreviewItem.name}</p>
              {imagePreviewItem.description && (
                <p className="text-base leading-relaxed text-ink-muted mt-1 sm:text-sm">
                  {imagePreviewItem.description}
                </p>
              )}
              <button
                type="button"
                onClick={() => setImagePreviewItem(null)}
                className="mt-4 w-full min-h-[48px] rounded-xl border-2 border-border bg-surface text-base font-semibold text-ink hover:bg-ink/5 sm:text-sm"
              >
                {ui.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {searchMenuOpen ? (
        <div
          id="guest-menu-search-dialog"
          className="fixed inset-0 z-[37] flex items-end justify-center bg-black/45 backdrop-blur-[2px] sm:items-center sm:px-4 sm:py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-search-title"
          onClick={() => setSearchMenuOpen(false)}
        >
          <div
            className="flex w-full max-w-md flex-col rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 id="guest-search-title" className="min-w-0 text-base font-bold text-ink sm:text-lg">
                {ui.searchMenu}
              </h2>
              <button
                type="button"
                onClick={() => setSearchMenuOpen(false)}
                className="flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-full border-2 border-border bg-surface text-lg font-bold leading-none text-ink hover:bg-ink/5"
                aria-label={ui.close}
              >
                ✕
              </button>
            </div>
            <div className="px-4 py-3">
              <label className="sr-only" htmlFor="guest-menu-search">
                {ui.searchMenu}
              </label>
              <input
                ref={searchInputRef}
                id="guest-menu-search"
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                placeholder={ui.searchPlaceholder}
                className="w-full rounded-xl border-2 border-border bg-surface px-3 py-2.5 text-base text-ink placeholder:text-ink-muted/65 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
              />
              {menuSearch.trim() ? (
                <button
                  type="button"
                  onClick={() => setMenuSearch("")}
                  className="mt-2 text-sm font-semibold text-primary hover:underline"
                >
                  {ui.searchClear}
                </button>
              ) : null}
              {menuSearch.trim() && displayCategories.length === 0 ? (
                <p className="mt-4 text-center text-sm leading-snug text-ink-muted">{ui.searchNoResults}</p>
              ) : null}
            </div>
            <div className="shrink-0 border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
              <button
                type="button"
                onClick={() => setSearchMenuOpen(false)}
                className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-md ring-1 ring-black/10 hover:bg-primary-hover"
              >
                {ui.close}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {allergenInfoOpen ? (
        <div
          id="guest-allergen-info-dialog"
          className="fixed inset-0 z-[38] flex items-end justify-center bg-black/45 backdrop-blur-[2px] sm:items-center sm:px-4 sm:py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-allergen-info-title"
          onClick={() => setAllergenInfoOpen(false)}
        >
          <div
            className="flex max-h-[min(92dvh,900px)] w-full max-w-lg flex-col rounded-t-3xl border border-border bg-card shadow-2xl sm:max-h-[85vh] sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 id="guest-allergen-info-title" className="min-w-0 text-base font-bold text-ink sm:text-lg">
                {ui.allergenInfoTitle}
              </h2>
              <button
                type="button"
                onClick={() => setAllergenInfoOpen(false)}
                className="flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-full border-2 border-border bg-surface text-lg font-bold leading-none text-ink hover:bg-ink/5"
                aria-label={ui.close}
              >
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-3 sm:px-4 sm:py-4">
              {/* Static asset: add/replace at public/food-allergen-info.png */}
              <img
                src="/food-allergen-info.png"
                alt={ui.allergenInfoImageAlt}
                className="mx-auto h-auto w-full max-w-full rounded-lg border border-border/40 bg-surface object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="shrink-0 border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
              <button
                type="button"
                onClick={() => setAllergenInfoOpen(false)}
                className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-md ring-1 ring-black/10 hover:bg-primary-hover"
              >
                {ui.close}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
              <h2 className="text-[1.35rem] font-bold leading-tight text-ink sm:text-xl">{ui.yourOrder}</h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="min-h-[44px] min-w-[44px] rounded-full bg-surface text-ink border-2 border-border hover:bg-ink/5 flex items-center justify-center text-lg leading-none font-bold"
                aria-label={ui.close}
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-ink-muted mb-2 sm:text-xs">{ui.swipeToRemove}</p>
            {cart.length === 0 ? (
              <p className="mb-6 rounded-xl border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-ink-muted">
                {ui.cartEmptyHint}
              </p>
            ) : (
              <ul className="mb-5 space-y-4">
                {cart.map((i) => (
                  <CartLineRow
                    key={cartLineKey(i)}
                    line={i}
                    tEachQty={ui.priceEachTimesQty(
                      formatPrice(i.price + (i.optionPriceModifier ?? 0)),
                      i.quantity
                    )}
                    onDecrease={() => updateQuantity(i, -1)}
                    onIncrease={() => updateQuantity(i, 1)}
                    onRemove={() => removeFromCart(i)}
                    labels={{
                      decrease: ui.decreaseQty,
                      increase: ui.increaseQty,
                      remove: ui.remove,
                    }}
                    removeConfirmTitle={ui.removeFromCartTitle(i.name)}
                    removeConfirmBody={ui.removeFromCartBody}
                  />
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-medium text-ink-muted sm:text-sm">{ui.total}</span>
              <span className="text-xl font-bold tabular-nums text-ink">{formatPrice(totalCents)}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setCartOpen(false);
                handlePlaceOrderClick();
              }}
              disabled={isPlacing || cart.length === 0}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-semibold text-white shadow-lg ring-1 ring-black/10 transition-all hover:bg-primary-hover disabled:opacity-60"
            >
              {isPlacing ? (
                <>
                  <Spinner className="h-5 w-5 border-white border-t-transparent" label={ui.placingOrder} />
                  {ui.placingOrder}
                </>
              ) : usesOnlineCheckout ? (
                ui.placeOrderPay
              ) : (
                ui.placeOrder
              )}
            </button>
          </div>
        </div>
      )}

      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[25] shrink-0 border-t border-border bg-surface pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="flex w-full max-w-lg mx-auto items-center justify-center gap-2 border-b border-border/70 bg-card/90 px-3 py-1.5 text-center text-[0.7rem] font-medium text-ink-muted transition-colors hover:bg-primary/[0.06] hover:text-ink sm:text-xs"
          >
            <span className="tabular-nums">{ui.itemsInCart(totalItems)}</span>
            <span aria-hidden>·</span>
            <span className="font-bold tabular-nums text-primary">{formatPrice(totalCents)}</span>
            <span aria-hidden>·</span>
            <span>{ui.cartStripHint}</span>
          </button>
          <div className="max-w-lg mx-auto flex items-center gap-2 px-3 py-2">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="flex min-h-[44px] min-w-0 items-center gap-2 rounded-lg border-2 border-primary bg-card px-3 py-1.5 text-xs font-semibold text-primary shadow-sm transition-colors hover:bg-primary/10"
            >
              <span>{ui.itemsInCart(totalItems)}</span>
              <span className="font-bold tabular-nums">{formatPrice(totalCents)}</span>
            </button>
            <button
              type="button"
              onClick={handlePlaceOrderClick}
              disabled={isPlacing}
              className={`flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white shadow-md ring-1 ring-black/10 transition-all hover:bg-primary-hover disabled:opacity-60 ${
                prefersReducedMotion ? "" : "active:scale-[0.98]"
              }`}
            >
                {isPlacing ? (
                  <>
                    <Spinner className="h-4 w-4 border-white border-t-transparent" label={ui.placing} />
                    {ui.placing}
                  </>
                ) : usesOnlineCheckout ? (
                  ui.placeOrderPay
                ) : (
                  ui.placeOrder
                )}
              </button>
          </div>
        </div>
      )}

      {paymentModalOpen && !usesOnlineCheckout && payAtTableCardEnabled && payAtTableCashEnabled ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 px-3 py-6 sm:px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-modal-title"
          onClick={() => !isPlacing && setPaymentModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-border bg-card p-5 pb-6 shadow-2xl sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="payment-modal-title" className="text-xl font-bold text-ink text-center sm:text-2xl">
              {ui.howToPay}
            </h2>
            <p className="mt-1 text-base text-ink-muted text-center sm:text-sm">{ui.paymentModalSubtitle}</p>
            <div className="mt-5 flex flex-col gap-3 sm:mt-6">
              <button
                type="button"
                disabled={isPlacing}
                onClick={() => void submitOrder("card")}
                className={`group flex w-full min-h-[76px] flex-row items-center gap-4 rounded-2xl border-2 border-border bg-card px-4 py-3 text-left shadow-sm transition-all hover:border-primary/50 hover:bg-primary/[0.06] disabled:opacity-50 ${
                  prefersReducedMotion ? "" : "active:scale-[0.99]"
                }`}
              >
                <PaymentCardGlyph className="h-12 w-12 shrink-0 text-primary sm:h-14 sm:w-14" />
                <div className="min-w-0 flex-1">
                  <span className="block text-base font-bold text-ink sm:text-lg">{ui.payCardAtTable}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-ink-muted sm:text-sm">
                    {ui.payCardAtTableHint}
                  </span>
                </div>
              </button>
              <button
                type="button"
                disabled={isPlacing}
                onClick={() => void submitOrder("cash")}
                className={`group flex w-full min-h-[76px] flex-row items-center gap-4 rounded-2xl border-2 border-border bg-card px-4 py-3 text-left shadow-sm transition-all hover:border-primary/50 hover:bg-primary/[0.06] disabled:opacity-50 ${
                  prefersReducedMotion ? "" : "active:scale-[0.99]"
                }`}
              >
                <PaymentCashGlyph className="h-12 w-12 shrink-0 text-primary sm:h-14 sm:w-14" />
                <div className="min-w-0 flex-1">
                  <span className="block text-base font-bold text-ink sm:text-lg">{ui.payCash}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-ink-muted sm:text-sm">{ui.payCashHint}</span>
                </div>
              </button>
            </div>
            {isPlacing ? (
              <div className="mt-5 flex items-center justify-center gap-2 text-base text-ink-muted">
                <Spinner className="h-5 w-5 border-primary border-t-transparent" label={ui.placingOrder} />
                {ui.placingOrder}
              </div>
            ) : null}
            <button
              type="button"
              disabled={isPlacing}
              onClick={() => setPaymentModalOpen(false)}
              className="mt-5 w-full min-h-[52px] rounded-2xl border-2 border-border bg-surface text-base font-semibold text-ink hover:bg-ink/5 disabled:opacity-50"
            >
              {ui.cancel}
            </button>
          </div>
        </div>
      ) : null}

      {orderHistoryOpen ? (
        <div
          className="fixed inset-0 z-[41] flex items-end justify-center bg-black/55 sm:items-center sm:px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-history-title"
          onClick={() => setOrderHistoryOpen(false)}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-3xl border border-border bg-card shadow-2xl sm:max-h-[80vh] sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 border-b border-border px-5 py-4">
              <h2 id="order-history-title" className="text-lg font-bold text-ink sm:text-xl">
                {ui.yourOrders}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">{ui.yourOrdersHint}</p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5">
              {orderHistoryLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-ink-muted">
                  <Spinner className="h-6 w-6 border-primary border-t-transparent" label="" />
                  <span className="text-sm">{ui.placingOrder}</span>
                </div>
              ) : orderHistoryError ? (
                <p className="py-10 text-center text-sm text-red-800">{orderHistoryError}</p>
              ) : !orderHistory || orderHistory.length === 0 ? (
                <p className="py-10 text-center text-sm text-ink-muted">{ui.noOrdersYet}</p>
              ) : (
                <>
                  <ul className="space-y-2 pb-2">
                    {orderHistory.map((o) => (
                      <li key={o.id}>
                        <Link
                          href={`/m/${tableToken}/order/${o.id}`}
                          onClick={() => setOrderHistoryOpen(false)}
                          className="flex min-h-[52px] flex-col rounded-2xl border-2 border-border bg-surface px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/[0.04]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-semibold text-ink">
                              {ui.orderStatus(o.status, o.waiterRelayPending)}
                            </span>
                            <span className="shrink-0 text-base font-bold tabular-nums text-ink">
                              {formatPrice(o.totalAmount)}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
                            <span>{formatOrderWhen(o.createdAt)}</span>
                            <span aria-hidden>·</span>
                            <span>
                              {ui.orderHistoryItems(o.itemCount)}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 border-t border-border pt-3 text-center text-[0.7rem] leading-snug text-ink-muted sm:text-xs">
                    {ui.reorderHint}
                  </p>
                </>
              )}
            </div>
            <div className="shrink-0 border-t border-border p-4">
              <button
                type="button"
                onClick={() => setOrderHistoryOpen(false)}
                className="min-h-[48px] w-full rounded-xl border-2 border-border bg-card text-base font-semibold text-ink hover:bg-ink/5"
              >
                {ui.close}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CartLineRow({
  line,
  tEachQty,
  onDecrease,
  onIncrease,
  onRemove,
  labels,
  removeConfirmTitle,
  removeConfirmBody,
}: {
  line: CartItem;
  tEachQty: string;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
  labels: { decrease: string; increase: string; remove: string };
  removeConfirmTitle: string;
  removeConfirmBody: string;
}) {
  const touchStartX = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (dx > 56) onRemove();
  };

  return (
    <li
      className="flex items-start justify-between gap-3 py-3 border-b border-border last:border-0"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold leading-snug text-ink sm:text-sm">{line.name}</p>
        <p className="text-base text-ink-muted mt-0.5 sm:text-sm">{tEachQty}</p>
        {(line.notes || line.optionSummary) && (
          <p className="text-sm text-ink-muted mt-1 italic sm:text-xs">
            {[line.notes, line.optionSummary].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      <div className="flex max-w-full flex-wrap items-center justify-end gap-1 sm:flex-nowrap sm:justify-start">
        <button
          type="button"
          onClick={onDecrease}
          className="min-h-[44px] min-w-[44px] rounded-full bg-surface text-ink font-medium hover:bg-ink/10 transition-colors flex items-center justify-center"
          aria-label={labels.decrease}
        >
          −
        </button>
        <span className="w-8 text-center font-semibold text-ink">{line.quantity}</span>
        <button
          type="button"
          onClick={onIncrease}
          className="min-h-[44px] min-w-[44px] rounded-full bg-surface text-ink font-medium hover:bg-ink/10 transition-colors flex items-center justify-center"
          aria-label={labels.increase}
        >
          +
        </button>
        <button
          type="button"
          onClick={() => {
            if (!confirmDestructiveAction(removeConfirmTitle, removeConfirmBody))
              return;
            onRemove();
          }}
          className="ml-1 min-h-[44px] min-w-[72px] shrink-0 rounded-lg border-2 border-red-400 bg-red-50 px-3 text-base font-semibold text-red-900 hover:bg-red-100 sm:text-sm"
        >
          {labels.remove}
        </button>
      </div>
    </li>
  );
}

function ItemOptionsModal({
  item,
  ui,
  onAdd,
  onClose,
  formatPrice,
}: {
  item: Item;
  ui: GuestMenuUiStrings;
  onAdd: (
    notes: string,
    selectedOptions: Record<string, string | string[]>,
    optionPriceModifier: number,
    optionSummary?: string
  ) => void;
  onClose: () => void;
  formatPrice: (cents: number) => string;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const groups = useMemo(() => {
    const raw = Array.isArray(item.optionGroups) ? item.optionGroups : [];
    const byId = new Map<string, (typeof raw)[number]>();
    for (const g of raw) {
      const existing = byId.get(g.id);
      if (!existing) {
        byId.set(g.id, g);
        continue;
      }
      // Defensive merge for malformed data where duplicate option-group ids exist.
      const seen = new Set(existing.choices.map((c) => c.id));
      const mergedChoices = existing.choices.slice();
      for (const choice of g.choices) {
        if (seen.has(choice.id)) continue;
        seen.add(choice.id);
        mergedChoices.push(choice);
      }
      byId.set(g.id, {
        ...existing,
        required: existing.required || g.required,
        choices: mergedChoices,
      });
    }
    return Array.from(byId.values());
  }, [item.optionGroups]);
  const [selections, setSelections] = useState<Record<string, string | string[]>>({});
  const [notes, setNotes] = useState("");

  const optionPriceModifier = groups.reduce((sum, g) => {
    const sel = selections[g.id];
    if (g.type === "single" && typeof sel === "string") {
      const choice = g.choices.find((c) => c.id === sel);
      return sum + (choice?.priceCents ?? 0);
    }
    if (g.type === "multi" && Array.isArray(sel)) {
      return sum + sel.reduce((s, id) => {
        const choice = g.choices.find((c) => c.id === id);
        return s + (choice?.priceCents ?? 0);
      }, 0);
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
      if (g.type === "single" && typeof sel === "string") {
        return g.choices.find((c) => c.id === sel)?.label;
      }
      if (g.type === "multi" && Array.isArray(sel)) {
        return sel
          .map((id) => g.choices.find((c) => c.id === id)?.label)
          .filter(Boolean)
          .join(", ");
      }
      return null;
    })
    .filter(Boolean)
    .join(", ");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onAdd(notes.trim(), selections, optionPriceModifier, optionSummary);
  };

  return (
    <div className="fixed inset-0 z-30 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
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
            aria-label={ui.close}
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-3">
            <p className="mb-4 text-base leading-relaxed text-ink-muted sm:text-sm">{ui.chooseOptions}</p>
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
                        onChange={() =>
                          setSelections((prev) => ({ ...prev, [g.id]: c.id }))
                        }
                        className="sr-only"
                      />
                      <span className="flex-1 font-medium text-ink">
                        {c.label}
                        {c.priceCents > 0 && (
                          <span className="text-ink-muted font-normal ml-1">
                            +{formatPrice(c.priceCents)}
                          </span>
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
                          <span className="text-ink-muted font-normal ml-1">
                            +{formatPrice(c.priceCents)}
                          </span>
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
              {ui.noteKitchen}{" "}
              <span className="font-normal text-ink-muted">{ui.noteOptional}</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={ui.notePlaceholder}
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
              className={`min-h-[48px] flex-1 rounded-xl bg-primary py-3.5 text-base font-semibold text-white shadow-md ring-1 ring-black/10 transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm ${
                prefersReducedMotion ? "" : "active:scale-[0.99]"
              }`}
            >
              {ui.addToOrderBtn}
            </button>
          </div>
          </div>
        </form>
      </div>
    </div>
  );
}
