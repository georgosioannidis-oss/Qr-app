import type { Prisma } from "@prisma/client";

/**
 * Orders visible on the kitchen “current” list: active pipeline and either past wait-staff relay
 * or direct-to-kitchen (waiterRelayEnabled false → waiterRelayAt set at creation).
 */
export function ordersInKitchenQueueWhere(restaurantId: string): Prisma.OrderWhereInput {
  return {
    restaurantId,
    status: { notIn: ["delivered", "declined"] },
    OR: [{ restaurant: { waiterRelayEnabled: false } }, { waiterRelayAt: { not: null } }],
  };
}

/**
 * Orders the station print agent may fetch / ack: same pipeline as {@link ordersInKitchenQueueWhere},
 * but never unpaid `pending` (e.g. guest still in Stripe checkout). When wait-staff relay is on,
 * the kitchen predicate already requires `waiterRelayAt` (send to kitchen / accept) before an order
 * appears — staff orders from `/m/...` while logged in set `waiterRelayAt` at creation.
 */
export function ordersEligibleForStationPrintWhere(restaurantId: string): Prisma.OrderWhereInput {
  return {
    AND: [ordersInKitchenQueueWhere(restaurantId), { status: { not: "pending" } }],
  };
}
