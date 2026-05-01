"use client";

import { useEffect, useState } from "react";

type StationRow = { id: string; name: string; slug: string };

export function PrintAgentSection({ restaurantSlug }: { restaurantSlug: string }) {
  const [stations, setStations] = useState<StationRow[]>([]);

  useEffect(() => {
    fetch("/api/dashboard/stations")
      .then((r) => r.json())
      .then((data: unknown) => {
        if (!Array.isArray(data)) return;
        setStations(
          (data as { id: string; name: string }[]).map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.name.toLowerCase().trim().replace(/\s+/g, "-"),
          }))
        );
      })
      .catch(() => {});
  }, []);

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-base font-semibold text-ink mb-1">Auto-print (kitchen PC)</h2>
      <p className="text-ink-muted text-sm mb-4">
        Run the small <code className="text-xs bg-surface px-1 rounded">print-agent-standalone</code> script on each
        station computer next to its printer. Each copy polls for new orders and prints only that station&apos;s lines.
        Tickets print only after the order is <strong className="text-ink">paid</strong> (or past{" "}
        <code className="text-xs bg-surface px-1 rounded">pending</code>) and, when{" "}
        <strong className="text-ink">wait staff relay</strong> is on, only after someone sends it to the kitchen.
        Staff orders placed from the dashboard skip that relay and print immediately once confirmed.
      </p>
      <p className="text-ink-muted text-sm mb-4">
        The station value in each script is the URL-safe slug of the station name (e.g. station{" "}
        <strong className="text-ink">Cold Kitchen</strong> →{" "}
        <code className="text-xs bg-surface px-1 rounded">cold-kitchen</code>). Only menu items{" "}
        <strong className="text-ink">explicitly assigned</strong> to a station will appear on that station&apos;s
        tickets — unassigned items are excluded. Use <strong className="text-ink">Menu</strong> or{" "}
        <strong className="text-ink">Stations</strong> to assign items.
      </p>

      <ol className="list-decimal list-inside text-sm text-ink-muted space-y-2 mb-6">
        <li>
          On the server: set{" "}
          <code className="text-xs bg-surface px-1 rounded">PRINT_AGENT_API_SECRET</code> to a long random value and
          redeploy or restart.
        </li>
        <li>
          On each kitchen PC: install Node 18+, download and unzip{" "}
          <code className="text-xs bg-surface px-1 rounded">print-agent-standalone</code> from the repo, run{" "}
          <code className="text-xs bg-surface px-1 rounded">npm install</code> once in that folder.
        </li>
        <li>
          Download the pre-filled startup script for each station (below), place it in the{" "}
          <code className="text-xs bg-surface px-1 rounded">print-agent-standalone</code> folder, fill in the secret,
          and double-click to run.
        </li>
        <li>
          Optional: set{" "}
          <code className="text-xs bg-surface px-1 rounded">PRINT_COMMAND</code> in the script to send PDFs to the
          printer automatically (see{" "}
          <code className="text-xs bg-surface px-1 rounded">README.txt</code>).
        </li>
      </ol>

      <p className="text-sm text-ink-muted mb-2">
        This venue&apos;s slug (use as{" "}
        <code className="text-xs bg-surface px-1 rounded">PRINT_AGENT_RESTAURANT_SLUG</code>):
      </p>
      <p className="dashboard-copy-mono mb-6 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm text-ink break-all">
        {restaurantSlug}
      </p>

      {stations.length > 0 ? (
        <>
          <p className="text-sm font-medium text-ink mb-3">Download startup script per station:</p>
          <div className="flex flex-wrap gap-2">
            {stations.map((s) => (
              <a
                key={s.id}
                href={`/api/dashboard/print-agent-download?station=${encodeURIComponent(s.slug)}`}
                download
                className="inline-flex items-center gap-1.5 rounded-lg border-2 border-primary/40 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10"
              >
                {s.name}
                <span className="text-[10px] font-normal text-primary/70">
                  ({s.slug})
                </span>
              </a>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            Each script is pre-filled with your site URL, restaurant slug, station, and API secret — just download and run.
          </p>
        </>
      ) : (
        <p className="text-sm text-ink-muted rounded-xl border border-dashed border-border bg-surface/50 p-4">
          No stations configured yet. Add stations under{" "}
          <strong className="text-ink">Stations</strong> — each station you create gets its own print agent slot.
        </p>
      )}

      <div className="mt-5 pt-5 border-t border-border">
        <p className="text-sm font-medium text-ink mb-1">Customer receipt printer</p>
        <p className="text-xs text-ink-muted mb-3">
          Prints a full receipt (all items + total) for every new order. Place at the cashier or front desk — the customer gets their copy automatically.
        </p>
        <a
          href="/api/dashboard/print-agent-download?station=receipt"
          download
          className="inline-flex items-center gap-1.5 rounded-lg border-2 border-emerald-500/40 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
        >
          Download receipt printer script
          <span className="text-[10px] font-normal text-emerald-700">(START-RECEIPT-PRINTER.cmd)</span>
        </a>
      </div>

      <p className="mt-4 text-xs text-ink-muted">
        Details: <code className="rounded bg-surface px-1">print-agent-standalone/README.txt</code> in the repo.
      </p>
    </section>
  );
}
