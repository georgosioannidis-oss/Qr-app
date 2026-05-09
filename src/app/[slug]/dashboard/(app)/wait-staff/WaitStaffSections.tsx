"use client";

import { useCallback, useEffect, useRef, useState } from "react";

let sharedAudioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  try {
    if (!sharedAudioCtx) sharedAudioCtx = new AudioContext();
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

async function playWaiterCallAlert() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") await ctx.resume();
    const now = ctx.currentTime;
    // Ascending tones: 440 → 660 → 880 Hz
    [[440, 0], [660, 0.18], [880, 0.36]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq!;
      osc.type = "sine";
      gain.gain.setValueAtTime(0, now + delay!);
      gain.gain.linearRampToValueAtTime(0.35, now + delay! + 0.04);
      gain.gain.linearRampToValueAtTime(0, now + delay! + 0.22);
      osc.start(now + delay!);
      osc.stop(now + delay! + 0.25);
    });
  } catch {
    /* audio not available */
  }
}

async function playBillRequestAlert() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") await ctx.resume();
    const now = ctx.currentTime;
    // Descending tones: 880 → 660 → 440 Hz — distinct from waiter call
    [[880, 0], [660, 0.2], [440, 0.4]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq!;
      osc.type = "sine";
      gain.gain.setValueAtTime(0, now + delay!);
      gain.gain.linearRampToValueAtTime(0.28, now + delay! + 0.04);
      gain.gain.linearRampToValueAtTime(0, now + delay! + 0.24);
      osc.start(now + delay!);
      osc.stop(now + delay! + 0.27);
    });
  } catch {
    /* audio not available */
  }
}
import { WaitStaffBillSettlement } from "./WaitStaffBillSettlement";
import { WaitStaffQueue } from "./WaitStaffQueue";
import { WaitStaffTablePicker } from "./WaitStaffTablePicker";

const SECTIONS = [
  {
    id: "incoming" as const,
    label: "Incoming",
    hint: "Guest orders waiting for you. Accept to send to the kitchen, or decline if you can't take them.",
  },
  {
    id: "tables" as const,
    label: "Take order manually",
    hint: "Open a table's guest menu in a new tab and place items for the guest.",
  },
  {
    id: "bills" as const,
    label: "Collect payment",
    hint: "Check each line as the table pays, or mark the whole bill at once. Tickets leave this list when every line is paid.",
  },
];

type SectionId = (typeof SECTIONS)[number]["id"];

