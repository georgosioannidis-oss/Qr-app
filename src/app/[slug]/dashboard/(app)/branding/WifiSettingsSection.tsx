"use client";

import { useState, useEffect } from "react";

type WifiStatus = {
  wifiEnforcementEnabled: boolean;
  maskedIp: string | null;
  wifiIpWarnOwner: boolean;
};

export function WifiSettingsSection() {
  const [status, setStatus] = useState<WifiStatus | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/wifi-settings")
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch(() => {});
  }, []);

  async function call(action: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/dashboard/wifi-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Something went wrong." });
        return;
      }
      setPassword("");
      if (action === "set") {
        setStatus((s) =>
          s ? { ...s, maskedIp: data.maskedIp, wifiEnforcementEnabled: true, wifiIpWarnOwner: false } : s
        );
        setMessage({ type: "ok", text: `WiFi IP saved (${data.maskedIp}). Enforcement is now active.` });
      } else if (action === "toggle") {
        setStatus((s) => (s ? { ...s, wifiEnforcementEnabled: data.wifiEnforcementEnabled } : s));
        setMessage({
          type: "ok",
          text: data.wifiEnforcementEnabled ? "WiFi enforcement enabled." : "WiFi enforcement disabled.",
        });
      } else if (action === "clear-warning") {
        setStatus((s) => (s ? { ...s, wifiIpWarnOwner: false } : s));
        setMessage({ type: "ok", text: "Warning cleared." });
      }
    } catch {
      setMessage({ type: "err", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">WiFi Access Control</h2>
        <p className="text-sm text-ink-muted mt-1">
          When enabled, guests must be on the restaurant WiFi to scan a QR code and start an ordering
          session. Anyone off-site sees a &quot;Connect to WiFi&quot; message instead of the menu.
        </p>
      </div>

      {status && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                status.wifiEnforcementEnabled ? "bg-green-500" : "bg-zinc-400"
              }`}
            />
            <span className="text-ink">
              {status.wifiEnforcementEnabled ? "Enforcement active" : "Enforcement disabled"}
            </span>
          </div>
          {status.maskedIp && (
            <p className="text-ink-muted pl-4">Registered IP: {status.maskedIp}</p>
          )}
          {!status.maskedIp && (
            <p className="text-ink-muted pl-4">No WiFi IP set yet. Connect to the restaurant network and click &quot;Set current WiFi&quot;.</p>
          )}
          {status.wifiIpWarnOwner && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
              QR orders are failing — your WiFi IP may have changed. Connect to the restaurant
              network and click &quot;Set current WiFi&quot; below to fix it.
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Settings password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password to make changes"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => call("set")}
            disabled={busy || !password}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50 transition-opacity"
          >
            Set current WiFi
          </button>
          <button
            onClick={() => call("toggle")}
            disabled={busy || !password}
            className="px-4 py-2 rounded-lg border border-border bg-card text-ink text-sm font-medium hover:bg-surface disabled:opacity-50 transition-colors"
          >
            {status?.wifiEnforcementEnabled ? "Disable enforcement" : "Enable enforcement"}
          </button>
          {status?.wifiIpWarnOwner && (
            <button
              onClick={() => call("clear-warning")}
              disabled={busy || !password}
              className="px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              Clear warning
            </button>
          )}
        </div>

        {message && (
          <p className={`text-sm ${message.type === "ok" ? "text-green-600" : "text-red-600"}`}>
            {message.text}
          </p>
        )}
      </div>
    </section>
  );
}
