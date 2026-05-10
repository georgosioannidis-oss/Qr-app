"use client";

import { useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";

type ImportChoice = { label: string; extra?: number };
type ImportOption = {
  label: string;
  required?: boolean;
  type?: "single" | "multi";
  choices: ImportChoice[];
};
type PreviewItem = {
  name: string;
  priceCents: number;
  description: string;
  options: ImportOption[];
  skip: boolean;
};
type PreviewCategory = {
  name: string;
  existingId: string | null;
  willCreate: boolean;
  items: PreviewItem[];
};

function formatEuros(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function parseJson(text: string): { ok: true; data: unknown } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return { ok: false, error: "JSON must be an array [ … ]" };
    for (let i = 0; i < parsed.length; i++) {
      const cat = parsed[i];
      if (typeof cat !== "object" || cat === null) return { ok: false, error: `Item ${i} is not an object` };
      const name = cat.category ?? cat.name;
      if (typeof name !== "string" || !name.trim()) return { ok: false, error: `Category ${i} is missing a "category" name` };
      if (!Array.isArray(cat.items)) return { ok: false, error: `Category "${name}" is missing an "items" array` };
    }
    return { ok: true, data: parsed };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid JSON" };
  }
}

export function MenuImport({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"password" | "paste" | "preview" | "success">("password");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [preview, setPreview] = useState<PreviewCategory[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; categoriesCreated: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setVerifying(true);
    try {
      const res = await fetch("/api/dashboard/menu/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", password }),
      });
      if (res.ok) { setStep("paste"); }
      else { setPasswordError("Wrong password. Try again."); }
    } catch {
      setPasswordError("Connection error. Try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function handlePreview() {
    setJsonError("");
    const parsed = parseJson(jsonText);
    if (!parsed.ok) { setJsonError(parsed.error); return; }
    setLoadingPreview(true);
    try {
      const res = await fetch("/api/dashboard/menu/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", password, data: parsed.data }),
      });
      const data = await res.json();
      if (!res.ok) { setJsonError(data.error ?? "Preview failed"); return; }
      setPreview(data.categories);
      setStep("preview");
    } catch {
      setJsonError("Connection error. Try again.");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleImport() {
    setImporting(true);
    try {
      const res = await fetch("/api/dashboard/menu/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import", password, data: preview }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Import failed"); return; }
      setImportResult(data);
      setStep("success");
    } catch {
      alert("Connection error. Try again.");
    } finally {
      setImporting(false);
    }
  }

  function updateCatName(ci: number, val: string) {
    setPreview((p) => p.map((cat, i) => i === ci ? { ...cat, name: val } : cat));
  }

  function updateItem(ci: number, ii: number, field: "name" | "description", val: string) {
    setPreview((p) =>
      p.map((cat, i) =>
        i === ci
          ? { ...cat, items: cat.items.map((item, j) => j === ii ? { ...item, [field]: val } : item) }
          : cat
      )
    );
  }

  function updateItemPrice(ci: number, ii: number, val: string) {
    const cents = Math.round(parseFloat(val || "0") * 100);
    setPreview((p) =>
      p.map((cat, i) =>
        i === ci
          ? { ...cat, items: cat.items.map((item, j) => j === ii ? { ...item, priceCents: isNaN(cents) ? item.priceCents : cents } : item) }
          : cat
      )
    );
  }

  function toggleSkip(ci: number, ii: number) {
    setPreview((p) =>
      p.map((cat, i) =>
        i === ci
          ? { ...cat, items: cat.items.map((item, j) => j === ii ? { ...item, skip: !item.skip } : item) }
          : cat
      )
    );
  }

  function removeItem(ci: number, ii: number) {
    setPreview((p) =>
      p.map((cat, i) =>
        i === ci ? { ...cat, items: cat.items.filter((_, j) => j !== ii) } : cat
      )
    );
  }

  const totalToImport = preview.reduce((s, c) => s + c.items.filter((i) => !i.skip).length, 0);
  const totalSkipped = preview.reduce((s, c) => s + c.items.filter((i) => i.skip).length, 0);
  const catsToCreate = preview.filter((c) => c.willCreate).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center overflow-y-auto p-4">
      <div className="w-full max-w-2xl bg-card rounded-3xl shadow-2xl border border-border my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-ink">Menu Import</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              {step === "password" && "Enter password to continue"}
              {step === "paste" && "Paste your JSON or upload a file"}
              {step === "preview" && "Review and edit before importing"}
              {step === "success" && "Import complete"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-full bg-surface border-2 border-border flex items-center justify-center text-sm font-bold text-ink-muted hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-6">

          {/* ── Step 1: Password ── */}
          {step === "password" && (
            <form onSubmit={handleVerify} className="space-y-4 max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center text-2xl mx-auto mb-2">🔒</div>
              <label className="block text-sm font-semibold text-ink">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                placeholder="Enter import password"
                className="w-full rounded-xl border-2 border-border bg-surface px-4 py-3 text-base text-ink focus:border-primary focus:outline-none"
              />
              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
              <button
                type="submit"
                disabled={verifying || !password}
                className="min-h-[48px] w-full rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {verifying ? <><Spinner className="h-4 w-4 border-white border-t-transparent" label="" /> Checking…</> : "Unlock"}
              </button>
            </form>
          )}

          {/* ── Step 2: Paste JSON ── */}
          {step === "paste" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-ink-muted">Paste JSON below or upload a <code>.json</code> file.</p>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Upload file
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => setJsonText(ev.target?.result as string ?? "");
                    reader.readAsText(file);
                  }}
                />
              </div>
              <textarea
                value={jsonText}
                onChange={(e) => { setJsonText(e.target.value); setJsonError(""); }}
                rows={16}
                placeholder={'[\n  {\n    "category": "Starters 🥗",\n    "items": [\n      {\n        "name": "Greek Salad",\n        "price": 8.50,\n        "description": "Tomatoes, cucumber, olives, feta",\n        "options": [\n          {\n            "label": "Size",\n            "required": true,\n            "type": "single",\n            "choices": [\n              { "label": "Small", "extra": 0 },\n              { "label": "Large", "extra": 2.50 }\n            ]\n          }\n        ]\n      }\n    ]\n  }\n]'}
                className="w-full rounded-xl border-2 border-border bg-surface px-4 py-3 text-xs font-mono text-ink focus:border-primary focus:outline-none resize-none"
                spellCheck={false}
              />
              {jsonError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {jsonError}
                </div>
              )}
              <button
                type="button"
                onClick={handlePreview}
                disabled={loadingPreview || !jsonText.trim()}
                className="min-h-[48px] w-full rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loadingPreview ? <><Spinner className="h-4 w-4 border-white border-t-transparent" label="" /> Checking…</> : "Preview import"}
              </button>
            </div>
          )}

          {/* ── Step 3: Preview & Edit ── */}
          {step === "preview" && (
            <div className="space-y-6">
              {/* Summary bar */}
              <div className="rounded-xl bg-surface border border-border px-4 py-3 flex flex-wrap gap-4 text-sm">
                <span className="text-ink"><span className="font-bold text-primary">{totalToImport}</span> items to import</span>
                {catsToCreate > 0 && <span className="text-ink"><span className="font-bold">{catsToCreate}</span> new {catsToCreate === 1 ? "category" : "categories"}</span>}
                {totalSkipped > 0 && <span className="text-ink-muted"><span className="font-bold">{totalSkipped}</span> already exist (skipped)</span>}
              </div>

              {/* Category blocks */}
              {preview.map((cat, ci) => (
                <div key={ci} className="border border-border rounded-2xl overflow-hidden">
                  {/* Category header */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-surface border-b border-border">
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => updateCatName(ci, e.target.value)}
                      className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold text-ink focus:border-primary focus:outline-none"
                    />
                    {cat.willCreate
                      ? <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">New</span>
                      : <span className="text-[10px] font-bold uppercase tracking-wide text-ink-muted bg-ink/5 px-2 py-0.5 rounded-full">Exists</span>
                    }
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-border">
                    {cat.items.length === 0 && (
                      <p className="px-4 py-3 text-sm text-ink-muted italic">No items</p>
                    )}
                    {cat.items.map((item, ii) => (
                      <div key={ii} className={`px-4 py-3 space-y-2 ${item.skip ? "opacity-50" : ""}`}>
                        <div className="flex items-start gap-2">
                          <div className="flex-1 grid grid-cols-[1fr_auto] gap-2">
                            {/* Name */}
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItem(ci, ii, "name", e.target.value)}
                              disabled={item.skip}
                              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-ink focus:border-primary focus:outline-none disabled:opacity-50"
                            />
                            {/* Price */}
                            <div className="relative w-24">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-muted">€</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={(item.priceCents / 100).toFixed(2)}
                                onChange={(e) => updateItemPrice(ci, ii, e.target.value)}
                                disabled={item.skip}
                                className="w-full rounded-lg border border-border bg-surface pl-6 pr-2 py-1.5 text-sm font-semibold text-ink focus:border-primary focus:outline-none disabled:opacity-50"
                              />
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              title={item.skip ? "Include" : "Skip"}
                              onClick={() => toggleSkip(ci, ii)}
                              className={`text-xs px-2 py-1 rounded-lg border font-medium transition-colors ${item.skip ? "border-primary text-primary bg-primary/5" : "border-border text-ink-muted hover:border-ink/20"}`}
                            >
                              {item.skip ? "Include" : "Skip"}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(ci, ii)}
                              className="w-7 h-7 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 flex items-center justify-center text-xs font-bold"
                              aria-label="Remove"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        {/* Description */}
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(ci, ii, "description", e.target.value)}
                          disabled={item.skip}
                          placeholder="Description (optional)"
                          className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-ink-muted focus:border-primary focus:outline-none disabled:opacity-50"
                        />
                        {/* Options summary */}
                        {item.options && item.options.length > 0 && (
                          <p className="text-[10px] text-ink-muted/70">
                            Options: {item.options.map((o) => o.label).join(", ")}
                          </p>
                        )}
                        {item.skip && (
                          <p className="text-[10px] text-amber-600 font-medium">Already exists — will be skipped</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("paste")}
                  className="min-h-[48px] px-5 rounded-xl border-2 border-border text-ink font-semibold hover:bg-ink/5"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing || totalToImport === 0}
                  className="flex-1 min-h-[48px] rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {importing
                    ? <><Spinner className="h-4 w-4 border-white border-t-transparent" label="" /> Importing…</>
                    : `Import ${totalToImport} item${totalToImport !== 1 ? "s" : ""}`
                  }
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Success ── */}
          {step === "success" && importResult && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl mx-auto ring-1 ring-green-200">
                ✓
              </div>
              <h3 className="text-xl font-bold text-ink">Import complete!</h3>
              <div className="rounded-xl bg-surface border border-border px-6 py-4 text-sm space-y-1 inline-block text-left">
                {importResult.categoriesCreated > 0 && (
                  <p className="text-ink"><span className="font-bold text-primary">{importResult.categoriesCreated}</span> {importResult.categoriesCreated === 1 ? "category" : "categories"} created</p>
                )}
                <p className="text-ink"><span className="font-bold text-primary">{importResult.created}</span> items imported</p>
                {importResult.skipped > 0 && (
                  <p className="text-ink-muted"><span className="font-bold">{importResult.skipped}</span> skipped (already existed)</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[48px] w-full max-w-xs rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold shadow-sm ring-1 ring-black/10"
              >
                View menu
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