export function WaitStaffSections() {
  const [tab, setTab] = useState<SectionId>("incoming");
  const [incomingCount, setIncomingCount] = useState<number | null>(null);
  const [waiterCallCount, setWaiterCallCount] = useState<number | null>(null);
  const prevWaiterCallCount = useRef<number | null>(null);
  const [billRequestCount, setBillRequestCount] = useState<number | null>(null);
  const prevBillRequestCount = useRef<number | null>(null);

  useEffect(() => {
    const unlock = () => {
      const ctx = getAudioCtx();
      if (ctx && ctx.state === "suspended") void ctx.resume();
    };
    window.addEventListener("pointerdown", unlock, { once: false });
    window.addEventListener("keydown", unlock, { once: false });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const refreshIncomingCount = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/orders/incoming?countOnly=1");
      if (!res.ok) {
        setIncomingCount(0);
        return;
      }
      const data = (await res.json()) as { count?: number };
      setIncomingCount(typeof data.count === "number" ? data.count : 0);
    } catch {
      setIncomingCount(0);
    }
  }, []);

  const refreshWaiterCallCount = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/wait-staff/waiter-call-count");
      if (!res.ok) {
        setWaiterCallCount(0);
        return;
      }
      const data = (await res.json()) as { count?: number };
      const count = typeof data.count === "number" ? data.count : 0;
      if (prevWaiterCallCount.current !== null && count > prevWaiterCallCount.current) {
        void playWaiterCallAlert();
      }
      prevWaiterCallCount.current = count;
      setWaiterCallCount(count);
    } catch {
      setWaiterCallCount(0);
    }
  }, []);

  const refreshBillRequestCount = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/wait-staff/bill-request-count");
      if (!res.ok) { setBillRequestCount(0); return; }
      const data = (await res.json()) as { count?: number };
      const count = typeof data.count === "number" ? data.count : 0;
      if (prevBillRequestCount.current !== null && count > prevBillRequestCount.current) {
        void playBillRequestAlert();
      }
      prevBillRequestCount.current = count;
      setBillRequestCount(count);
    } catch {
      setBillRequestCount(0);
    }
  }, []);

  useEffect(() => {
    void refreshIncomingCount();
    const t = setInterval(refreshIncomingCount, 3000);
    return () => clearInterval(t);
  }, [refreshIncomingCount]);

  useEffect(() => {
    void refreshWaiterCallCount();
    const t = setInterval(refreshWaiterCallCount, 3000);
    return () => clearInterval(t);
  }, [refreshWaiterCallCount]);

  useEffect(() => {
    void refreshBillRequestCount();
    const t = setInterval(refreshBillRequestCount, 3000);
    return () => clearInterval(t);
  }, [refreshBillRequestCount]);

  useEffect(() => {
    if (tab === "incoming") void refreshIncomingCount();
    if (tab === "tables") { void refreshWaiterCallCount(); void refreshBillRequestCount(); }
  }, [tab, refreshIncomingCount, refreshWaiterCallCount, refreshBillRequestCount]);

  return (
    <div className="space-y-5">
      <div
        className="flex flex-wrap gap-1 rounded-2xl border border-border bg-card p-1 shadow-sm sm:inline-flex sm:flex-nowrap"
        role="tablist"
        aria-label="Waiter areas"
      >
        {SECTIONS.map((s) => {
          const active = tab === s.id;
          const showIncomingBadge =
            s.id === "incoming" && incomingCount !== null && incomingCount > 0;
          const showTablesCallBadge =
            s.id === "tables" && waiterCallCount !== null && waiterCallCount > 0;
          const showBillBadge =
            s.id === "tables" && billRequestCount !== null && billRequestCount > 0;
          const incomingBadgeLabel =
            incomingCount === null || incomingCount < 1
              ? s.label
              : `${s.label}, ${incomingCount} ${incomingCount === 1 ? "order" : "orders"} waiting`;
          const tablesBadgeLabel =
            waiterCallCount === null || waiterCallCount < 1
              ? s.label
              : `${s.label}, ${waiterCallCount} ${waiterCallCount === 1 ? "table" : "tables"} calling`;
          return (
            <button
              key={s.id}
              id={`waiter-tab-${s.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={
                s.id === "incoming"
                  ? incomingBadgeLabel
                  : s.id === "tables"
                    ? tablesBadgeLabel
                    : undefined
              }
              onClick={() => setTab(s.id)}
              className={`min-h-[44px] flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors sm:flex-initial sm:min-w-[8.5rem] ${
                active
                  ? "bg-primary text-white shadow-sm ring-1 ring-black/10"
                  : "text-ink-muted hover:bg-surface hover:text-ink"
              }`}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <span>{s.label}</span>
                {showIncomingBadge ? (
                  <span
                    className="inline-flex min-h-[1.375rem] min-w-[1.375rem] items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold tabular-nums text-white shadow-sm ring-2 ring-white/90"
                    title={`${incomingCount} waiting`}
                    aria-hidden
                  >
                    {incomingCount > 99 ? "99+" : incomingCount}
                  </span>
                ) : null}
                {showTablesCallBadge ? (
                  <span
                    className="inline-flex min-h-[1.375rem] min-w-[1.375rem] items-center justify-center rounded-full bg-violet-600 px-1.5 text-[11px] font-bold tabular-nums text-white shadow-sm ring-2 ring-white/90 dark:ring-white/20"
                    title={`${waiterCallCount} table(s) calling`}
                    aria-hidden
                  >
                    {waiterCallCount! > 99 ? "99+" : waiterCallCount}
                  </span>
                ) : null}
                {showBillBadge ? (
                  <span
                    className="inline-flex min-h-[1.375rem] min-w-[1.375rem] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[11px] font-bold tabular-nums text-white shadow-sm ring-2 ring-white/90 dark:ring-white/20"
                    title={`${billRequestCount} table(s) want the bill`}
                    aria-hidden
                  >
                    {billRequestCount! > 99 ? "99+" : billRequestCount}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-sm leading-relaxed text-ink-muted">
        {SECTIONS.find((s) => s.id === tab)?.hint}
      </p>

      <div role="tabpanel" aria-labelledby={`waiter-tab-${tab}`} className="min-h-[200px]">
        {tab === "tables" ? <WaitStaffTablePicker /> : null}
        {tab === "incoming" ? <WaitStaffQueue /> : null}
        {tab === "bills" ? <WaitStaffBillSettlement /> : null}
      </div>
    </div>
  );
}
