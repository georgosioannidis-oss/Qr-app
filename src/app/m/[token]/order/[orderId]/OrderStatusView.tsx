"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";

type StatusCopyRow = { title: string; message: string; icon: string };

const STATUS_COPY: Record<string, StatusCopyRow> = {
  pending: {
    title: "Order received",
    message: "Complete payment to confirm. You can pay at the table or online.",
    icon: "⏳",
  },
  paid: {
    title: "Order accepted",
    message: "The kitchen has your order and will start preparing it shortly.",
    icon: "✓",
  },
  preparing: {
    title: "Preparing your order",
    message: "The kitchen is making your food. We’ll notify you when it’s ready.",
    icon: "👨‍🍳",
  },
  ready: {
    title: "Ready for pickup",
    message: "Your order is ready! Your server will bring it to your table shortly.",
    icon: "🔔",
  },
  delivered: {
    title: "Delivered",
    message: "Your order has been brought to your table. Enjoy your meal!",
    icon: "✓",
  },
  declined: {
    title: "Order declined",
    message:
      "The restaurant could not take this order. If you already paid online, contact the staff or check your payment provider.",
    icon: "—",
  },
};

function prepCountdownMessage(
  status: string,
  orderCreatedAtIso: string | null,
  prepMinutes: number | null,
  nowMs: number
): string | null {
  if (
    prepMinutes == null ||
    prepMinutes < 1 ||
    !orderCreatedAtIso ||
    (status !== "paid" && status !== "preparing")
  ) {
    return null;
  }
  const start = new Date(orderCreatedAtIso).getTime();
  if (!Number.isFinite(start)) return null;
  const target = start + prepMinutes * 60_000;
  const remainingMs = target - nowMs;
  if (remainingMs <= 0) {
    return "Your order should be ready soon (estimate).";
  }
  const minsLeft = Math.max(1, Math.ceil(remainingMs / 60_000));
  return minsLeft === 1
    ? "About 1 minute remaining (estimate)."
    : `About ${minsLeft} minutes remaining (estimate).`;
}

type ReceiptItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  optionsSummary?: string;
};

