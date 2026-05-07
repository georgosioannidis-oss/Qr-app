"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

const CANVAS_W = 1100;
const CANVAS_H = 680;
const TABLE_W = 88;
const TABLE_H = 56;
const AUTO_COLS = 8;
const AUTO_GAP_X = 130;
const AUTO_GAP_Y = 100;
const AUTO_OFFSET_X = 40;
const AUTO_OFFSET_Y = 40;

type TableRow = {
  id: string;
  name: string;
  token: string;
  sortOrder: number;
  waiterCalledAt: string | null;
  floorX: number | null;
  floorY: number | null;
};

type Section = {
  id: string;
  name: string;
  sortOrder: number;
  tables: TableRow[];
};

type Order = {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  table: { token: string; name: string };
  items: { quantity: number; menuItem: { name: string } }[];
};

function formatEur(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function playWaiterAlert() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    [[440, 0], [660, 0.18], [880, 0.36]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.3, now + delay + 0.04);
      gain.gain.linearRampToValueAtTime(0, now + delay + 0.22);
      osc.start(now + delay);
      osc.stop(now + delay + 0.25);
    });
  } catch {
    /* audio not available */
  }
}

function autoPosition(index: number): { x: number; y: number } {
  const col = index % AUTO_COLS;
  const row = Math.floor(index / AUTO_COLS);
  return {
    x: AUTO_OFFSET_X + col * AUTO_GAP_X,
    y: AUTO_OFFSET_Y + row * AUTO_GAP_Y,
  };
}

