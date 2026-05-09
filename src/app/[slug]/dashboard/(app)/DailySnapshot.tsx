"use client";

import { useEffect, useState, useCallback } from "react";

type Stats = {
  ordersToday: number;
  revenueToday: number;
  ordersYesterday: number;
  revenueYesterday: number;
  busiestHour: string | null;
};

function fmtEur(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function pctChange(today: number, yesterday: number): { label: string; positive: boolean } | null {
  if (yesterday === 0 && today === 0) return null;
  if (yesterday === 0) return { label: "New today", positive: true };
  const pct = Math.round(((today - yesterday) / yesterday) * 100);
  if (pct === 0) return { label: "Same as yesterday", positive: true };
  return {
    label: `${pct > 0 ? "+" : ""}${pct}% vs yesterday`,
    positive: pct >= 0,
  };
}

function Skeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm animate-pulse">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <div className="h-3 w-20 rounded bg-ink/10 mb-3" />
            <div className="h-7 w-16 rounded bg-ink/10 mb-2" />
            <div className="h-3 w-24 rounded bg-ink/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DailySnapshot() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats/today");
      if (!res.ok) return;
      const data = await res.json() as Stats;
      setStats(data);
      setLastUpdated(new Date());
    } catch {
      // silent — don't disrupt the dashboard
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 60_000);
    return () => clearInterval(t);
  }, [refresh]);

  if (loading) return <Skeleton />;
  if (!stats) return null;

  const ordersDiff = pctChange(stats.ordersToday, stats.ordersYesterday);
  const revenueDiff = pctChange(stats.revenueToday, stats.revenueYesterday);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Today at a glance</p>
        {lastUpdated ? (
          <p className="text-[10px] text-ink-muted tabular-nums">
            Updated {lastUpdated.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
        {/* Orders today */}
        <div>
          <p className="text-xs font-medium text-ink-muted">Orders</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-ink">{stats.ordersToday}</p>
          {ordersDiff ? (
            <p className={`mt-1 text-xs font-medium ${ordersDiff.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
              {ordersDiff.positive ? "↑" : "↓"} {ordersDiff.label}
            </p>
          ) : (
            <p className="mt-1 text-xs text-ink-muted">No orders yet</p>
          )}
        </div>

        {/* Revenue today */}
        <div>
          <p className="text-xs font-medium text-ink-muted">Revenue</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-ink">{fmtEur(stats.revenueToday)}</p>
          {revenueDiff ? (
            <p className={`mt-1 text-xs font-medium ${revenueDiff.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
              {revenueDiff.positive ? "↑" : "↓"} {revenueDiff.label}
            </p>
          ) : (
            <p className="mt-1 text-xs text-ink-muted">Confirmed orders</p>
          )}
        </div>

        {/* Busiest hour */}
        <div>
          <p className="text-xs font-medium text-ink-muted">Busiest hour</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-ink">
            {stats.busiestHour ?? "—"}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            {stats.busiestHour ? "Most orders placed" : "No data yet"}
          </p>
        </div>

        {/* Yesterday */}
        <div>
          <p className="text-xs font-medium text-ink-muted">Yesterday</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-ink">{fmtEur(stats.revenueYesterday)}</p>
          <p className="mt-1 text-xs text-ink-muted">{stats.ordersYesterday} confirmed orders</p>
        </div>
      </div>
    </div>
  );
}
