/**
 * Filters order lines for station-specific prep screens.
 * Matches station names case-insensitively. Expected station names:
 * `Bar`, `Kitchen`, `Cold Kitchen` (typo `Cold Kicthen` is accepted).
 */

export type StationOrderPreset = "bar" | "cold-kitchen" | "full-kitchen";

export type OrderItemStationShape = {
  menuItem: {
    station?: { id: string; name: string } | null;
    category?: { station?: { id: string; name: string } | null } | null;
  };
};

function normalizeStationLabel(name: string | null | undefined): string | null {
  if (name == null) return null;
  const t = name.trim().toLowerCase().replace(/\s+/g, " ");
  return t.length ? t : null;
}

/** Item or category station (item wins). */
export function effectiveStationForOrderItem(
  item: OrderItemStationShape
): { id: string; name: string } | null {
  return item.menuItem.station ?? item.menuItem.category?.station ?? null;
}

export function stationLabelForOrderItem(item: OrderItemStationShape): string | null {
  return normalizeStationLabel(effectiveStationForOrderItem(item)?.name);
}

function isColdKitchenLabel(label: string | null): boolean {
  if (!label) return false;
  return (
    label === "cold kitchen" ||
    label === "cold kicthen" ||
    (label.includes("cold") && label.includes("kitchen"))
  );
}

function isBarLabel(label: string | null): boolean {
  return label === "bar";
}

/**
 * - **bar**: only lines routed to a station named `Bar`.
 * - **cold-kitchen**: only `Cold Kitchen` lines.
 * - **full-kitchen**: hot kitchen queue (default/no-station + `Kitchen` + other non-bar, non-cold stations).
 */
export function itemMatchesStationPreset(
  item: OrderItemStationShape,
  preset: StationOrderPreset
): boolean {
  const label = stationLabelForOrderItem(item);
  if (preset === "bar") {
    return isBarLabel(label);
  }
  // cold-kitchen + kitchen screens show the same combined food queue.
  if (label === null) return true; // default kitchen routing
  return !isBarLabel(label);
}

export function filterOrderItemsForPreset<T extends OrderItemStationShape>(
  items: T[],
  preset: StationOrderPreset
): T[] {
  return items.filter((i) => itemMatchesStationPreset(i, preset));
}