export function FloorPlanCanvas() {
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState<string>("");
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [waiterCalledIds, setWaiterCalledIds] = useState<Set<string>>(new Set());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableRow | null>(null);
  const prevWaiterSet = useRef<Set<string>>(new Set());

  const loadSections = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/wait-staff/tables");
      if (!res.ok) throw new Error("Failed to load tables");
      const data = (await res.json()) as { sections?: Section[] };
      const sects = data.sections ?? [];
      setSections(sects);
      setActiveSection((prev) => prev || sects[0]?.id || "");

      // Build positions map (auto-place if missing)
      setPositions((prev) => {
        const next = { ...prev };
        sects.forEach((sec) => {
          sec.tables.forEach((t, idx) => {
            if (next[t.id]) return;
            if (t.floorX != null && t.floorY != null) {
              next[t.id] = { x: t.floorX, y: t.floorY };
            } else {
              next[t.id] = autoPosition(idx);
            }
          });
        });
        return next;
      });

      // Detect new waiter calls and play sound
      const calledNow = new Set<string>(
        sects.flatMap((s) => s.tables.filter((t) => t.waiterCalledAt).map((t) => t.id))
      );
      const prev = prevWaiterSet.current;
      const newCalls = [...calledNow].filter((id) => !prev.has(id));
      if (newCalls.length > 0 && prev.size > 0) {
        playWaiterAlert();
      }
      prevWaiterSet.current = calledNow;
      setWaiterCalledIds(calledNow);
    } catch {
      setError("Could not load floor plan. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/orders");
      if (!res.ok) return;
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    void loadSections();
    void loadOrders();
    const t1 = setInterval(loadSections, 3000);
    const t2 = setInterval(loadOrders, 3000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [loadSections, loadOrders]);

  const savePosition = useCallback(async (tableId: string, x: number, y: number) => {
    try {
      await fetch(`/api/dashboard/tables/${tableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ floorX: Math.round(x), floorY: Math.round(y) }),
      });
    } catch {
      toast.error("Could not save table position");
    }
  }, []);

  // Per-table drag state
  const dragState = useRef<{
    tableId: string;
    startMouseX: number;
    startMouseY: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  const onTableMouseDown = useCallback(
    (e: React.MouseEvent, table: TableRow) => {
      e.preventDefault();
      const pos = positions[table.id] ?? autoPosition(0);
      dragState.current = {
        tableId: table.id,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startX: pos.x,
        startY: pos.y,
        moved: false,
      };
    },
    [positions]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const ds = dragState.current;
      if (!ds) return;
      const dx = e.clientX - ds.startMouseX;
      const dy = e.clientY - ds.startMouseY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) ds.moved = true;
      if (!ds.moved) return;
      const newX = Math.max(0, Math.min(CANVAS_W - TABLE_W, ds.startX + dx));
      const newY = Math.max(0, Math.min(CANVAS_H - TABLE_H, ds.startY + dy));
      setPositions((prev) => ({ ...prev, [ds.tableId]: { x: newX, y: newY } }));
    };
    const onUp = async (e: MouseEvent) => {
      const ds = dragState.current;
      if (!ds) return;
      if (ds.moved) {
        const pos = {
          x: Math.max(0, Math.min(CANVAS_W - TABLE_W, ds.startX + (e.clientX - ds.startMouseX))),
          y: Math.max(0, Math.min(CANVAS_H - TABLE_H, ds.startY + (e.clientY - ds.startMouseY))),
        };
        await savePosition(ds.tableId, pos.x, pos.y);
      }
      dragState.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [savePosition]);

  const handleTableClick = useCallback(
    (table: TableRow) => {
      if (dragState.current?.moved) return;
      setSelectedTable(table);
    },
    []
  );

  const currentSection = sections.find((s) => s.id === activeSection);
  const sectionOrders = orders.filter((o) =>
    currentSection?.tables.some((t) => t.token === o.table.token)
  );
  const selectedOrders = selectedTable
    ? orders.filter(
        (o) =>
          o.table.token === selectedTable.token &&
          !["delivered", "declined"].includes(o.status)
      )
    : [];

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-ink-muted py-8">
        <Spinner className="h-5 w-5 border-primary border-t-transparent" />
        Loading floor plan…
      </div>
    );
  }

  if (error) {
    return <p className="rounded-xl border border-border bg-card p-4 text-sm text-ink">{error}</p>;
  }

  if (sections.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border bg-card p-12 text-center">
        <p className="font-medium text-ink">No table sections yet</p>
        <p className="mt-1 text-sm text-ink-muted">Add sections and tables in the Tables page first.</p>
      </div>
    );
  }

  const waiterCallCount = waiterCalledIds.size;

  return (
    <div className="space-y-4">
      {/* Section tabs */}
      <div className="flex flex-wrap gap-2">
        {sections.map((sec) => {
          const secCallCount = sec.tables.filter((t) => waiterCalledIds.has(t.id)).length;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              className={`inline-flex items-center gap-2 min-h-[40px] rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                activeSection === sec.id
                  ? "bg-primary text-white shadow-sm"
                  : "border-2 border-border bg-card text-ink hover:bg-surface"
              }`}
            >
              {sec.name}
              {secCallCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {secCallCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {waiterCallCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-900">
          <span className="text-base">🔔</span>
          {waiterCallCount} {waiterCallCount === 1 ? "table is" : "tables are"} calling for a waiter
        </div>
      )}

      {/* Canvas */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
        <div
          className="relative select-none"
          style={{ width: CANVAS_W, height: CANVAS_H, minWidth: CANVAS_W }}
        >
          {/* Grid dots background */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={CANVAS_W}
            height={CANVAS_H}
            aria-hidden
          >
            {Array.from({ length: Math.ceil(CANVAS_H / 40) }).map((_, row) =>
              Array.from({ length: Math.ceil(CANVAS_W / 40) }).map((_, col) => (
                <circle
                  key={`${row}-${col}`}
                  cx={col * 40 + 20}
                  cy={row * 40 + 20}
                  r={1}
                  fill="#e5e7eb"
                />
              ))
            )}
          </svg>

          {currentSection?.tables.map((table) => {
            const pos = positions[table.id] ?? autoPosition(0);
            const isCalling = waiterCalledIds.has(table.id);
            const tableActiveOrders = orders.filter(
              (o) =>
                o.table.token === table.token &&
                !["delivered", "declined"].includes(o.status)
            );
            const hasOrders = tableActiveOrders.length > 0;
            const isSelected = selectedTable?.id === table.id;

            return (
              <div
                key={table.id}
                onMouseDown={(e) => onTableMouseDown(e, table)}
                onClick={() => handleTableClick(table)}
                style={{
                  position: "absolute",
                  left: pos.x,
                  top: pos.y,
                  width: TABLE_W,
                  height: TABLE_H,
                  cursor: "grab",
                  userSelect: "none",
                }}
                className={`flex flex-col items-center justify-center rounded-xl border-2 shadow-sm transition-shadow ${
                  isCalling
                    ? "border-red-400 bg-red-50 shadow-red-200/60 shadow-md"
                    : isSelected
                    ? "border-primary bg-primary/10"
                    : hasOrders
                    ? "border-amber-400 bg-amber-50"
                    : "border-border bg-card hover:border-primary/50 hover:shadow-md"
                }`}
              >
                <span className="text-xs font-bold text-ink leading-tight text-center px-1 truncate w-full text-center">
                  {table.name}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  {isCalling && <span className="text-[10px]">🔔</span>}
                  {hasOrders && (
                    <span className="text-[9px] font-semibold text-amber-800 bg-amber-100 rounded-full px-1.5 py-0.5">
                      {tableActiveOrders.length} order{tableActiveOrders.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-ink-muted">Drag tables to position them. Changes are saved automatically.</p>

      {/* Selected table orders panel */}
      {selectedTable && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center sm:px-4 sm:py-6"
          onClick={() => setSelectedTable(null)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 className="text-base font-bold text-ink">{selectedTable.name}</h2>
              <button
                type="button"
                onClick={() => setSelectedTable(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-surface text-lg font-bold text-ink hover:bg-ink/5"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {selectedOrders.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-muted">No active orders for this table.</p>
              ) : (
                selectedOrders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-border bg-surface p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                        {order.status} · {formatTime(order.createdAt)}
                      </span>
                      <span className="font-bold text-ink tabular-nums text-sm">
                        {formatEur(order.totalAmount)}
                      </span>
                    </div>
                    <ul className="space-y-0.5">
                      {order.items.map((item, i) => (
                        <li key={i} className="text-sm text-ink">
                          {item.quantity}× {item.menuItem.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
            <div className="shrink-0 border-t border-border px-4 py-3">
              <button
                type="button"
                onClick={() => setSelectedTable(null)}
                className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
