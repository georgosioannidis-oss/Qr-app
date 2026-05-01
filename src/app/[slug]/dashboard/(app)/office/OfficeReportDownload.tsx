"use client";

import { useState } from "react";
import { toast } from "sonner";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function firstDayOfMonthISO() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export function OfficeReportDownload() {
  const [from, setFrom] = useState(firstDayOfMonthISO());
  const [to, setTo] = useState(todayISO());
  const [loading, setLoading] = useState(false);

  const download = async () => {
    if (!from || !to || from > to) {
      toast.error("Pick a valid date range.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/dashboard/office/report?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
      if (!res.ok) {
        const t = await res.text();
        let msg = `Failed (${res.status})`;
        try {
          msg = (JSON.parse(t) as { error?: string }).error ?? msg;
        } catch { /* ignore */ }
        toast.error(msg);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${from}-to-${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-base font-semibold text-ink mb-1">Accountant report</h2>
      <p className="text-sm text-ink-muted mb-4">
        Downloads a CSV with quantity sold, gross revenue, subtotal excl. VAT, and VAT amount per menu item for the
        chosen period. Only confirmed orders are included. Open in Excel or Google Sheets.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">From</span>
          <input
            type="date"
            value={from}
            max={to || todayISO()}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl border-2 border-border bg-card px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">To</span>
          <input
            type="date"
            value={to}
            min={from}
            max={todayISO()}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-xl border-2 border-border bg-card px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={download}
          disabled={loading}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
        >
          {loading ? "Downloading…" : "Download CSV"}
        </button>
      </div>
    </section>
  );
}
