"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { SUPPORTED_LOCALES } from "@/lib/locale-config";

const GUEST_ONLINE_CARD_PAYMENT_AVAILABLE = true;

const PRESET_COLORS = [
  { name: "Orange", hex: "#C15C2A" },
  { name: "Red", hex: "#DC2626" },
  { name: "Green", hex: "#16A34A" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Teal", hex: "#0D9488" },
  { name: "Purple", hex: "#7C3AED" },
  { name: "Amber", hex: "#D97706" },
  { name: "Rose", hex: "#E11D48" },
  { name: "Slate", hex: "#475569" },
  { name: "Emerald", hex: "#059669" },
];

export function BrandingForm({
  initialName,
  initialLogoUrl,
  initialPrimaryColor,
  initialColorMode,
  initialWaiterRelayEnabled,
  initialNavLabelOrdersQueue,
  initialNavLabelGuestOrders,
  initialOnlinePaymentEnabled,
  initialPayAtTableCardEnabled,
  initialPayAtTableCashEnabled,
  initialPrepTimeEstimateMinutes,
  initialVatRate,
  initialTimezone,
  initialPauseMessage,
  initialOpeningTime,
  initialClosingTime,
}: {
  initialName: string;
  initialLogoUrl: string;
  initialPrimaryColor: string | null;
  initialColorMode?: string;
  initialWaiterRelayEnabled?: boolean;
  initialNavLabelOrdersQueue?: string;
  initialNavLabelGuestOrders?: string;
  initialOnlinePaymentEnabled?: boolean;
  initialPayAtTableCardEnabled?: boolean;
  initialPayAtTableCashEnabled?: boolean;
  initialPrepTimeEstimateMinutes?: number | null;
  initialVatRate?: number;
  initialTimezone?: string;
  initialPauseMessage?: string;
  initialOpeningTime?: string;
  initialClosingTime?: string;
  initialMenuOnlyMode?: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [primaryColor, setPrimaryColor] = useState(initialPrimaryColor ?? "");
  const [colorMode, setColorMode] = useState<"light" | "dark">(
    initialColorMode === "dark" ? "dark" : "light"
  );
  const [waiterRelayEnabled, setWaiterRelayEnabled] = useState(Boolean(initialWaiterRelayEnabled));
  const [navLabelOrders, setNavLabelOrders] = useState(initialNavLabelOrdersQueue ?? "");
  const [navLabelGuest, setNavLabelGuest] = useState(initialNavLabelGuestOrders ?? "");
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(
    GUEST_ONLINE_CARD_PAYMENT_AVAILABLE && initialOnlinePaymentEnabled === true
  );
  const [payAtTableCardEnabled, setPayAtTableCardEnabled] = useState(
    initialPayAtTableCardEnabled !== false
  );
  const [payAtTableCashEnabled, setPayAtTableCashEnabled] = useState(
    initialPayAtTableCashEnabled !== false
  );
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(
    initialPrepTimeEstimateMinutes != null && initialPrepTimeEstimateMinutes > 0
      ? String(initialPrepTimeEstimateMinutes)
      : ""
  );
  const [vatRate, setVatRate] = useState(
    initialVatRate != null && initialVatRate > 0 ? String(initialVatRate) : ""
  );
  const [timezone, setTimezone] = useState(initialTimezone ?? "Europe/Athens");
  const [pauseMessage, setPauseMessage] = useState(initialPauseMessage ?? "");
  const [openingTime, setOpeningTime] = useState(initialOpeningTime ?? "");
  const [closingTime, setClosingTime] = useState(initialClosingTime ?? "");
  const [menuOnlyMode, setMenuOnlyMode] = useState(Boolean(initialMenuOnlyMode));
  const [showCustomColor, setShowCustomColor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    setName(initialName);
    setLogoUrl(initialLogoUrl);
    setPrimaryColor(initialPrimaryColor ?? "");
    setColorMode(initialColorMode === "dark" ? "dark" : "light");
    setWaiterRelayEnabled(Boolean(initialWaiterRelayEnabled));
    setNavLabelOrders(initialNavLabelOrdersQueue ?? "");
    setNavLabelGuest(initialNavLabelGuestOrders ?? "");
    setOnlinePaymentEnabled(GUEST_ONLINE_CARD_PAYMENT_AVAILABLE && initialOnlinePaymentEnabled === true);
    setPayAtTableCardEnabled(initialPayAtTableCardEnabled !== false);
    setPayAtTableCashEnabled(initialPayAtTableCashEnabled !== false);
    setPrepTimeMinutes(
      initialPrepTimeEstimateMinutes != null && initialPrepTimeEstimateMinutes > 0
        ? String(initialPrepTimeEstimateMinutes)
        : ""
    );
    setVatRate(
      initialVatRate != null && initialVatRate > 0 ? String(initialVatRate) : ""
    );
    setTimezone(initialTimezone ?? "Europe/Athens");
    setPauseMessage(initialPauseMessage ?? "");
    setOpeningTime(initialOpeningTime ?? "");
    setClosingTime(initialClosingTime ?? "");
    setMenuOnlyMode(Boolean(initialMenuOnlyMode));
  }, [
    initialName,
    initialLogoUrl,
    initialPrimaryColor,
    initialColorMode,
    initialWaiterRelayEnabled,
    initialNavLabelOrdersQueue,
    initialNavLabelGuestOrders,
    initialOnlinePaymentEnabled,
    initialPayAtTableCardEnabled,
    initialPayAtTableCashEnabled,
    initialPrepTimeEstimateMinutes,
    initialVatRate,
    initialTimezone,
    initialPauseMessage,
    initialOpeningTime,
    initialClosingTime,
    initialMenuOnlyMode,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const onlineActive = GUEST_ONLINE_CARD_PAYMENT_AVAILABLE && onlinePaymentEnabled;
    if (!onlineActive && !payAtTableCardEnabled && !payAtTableCashEnabled) {
      toast.error(
        GUEST_ONLINE_CARD_PAYMENT_AVAILABLE
          ? "Choose at least one payment option: pay online, card at table, or cash."
          : "Choose at least one payment option: card at table or cash (pay online is not available yet)."
      );
      return;
    }
    let prepTimeEstimateMinutes: number | null = null;
    if (prepTimeMinutes.trim() !== "") {
      const n = parseInt(prepTimeMinutes.trim(), 10);
      if (!Number.isFinite(n) || n < 1 || n > 300) {
        toast.error("Prep time must be between 1 and 300 minutes, or leave the field blank.");
        return;
      }
      prepTimeEstimateMinutes = n;
    }
    let vatRateValue: number = 0;
    if (vatRate.trim() !== "") {
      const n = parseInt(vatRate.trim(), 10);
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        toast.error("VAT rate must be between 0 and 100, or leave blank for 0%.");
        return;
      }
      vatRateValue = n;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/dashboard/restaurant", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          logoUrl: logoUrl.trim() || null,
          primaryColor: (primaryColor || "").trim() || null,
          colorMode,
          waiterRelayEnabled,
          navLabelOrdersQueue: navLabelOrders.trim() || null,
          navLabelGuestOrders: navLabelGuest.trim() || null,
          onlinePaymentEnabled: GUEST_ONLINE_CARD_PAYMENT_AVAILABLE && onlinePaymentEnabled,
          payAtTableCardEnabled,
          payAtTableCashEnabled,
          prepTimeEstimateMinutes,
          vatRate: vatRateValue,
          timezone,
          pauseMessage: pauseMessage.trim() || null,
          openingTime: openingTime && closingTime ? openingTime : null,
          closingTime: openingTime && closingTime ? closingTime : null,
          menuOnlyMode,
        }),
      });
      const text = await res.text();
      let data: { error?: string } = {};
      try {
        if (text) data = JSON.parse(text) as { error?: string };
      } catch {
        const hint = text.includes("Failed to compile") || text.includes("<!DOCTYPE")
          ? "Server error — check the terminal running npm run dev."
          : text.slice(0, 280).trim() || "Could not read error from server.";
        setMessage({ type: "err", text: hint });
        toast.error("Failed to save");
        return;
      }
      if (!res.ok) {
        const err = data.error ?? `Failed to save (${res.status})`;
        setMessage({ type: "err", text: err });
        toast.error(err);
        return;
      }
      setMessage({ type: "ok", text: "Saved. Theme and logo will update across the app." });
      toast.success("Options saved");
      router.refresh();
    } catch {
      setMessage({ type: "err", text: "Request failed" });
      toast.error("Request failed");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.set("logo", file);
      const res = await fetch("/api/dashboard/restaurant/logo", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const text = await res.text();
      let data: { error?: string; logoUrl?: string } = {};
      try {
        if (text) data = JSON.parse(text);
      } catch {}
      if (!res.ok) {
        const err = data.error ?? "Upload failed";
        setMessage({ type: "err", text: err });
        toast.error(err);
        return;
      }
      if (data.logoUrl) {
        setLogoUrl(data.logoUrl);
        setMessage({ type: "ok", text: "Logo uploaded. Tap Save options to keep changes." });
        toast.success("Logo uploaded — save options to apply");
      }
    } catch {
      setMessage({ type: "err", text: "Upload failed" });
      toast.error("Upload failed");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const displayLogoUrl = logoUrl.startsWith("/") ? `${typeof window !== "undefined" ? window.location.origin : ""}${logoUrl}` : logoUrl;

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-8">
      {message && (
        <div
          className={`rounded-2xl px-5 py-4 text-base ${
            message.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Theme color – preset swatches + optional custom */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-ink mb-1">Theme colour</h2>
        <p className="text-ink-muted mb-4 text-sm">Tap a colour. Used on the customer menu and this dashboard.</p>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-5 sm:gap-3">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.hex}
              type="button"
              onClick={() => {
                setPrimaryColor(preset.hex);
                setShowCustomColor(false);
              }}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 p-1.5 transition-all touch-manipulation sm:aspect-auto sm:min-h-[4.25rem] sm:p-2.5 ${
                (primaryColor || "").toUpperCase() === preset.hex.toUpperCase()
                  ? "border-ink ring-2 ring-primary/30"
                  : "border-border hover:border-primary/40"
              }`}
              title={`${preset.name} (${preset.hex})`}
              aria-label={`${preset.name}, ${preset.hex}`}
            >
              <span
                className="h-9 w-9 shrink-0 rounded-full shadow-inner ring-1 ring-black/10 sm:h-10 sm:w-10"
                style={{ backgroundColor: preset.hex }}
              />
              <span className="hidden w-full truncate text-center text-[10px] font-semibold leading-none text-ink min-[420px]:block sm:text-xs">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowCustomColor(!showCustomColor)}
            className="min-h-[44px] px-1 text-sm font-semibold text-primary hover:underline"
          >
            {showCustomColor ? "Hide custom colour" : "Choose custom colour"}
          </button>
          {showCustomColor && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                type="color"
                value={primaryColor || "#C15C2A"}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-14 h-14 rounded-xl border-2 border-border cursor-pointer bg-card"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#C15C2A"
                className="rounded-xl border-2 border-border px-4 py-2.5 text-ink font-mono text-sm w-32 focus:border-primary focus:outline-none bg-card"
              />
            </div>
          )}
        </div>
      </div>

      {/* Light / Dark mode */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-ink mb-1">Appearance</h2>
        <p className="text-ink-muted mb-4 text-sm">Light or dark background for the customer menu and this dashboard.</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setColorMode("light")}
            className={`flex-1 min-h-[52px] rounded-2xl border-2 py-4 px-4 text-center font-semibold transition-all touch-manipulation ${
              colorMode === "light"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-surface text-ink hover:border-primary/30"
            }`}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => setColorMode("dark")}
            className={`flex-1 min-h-[52px] rounded-2xl border-2 py-4 px-4 text-center font-semibold transition-all touch-manipulation ${
              colorMode === "dark"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-surface text-ink hover:border-primary/30"
            }`}
          >
            Dark
          </button>
        </div>
      </div>

      {/* Wait staff → kitchen relay */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-ink mb-1">Order routing</h2>
        <p className="text-ink-muted mb-4 text-sm">
          Choose whether guests&apos; orders stop at <strong>Wait staff</strong> first (then you send them to the
          kitchen), or go straight to <strong>Orders</strong> for the kitchen.
        </p>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface/40 px-4 py-3.5">
          <input
            type="checkbox"
            checked={waiterRelayEnabled}
            onChange={(e) => setWaiterRelayEnabled(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
          />
          <span className="text-sm text-ink">
            <span className="font-semibold">Send new orders to wait staff first</span>
            <span className="mt-1 block text-ink-muted">
              Wait staff use the <strong>Waiter</strong> tab, then send orders to prep. Orders placed from that tab
              while signed in skip this step and go straight to prep. Add role <code className="text-xs">waiter</code> or
              demo <strong>waiter@demo.com</strong> after seeding.
            </span>
          </span>
        </label>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-ink mb-1">Prep time on guest order page</h2>
        <p className="text-ink-muted mb-4 text-sm">
          After an order is confirmed, guests see a <strong>rough</strong> “minutes remaining” estimate. It starts from
          your baseline and <strong>adds a little extra time</strong> when other tables already have open tickets in the
          kitchen queue or many tables are busy at once (still not a guarantee). Leave blank to hide. For drinks-only
          orders, turn on <strong>Quick to serve</strong> on those menu items so guests see a short message instead of a
          long timer.
        </p>
        <label className="block">
          <span className="text-sm font-medium text-ink">Typical prep time (minutes)</span>
          <input
            type="number"
            min={1}
            max={300}
            inputMode="numeric"
            placeholder="e.g. 20"
            value={prepTimeMinutes}
            onChange={(e) => setPrepTimeMinutes(e.target.value)}
            className="mt-2 w-full max-w-xs rounded-xl border-2 border-border bg-card px-4 py-2.5 text-ink focus:border-primary focus:outline-none"
          />
          <span className="mt-1 block text-xs text-ink-muted">1–300 minutes, or clear the field to disable.</span>
        </label>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-ink mb-1">VAT rate</h2>
        <p className="text-ink-muted mb-4 text-sm">
          Enter your venue&apos;s VAT rate as a whole number (e.g. <strong className="text-ink">19</strong> for 19%).
          Menu prices are treated as VAT-inclusive. The printed full-order ticket and bill settlement view will show a
          breakdown: <em>Subtotal (excl. VAT)</em>, <em>VAT %</em>, and <em>Total (incl. VAT)</em>. Leave blank or set
          to 0 to show the breakdown with 0% VAT.
        </p>
        <label className="block">
          <span className="text-sm font-medium text-ink">VAT rate (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            inputMode="numeric"
            placeholder="e.g. 19"
            value={vatRate}
            onChange={(e) => setVatRate(e.target.value)}
            className="mt-2 w-full max-w-xs rounded-xl border-2 border-border bg-card px-4 py-2.5 text-ink focus:border-primary focus:outline-none"
          />
          <span className="mt-1 block text-xs text-ink-muted">0–100, or leave blank for 0%.</span>
        </label>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-ink mb-1">Restaurant timezone</h2>
        <p className="text-ink-muted mb-4 text-sm">
          Used for time-scheduled menu categories (e.g. show Breakfast only 9–12). Set this to your restaurant&apos;s local timezone.
        </p>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full max-w-xs rounded-xl border-2 border-border bg-card px-4 py-2.5 text-ink focus:border-primary focus:outline-none"
        >
          <option value="Europe/Athens">Europe/Athens (EET/EEST)</option>
          <option value="Europe/Nicosia">Europe/Nicosia (EET/EEST)</option>
          <option value="Europe/London">Europe/London (GMT/BST)</option>
          <option value="Europe/Berlin">Europe/Berlin (CET/CEST)</option>
          <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
          <option value="Europe/Rome">Europe/Rome (CET/CEST)</option>
          <option value="Europe/Madrid">Europe/Madrid (CET/CEST)</option>
          <option value="Europe/Istanbul">Europe/Istanbul (TRT)</option>
          <option value="America/New_York">America/New_York (ET)</option>
          <option value="America/Chicago">America/Chicago (CT)</option>
          <option value="America/Los_Angeles">America/Los_Angeles (PT)</option>
          <option value="Asia/Dubai">Asia/Dubai (GST)</option>
          <option value="Asia/Nicosia">Asia/Nicosia</option>
          <option value="UTC">UTC</option>
        </select>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-ink mb-1">Ordering paused — custom message</h2>
        <p className="text-ink-muted mb-4 text-sm">
          When you pause ordering, guests see this message instead of the generic screen. Leave blank to keep the default.
        </p>
        <textarea
          value={pauseMessage}
          onChange={(e) => setPauseMessage(e.target.value.slice(0, 200))}
          rows={3}
          placeholder="e.g. Kitchen is very busy — please ask your waiter to order for you."
          className="w-full rounded-xl border-2 border-border bg-card px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted/50 focus:border-primary focus:outline-none resize-none"
        />
        <p className="mt-1 text-xs text-ink-muted">{pauseMessage.length}/200</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-ink mb-1">Opening hours</h2>
        <p className="text-ink-muted mb-4 text-sm">
          Outside these hours the guest menu shows a &ldquo;We&rsquo;re closed&rdquo; screen automatically. Leave blank for no restriction.
          Both fields must be filled — set the same time to disable.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Opens at</span>
            <input
              type="time"
              value={openingTime}
              onChange={(e) => setOpeningTime(e.target.value)}
              className="rounded-xl border-2 border-border bg-card px-4 py-2.5 text-ink focus:border-primary focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Closes at</span>
            <input
              type="time"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              className="rounded-xl border-2 border-border bg-card px-4 py-2.5 text-ink focus:border-primary focus:outline-none"
            />
          </label>
          {(openingTime || closingTime) ? (
            <button
              type="button"
              onClick={() => { setOpeningTime(""); setClosingTime(""); }}
              className="text-xs text-ink-muted underline hover:text-red-600 pb-2.5"
            >
              Clear hours
            </button>
          ) : null}
        </div>
        {openingTime && closingTime ? (
          <p className="mt-2 text-xs text-emerald-600">
            Active — guests can order between {openingTime} and {closingTime}
            {closingTime < openingTime ? " (overnight)" : ""}.
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-ink mb-1">Menu-only mode</h2>
        <p className="text-ink-muted mb-4 text-sm">
          When enabled, guests can browse the full menu but all ordering buttons are hidden. Staff ordering from the dashboard is unaffected.
        </p>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface/40 px-4 py-3.5">
          <input
            type="checkbox"
            checked={menuOnlyMode}
            onChange={(e) => setMenuOnlyMode(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
          />
          <span className="text-sm text-ink">
            <span className="font-semibold">Browse-only — hide ordering for guests</span>
            <span className="mt-1 block text-ink-muted">
              No &ldquo;Add to cart&rdquo; or order buttons will appear on the guest menu.
            </span>
          </span>
        </label>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-ink mb-1">Guest payments</h2>
        <p className="text-ink-muted mb-4 text-sm">
          {GUEST_ONLINE_CARD_PAYMENT_AVAILABLE
            ? "Choose how customers pay. Online card uses Stripe when your server has the keys; otherwise use pay-at-table options only."
            : "Choose how customers pay on the menu."}
        </p>
        <div className="space-y-3">
          <label
            className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 ${
              GUEST_ONLINE_CARD_PAYMENT_AVAILABLE
                ? "cursor-pointer border-border bg-surface/40"
                : "cursor-not-allowed border-border/60 bg-surface/50 text-ink-muted"
            }`}
          >
            <input
              type="checkbox"
              checked={GUEST_ONLINE_CARD_PAYMENT_AVAILABLE && onlinePaymentEnabled}
              disabled={!GUEST_ONLINE_CARD_PAYMENT_AVAILABLE}
              onChange={(e) => setOnlinePaymentEnabled(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span className="text-sm">
              <span className={`font-semibold ${GUEST_ONLINE_CARD_PAYMENT_AVAILABLE ? "text-ink" : "text-ink-muted"}`}>
                Pay online with card (Stripe)
              </span>
              {GUEST_ONLINE_CARD_PAYMENT_AVAILABLE ? (
                <span className="mt-1 block text-ink-muted">
                  Guest pays in the browser before the order is confirmed. Requires <code className="text-xs">STRIPE_SECRET_KEY</code> and{" "}
                  <code className="text-xs">NEXT_PUBLIC_APP_URL</code> in your environment.
                </span>
              ) : (
                <span className="mt-1 block text-sm text-ink-muted">Not available yet.</span>
              )}
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface/40 px-4 py-3.5">
            <input
              type="checkbox"
              checked={payAtTableCardEnabled}
              onChange={(e) => setPayAtTableCardEnabled(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
            />
            <span className="text-sm text-ink">
              <span className="font-semibold">Card at table</span>
              <span className="mt-1 block text-ink-muted">
                Guest chooses “Card” on the menu (terminal / reader at the table — you collect payment outside this app).
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface/40 px-4 py-3.5">
            <input
              type="checkbox"
              checked={payAtTableCashEnabled}
              onChange={(e) => setPayAtTableCashEnabled(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
            />
            <span className="text-sm text-ink">
              <span className="font-semibold">Cash</span>
              <span className="mt-1 block text-ink-muted">Guest chooses “Cash” and pays staff at the table.</span>
            </span>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-ink mb-1">Dashboard screen names</h2>
        <p className="text-ink-muted mb-4 text-sm">
          Rename the two main staff areas in the top navigation (defaults: <strong>Orders</strong> and{" "}
          <strong>Waiter</strong>). Handy for bars, clubs, or beach venues — e.g. &quot;Bar prep&quot; / &quot;Floor&quot;.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Prep / active orders screen</label>
            <input
              type="text"
              value={navLabelOrders}
              onChange={(e) => setNavLabelOrders(e.target.value.slice(0, 32))}
              placeholder="Orders"
              className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-ink placeholder:text-ink-muted/70 focus:border-primary focus:outline-none text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Waiter tab</label>
            <input
              type="text"
              value={navLabelGuest}
              onChange={(e) => setNavLabelGuest(e.target.value.slice(0, 32))}
              placeholder="Waiter"
              className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-ink placeholder:text-ink-muted/70 focus:border-primary focus:outline-none text-base"
            />
          </div>
        </div>
      </div>

      {/* Logo – upload + optional link */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-ink mb-1">Logo</h2>
        <p className="text-ink-muted mb-4 text-sm">Shown on the customer menu. Upload from your tablet or paste a link.</p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleLogoUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingLogo}
          className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 px-4 py-6 text-base font-semibold text-primary touch-manipulation disabled:opacity-50"
        >
          {uploadingLogo ? (
            <>
              <Spinner className="h-5 w-5 border-primary border-t-transparent" />
              Uploading…
            </>
          ) : (
            "Upload image from device"
          )}
        </button>

        <p className="text-center text-ink-muted text-sm mt-3">or paste a link</p>
        <input
          type="text"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://…"
          className="mt-2 w-full rounded-xl border-2 border-black/10 px-4 py-3.5 text-ink placeholder:text-ink-muted/70 focus:border-primary focus:outline-none text-base"
        />

        {logoUrl.trim() && (
          <div className="mt-4">
            <p className="text-sm font-medium text-ink-muted mb-2">Preview</p>
            <img
              src={displayLogoUrl}
              alt="Logo preview"
              className="h-14 w-auto max-w-full object-contain object-left rounded-lg bg-black/5 p-2"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      {/* Restaurant name */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-ink mb-1">Restaurant name</h2>
        <p className="text-ink-muted mb-4 text-sm">Shown in the dashboard and on the customer menu.</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your restaurant name"
          className="w-full rounded-xl border-2 border-border px-4 py-3.5 text-ink placeholder:text-ink-muted/70 focus:border-primary focus:outline-none text-base bg-card"
        />
      </div>

      <LanguageConfigSection />

      <button
        type="submit"
        disabled={saving}
        className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-lg font-semibold text-white shadow-sm ring-1 ring-black/10 touch-manipulation disabled:opacity-50"
      >
        {saving ? (
          <>
            <Spinner className="h-5 w-5 border-white border-t-transparent" />
            Saving…
          </>
        ) : (
          "Save options"
        )}
      </button>
    </form>
  );
}

function LanguageConfigSection() {
  const [unlocked, setUnlocked] = useState(false);
  const [secret, setSecret] = useState("");
  const [secretConfigured, setSecretConfigured] = useState(true);
  const [enabledLocales, setEnabledLocales] = useState<string[]>([]);
  const [defaultLocale, setDefaultLocale] = useState("el");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/restaurant/languages");
      if (!res.ok) return;
      const d = await res.json() as { enabledLocales: string[]; defaultLocale: string; secretConfigured: boolean };
      setEnabledLocales(d.enabledLocales ?? []);
      setDefaultLocale(d.defaultLocale ?? "el");
      setSecretConfigured(d.secretConfigured ?? false);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleUnlock = () => {
    if (secret.trim()) setUnlocked(true);
    else toast.error("Enter the language unlock secret.");
  };

  const toggleLocale = (code: string) => {
    setEnabledLocales((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSave = async () => {
    if (enabledLocales.length > 0 && !enabledLocales.includes(defaultLocale)) {
      toast.error("The default language must be in the enabled list.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/restaurant/languages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: secret.trim(), enabledLocales, defaultLocale }),
      });
      const t = await res.text();
      let d: { error?: string } = {};
      try { if (t) d = JSON.parse(t); } catch { /* ignore */ }
      if (!res.ok) { toast.error(d.error ?? "Failed to save"); return; }
      toast.success("Languages saved");
      setUnlocked(false);
      setSecret("");
      await load();
    } catch { toast.error("Request failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-base font-semibold text-ink mb-1">Guest menu languages</h2>
      <p className="text-sm text-ink-muted mb-4">
        Choose which languages guests can switch between on the menu. Translations are generated from the
        default language via Google Translate when you click <strong className="text-ink">Translate</strong>{" "}
        on a menu item. Requires <code className="rounded bg-surface px-1 text-xs">LANGUAGE_UNLOCK_SECRET</code> to change.
      </p>

      {enabledLocales.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {enabledLocales.map((code) => {
            const loc = SUPPORTED_LOCALES.find((l) => l.code === code);
            return loc ? (
              <span key={code} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {loc.flag} {loc.nativeName}
                {code === defaultLocale && <span className="ml-1 text-[10px] opacity-70">(default)</span>}
              </span>
            ) : null;
          })}
        </div>
      )}

      {!secretConfigured ? (
        <p className="text-sm text-ink-muted rounded-xl border border-dashed border-border bg-surface/50 p-4">
          Set <code className="rounded bg-surface px-1 text-xs">LANGUAGE_UNLOCK_SECRET</code> in your server environment to enable language management.
        </p>
      ) : !unlocked ? (
        <div className="flex flex-wrap gap-2">
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Language unlock secret"
            className="flex-1 min-w-[200px] rounded-xl border-2 border-border bg-card px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={handleUnlock}
            className="rounded-xl border-2 border-primary/40 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
          >
            Unlock to change
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-ink mb-2">Enabled languages</p>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_LOCALES.map((loc) => (
                <button
                  key={loc.code}
                  type="button"
                  onClick={() => toggleLocale(loc.code)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors ${
                    enabledLocales.includes(loc.code)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-ink-muted hover:border-primary/30"
                  }`}
                >
                  <span>{loc.flag}</span>
                  <span>{loc.nativeName}</span>
                </button>
              ))}
            </div>
          </div>

          {enabledLocales.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Default language (source for translations)</label>
              <select
                value={defaultLocale}
                onChange={(e) => setDefaultLocale(e.target.value)}
                className="rounded-xl border-2 border-border bg-card px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
              >
                {enabledLocales.map((code) => {
                  const loc = SUPPORTED_LOCALES.find((l) => l.code === code);
                  return loc ? <option key={code} value={code}>{loc.flag} {loc.nativeName}</option> : null;
                })}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save languages"}
            </button>
            <button
              type="button"
              onClick={() => { setUnlocked(false); setSecret(""); void load(); }}
              className="rounded-xl border-2 border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
