"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OnboardingGateForm() {
  const router = useRouter();
  const [accessPassword, setAccessPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/provision/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: accessPassword }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Incorrect password.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not verify. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
      <h1 className="text-lg font-semibold text-ink">Restricted</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        Enter the access password to continue.
      </p>
      <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        ) : null}
        <div>
          <label htmlFor="onboarding-gate-pw" className="block text-sm font-medium text-ink">
            Access password
          </label>
          <input
            id="onboarding-gate-pw"
            type="password"
            autoComplete="off"
            value={accessPassword}
            onChange={(e) => setAccessPassword(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm text-ink outline-none ring-primary focus:ring-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
        >
          {loading ? "Checking…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
