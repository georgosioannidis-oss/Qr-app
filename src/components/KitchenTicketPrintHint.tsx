"use client";

import Link from "next/link";

/**
 * Expandable copy for station-based auto-print setup.
 */
export function KitchenTicketPrintHint() {
  return (
    <details className="rounded-xl border border-border bg-card/60 px-4 py-3 text-sm text-ink-muted shadow-sm">
      <summary className="cursor-pointer list-none font-medium text-ink select-none [&::-webkit-details-marker]:hidden">
        <span className="underline-offset-2 hover:underline">
          How station auto-print works
        </span>
      </summary>
      <div className="mt-3 space-y-3 border-t border-border pt-3 leading-relaxed">
        <p>
          A <strong className="text-ink">print agent</strong> script runs on a computer near your printer and polls the
          app for new orders. Each agent is configured for one station, creates a PDF ticket, and prints only lines for
          that station.
        </p>
        <p>
          Start one agent per station: <strong className="text-ink">Bar</strong>, <strong className="text-ink">Cold
          kitchen</strong>, and <strong className="text-ink">Kitchen</strong>. Set it up under{" "}
          <Link
            href="/dashboard/branding"
            className="font-semibold text-primary underline underline-offset-2 hover:opacity-90"
          >
            Options → Auto-print (kitchen PC)
          </Link>
          . Use <code className="rounded bg-surface px-1 font-mono text-xs">PRINT_AGENT_STATION</code> with{" "}
          <code className="rounded bg-surface px-1 font-mono text-xs">bar</code>,{" "}
          <code className="rounded bg-surface px-1 font-mono text-xs">cold-kitchen</code>, or{" "}
          <code className="rounded bg-surface px-1 font-mono text-xs">kitchen</code> (see{" "}
          <code className="rounded bg-surface px-1 font-mono text-xs">.env.example</code>).
        </p>
      </div>
    </details>
  );
}
