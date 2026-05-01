export type PrintStationKey = "bar" | "cold-kitchen" | "kitchen";

/** Stable URL-safe slug derived from a Station.name — used as PRINT_AGENT_STATION value. */
export function stationSlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "-");
}

function normalizeStationLabel(name: string | null | undefined): string | null {
  if (name == null) return null;
  const t = name.trim().toLowerCase().replace(/\s+/g, " ");
  return t.length ? t : null;
}

function isColdKitchenLabel(label: string | null): boolean {
  if (!label) return false;
  return (
    label === "cold kitchen" ||
    label === "cold kicthen" ||
    (label.includes("cold") && label.includes("kitchen"))
  );
}

/**
 * Route an order line to one of the 3 printable stations.
 * Unknown non-empty station names fall back to `kitchen` so no line is dropped.
 */
export function stationKeyFromName(stationName: string | null | undefined): PrintStationKey {
  const label = normalizeStationLabel(stationName);
  if (label === "bar") return "bar";
  if (isColdKitchenLabel(label)) return "cold-kitchen";
  return "kitchen";
}

export function printStationLabel(station: PrintStationKey): string {
  if (station === "bar") return "Bar";
  if (station === "cold-kitchen") return "Cold kitchen";
  return "Kitchen";
}

export function isPrintStationKey(value: string): value is PrintStationKey {
  return value === "bar" || value === "cold-kitchen" || value === "kitchen";
}

/**
 * Whether an order line appears when polling {@link PrintStationKey} for tickets.
 * - **bar**: only bar-routed lines.
 * - **cold-kitchen** and **kitchen**: the same food pool (every non-bar line), matching combined prep queues.
 *
 * Order-level gates (kitchen queue, waiter relay) are identical for bar, cold-kitchen, and kitchen; the print agent does not filter orders by payment (`ordersForStationPrintAgent` in `kitchen-queue.ts`).
 */
export function lineMatchesPrintStationPoll(
  itemStation: PrintStationKey,
  pollStation: PrintStationKey
): boolean {
  if (pollStation === "bar") return itemStation === "bar";
  return itemStation !== "bar";
}
