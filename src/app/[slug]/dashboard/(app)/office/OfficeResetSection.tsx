"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function OfficeResetSection() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [secret, setSecret] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleReset = async () => {
    if (!secret.trim()) {
      toast.error("Enter the reset secret.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/dashboard/office/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: secret.trim() }),
      });
      const text = await res.text();
      let data: { ok?: boolean; deletedOrders?: number; error?: string } = {};
      try {
        if (text) data = JSON.parse(text);
      } catch { /* ignore */ }
      if (!res.ok) {
        toast.error(data.error ?? `Failed (${res.status})`);
        return;
      }
      toast.success(`Done — ${data.deletedOrders ?? 0} orders permanently deleted.`);
      setSecret("");
      setConfirming(false);
      setExpanded(false);
      router.refresh();
    } catch {
      toast.error("Request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-red-200 bg-card p-6 shadow-sm group-data-[theme=dark]/dashboard:border-red-900/40">
      <h2 className="text-base font-semibold text-red-700 mb-1 group-data-[theme=dark]/dashboard:text-red-400">
        Data reset
      </h2>
      <p className="text-sm text-ink-muted mb-4">
        Permanently deletes <strong className="text-ink">all orders</strong> for this restaurant. This cannot be undone.
        Team members, menu, tables, and stations are not affected.
      </p>

      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="rounded-xl border-2 border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 group-data-[theme=dark]/dashboard:border-red-800 group-data-[theme=dark]/dashboard:text-red-400 group-data-[theme=dark]/dashboard:hover:bg-red-950/30"
        >
          Show reset
        </button>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 group-data-[theme=dark]/dashboard:border-red-900/40 group-data-[theme=dark]/dashboard:bg-red-950/20 group-data-[theme=dark]/dashboard:text-red-300">
            <strong>Warning:</strong> this will hard-delete every order and order item in the database for this venue.
            Download the accountant report above first if you need a record. The reset secret is set in your server
            environment as <code className="rounded bg-red-100 px-1 group-data-[theme=dark]/dashboard:bg-red-900/30">OFFICE_RESET_SECRET</code>.
          </div>

          <label className="block">
            <span className="text-sm font-medium text-ink">Reset secret</span>
            <input
              type="password"
              value={secret}
              onChange={(e) => { setSecret(e.target.value); setConfirming(false); }}
              placeholder="Enter OFFICE_RESET_SECRET"
              className="mt-1 w-full max-w-sm rounded-xl border-2 border-border bg-card px-3 py-2.5 text-sm text-ink focus:border-red-400 focus:outline-none"
            />
          </label>

          {!confirming ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { if (secret.trim()) setConfirming(true); else toast.error("Enter the secret first."); }}
                disabled={busy}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                Delete all orders
              </button>
              <button
                type="button"
                onClick={() => { setExpanded(false); setSecret(""); setConfirming(false); }}
                className="rounded-xl border-2 border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-red-700 group-data-[theme=dark]/dashboard:text-red-400">
                Are you absolutely sure? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={busy}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {busy ? "Deleting…" : "Yes, permanently delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={busy}
                  className="rounded-xl border-2 border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
                >
                  No, cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