function formatEur(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function DigitalReceipt({
  items,
  totalAmount,
  vatRate,
  paymentPreference,
  stripeSessionId,
  orderCreatedAtIso,
  restaurantName,
  tableName,
}: {
  items: ReceiptItem[];
  totalAmount: number;
  vatRate: number;
  paymentPreference?: string;
  stripeSessionId?: string;
  orderCreatedAtIso: string;
  restaurantName: string;
  tableName: string;
}) {
  const [open, setOpen] = useState(false);

  const payMethod = stripeSessionId
    ? "Online card"
    : paymentPreference === "card"
    ? "Card at table"
    : paymentPreference === "cash"
    ? "Cash"
    : null;

  const vatAmount = vatRate > 0 ? Math.round(totalAmount - totalAmount / (1 + vatRate / 100)) : 0;
  const netAmount = totalAmount - vatAmount;

  return (
    <div className="mt-4 w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-ink hover:bg-card transition-colors"
      >
        <span>View receipt</span>
        <span className="text-ink-muted text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-2 rounded-2xl border border-border bg-card p-5 text-left text-sm space-y-3">
          <div className="text-center pb-2 border-b border-border">
            <p className="font-bold text-ink">{restaurantName}</p>
            <p className="text-ink-muted text-xs">{tableName} · {formatDateTime(orderCreatedAtIso)}</p>
          </div>
          <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={i} className="flex justify-between gap-2">
                <div>
                  <span className="font-medium text-ink">{item.quantity}× {item.name}</span>
                  {item.optionsSummary && (
                    <span className="block text-xs text-ink-muted">{item.optionsSummary}</span>
                  )}
                </div>
                <span className="font-medium text-ink tabular-nums shrink-0">
                  {formatEur(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-border pt-3 space-y-1">
            {vatRate > 0 && (
              <>
                <div className="flex justify-between text-xs text-ink-muted">
                  <span>Subtotal (excl. VAT {vatRate}%)</span>
                  <span className="tabular-nums">{formatEur(netAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-ink-muted">
                  <span>VAT {vatRate}%</span>
                  <span className="tabular-nums">{formatEur(vatAmount)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-bold text-ink text-base">
              <span>Total</span>
              <span className="tabular-nums">{formatEur(totalAmount)}</span>
            </div>
            {payMethod && (
              <p className="text-xs text-ink-muted pt-1">Payment: {payMethod}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function OrderStatusView({
  orderId,
  tableToken,
  tableName,
  restaurantName,
  restaurantLogoUrl,
  paidSuccess = false,
  totalAmount,
  paymentPreference,
  stripeSessionId,
  vatRate = 0,
  orderCreatedAtIso,
  receiptItems = [],
}: {
  orderId: string;
  tableToken: string;
  tableName: string;
  restaurantName: string;
  restaurantLogoUrl?: string;
  paidSuccess?: boolean;
  totalAmount?: number;
  paymentPreference?: string;
  stripeSessionId?: string;
  vatRate?: number;
  orderCreatedAtIso?: string;
  receiptItems?: ReceiptItem[];
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [orderCreatedAt, setOrderCreatedAt] = useState<string | null>(null);
  const [prepTimeEstimateMinutes, setPrepTimeEstimateMinutes] = useState<number | null>(null);
  const [prepTimeQuickOrder, setPrepTimeQuickOrder] = useState(false);
  const [waiterRelayPending, setWaiterRelayPending] = useState(false);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);

  const statusCopy = useMemo(() => {
    if (waiterRelayPending) {
      return {
        title: "Waiting for staff",
        message:
          "Your order was received. A team member still needs to confirm it and send it to the kitchen. This page updates automatically.",
        icon: "🙋",
      };
    }
    const s = status ?? "pending";
    return STATUS_COPY[s] ?? STATUS_COPY.pending;
  }, [status, waiterRelayPending]);

  const prepEtaLine = useMemo(() => {
    if (waiterRelayPending) return null;
    const s = status ?? "pending";
    return prepCountdownMessage(s, orderCreatedAt, prepTimeEstimateMinutes, Date.now());
  }, [status, orderCreatedAt, prepTimeEstimateMinutes, tick, waiterRelayPending]);

  const prepQuickLine = useMemo(() => {
    if (waiterRelayPending) return null;
    const s = status ?? "pending";
    if (!prepTimeQuickOrder || (s !== "paid" && s !== "preparing")) return null;
    return "Simple orders like drinks are usually brought out very soon.";
  }, [status, prepTimeQuickOrder, waiterRelayPending]);

  /** Class names matched by injected CSS in `m/[token]/layout.tsx` (per data-theme) so color never ends up white-on-white. */
  const statusIconClass = useMemo(() => {
    if (waiterRelayPending) return "order-status-icon--pending";
    const s = status ?? "pending";
    const map: Record<string, string> = {
      pending: "order-status-icon--pending",
      paid: "order-status-icon--paid",
      preparing: "order-status-icon--preparing",
      ready: "order-status-icon--ready",
      delivered: "order-status-icon--delivered",
      declined: "order-status-icon--declined",
    };
    return map[s] ?? map.pending;
  }, [status, waiterRelayPending]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/orders/${orderId}/status?tableToken=${encodeURIComponent(tableToken)}`
      );
      if (res.status === 404) {
        setError(true);
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as {
        status?: string;
        orderCreatedAt?: string;
        prepTimeEstimateMinutes?: number | null;
        prepTimeQuickOrder?: boolean;
        waiterRelayPending?: boolean;
      };
      if (typeof data.status === "string") setStatus(data.status);
      if (typeof data.orderCreatedAt === "string") setOrderCreatedAt(data.orderCreatedAt);
      const pm = data.prepTimeEstimateMinutes;
      setPrepTimeEstimateMinutes(typeof pm === "number" && pm > 0 ? pm : null);
      setPrepTimeQuickOrder(data.prepTimeQuickOrder === true);
      setWaiterRelayPending(data.waiterRelayPending === true);
    } catch {
      setError(true);
    }
  }, [orderId, tableToken]);

  useEffect(() => {
    void fetchStatus();
    const interval = setInterval(() => void fetchStatus(), 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    const s = status;
    if (
      waiterRelayPending ||
      prepTimeEstimateMinutes == null ||
      !orderCreatedAt ||
      (s !== "paid" && s !== "preparing")
    ) {
      return;
    }
    const t = setInterval(() => setTick((x) => x + 1), 15000);
    return () => clearInterval(t);
  }, [status, prepTimeEstimateMinutes, orderCreatedAt, waiterRelayPending]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface">
        <div className="max-w-sm w-full text-center bg-card rounded-3xl shadow-lg border border-border p-8">
          <p className="text-ink-muted font-medium">Order not found.</p>
          <Link
            href={`/m/${tableToken}`}
            className="mt-4 inline-block min-h-[44px] leading-[44px] text-primary font-semibold hover:underline"
          >
            Back to menu
          </Link>
        </div>
      </div>
    );
  }

  const displayStatus = waiterRelayPending ? "waiting for staff" : (status ?? "pending");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface">
      <div className="max-w-sm w-full text-center bg-card rounded-3xl shadow-lg border border-border p-8">
        {paidSuccess && (
          <p className="mb-4 rounded-xl border border-border bg-primary/[0.06] px-3 py-2 text-sm text-ink">
            {waiterRelayPending
              ? "Payment received. A staff member still needs to confirm your order."
              : "Payment successful. Your order was sent."}
          </p>
        )}
        {restaurantLogoUrl && (
          <img
            src={restaurantLogoUrl}
            alt=""
            className="h-10 w-auto mx-auto mb-3 object-contain"
          />
        )}
        <p className="text-sm text-ink-muted mb-1">
          {restaurantName} · {tableName}
        </p>
        {status != null ? (
          <>
            <div
              className={`order-status-icon w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 ${statusIconClass}`}
            >
              {statusCopy.icon}
            </div>
            <h1 className="order-status-heading text-xl font-bold text-ink mb-2">{statusCopy.title}</h1>
            <p className="order-status-message text-ink-muted mb-6">{statusCopy.message}</p>
            {prepQuickLine ? (
              <p className="order-status-eta -mt-2 mb-6 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm font-medium text-ink">
                {prepQuickLine}
              </p>
            ) : prepEtaLine ? (
              <div className="order-status-eta -mt-2 mb-6 space-y-1.5 text-left">
                <p className="rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm font-medium text-ink">
                  {prepEtaLine}
                </p>
                <p className="text-xs leading-relaxed text-ink-muted px-0.5">
                  Rough guide for meals being prepared. Drinks and other simple items are often much quicker.
                </p>
              </div>
            ) : null}
            <p className="order-status-label text-xs font-semibold text-ink uppercase tracking-wide mb-6">
              Status: {displayStatus}
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center text-2xl mx-auto mb-4 animate-pulse">
              …
            </div>
            <p className="text-ink-muted">Loading order status…</p>
          </>
        )}
        <Link
          href={`/m/${tableToken}`}
          className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-center shadow-sm ring-1 ring-black/10"
        >
          Back to menu
        </Link>
        {receiptItems.length > 0 &&
          totalAmount != null &&
          orderCreatedAtIso != null &&
          ["paid", "preparing", "ready", "delivered"].includes(status ?? "") && (
            <DigitalReceipt
              items={receiptItems}
              totalAmount={totalAmount}
              vatRate={vatRate}
              paymentPreference={paymentPreference}
              stripeSessionId={stripeSessionId}
              orderCreatedAtIso={orderCreatedAtIso}
              restaurantName={restaurantName}
              tableName={tableName}
            />
          )}
      </div>
    </div>
  );
}
