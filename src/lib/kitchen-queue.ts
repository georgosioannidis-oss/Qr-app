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
 * Orders the station print agent may fetch / ack (any restaurant).
 *
 * Prints as soon as the order exists — **no `paid` status required** (cash/card at table, relay, etc.).
 * Excludes only:
 * - finished orders (`delivered`, `declined`)
 * - guests still paying online: `pending` with a `stripeSessionId` (Stripe Checkout in progress)
 */
export function ordersEligibleForStationPrintWhere(restaurantId: string): Prisma.OrderWhereInput {
  return {
    AND: [
      { restaurantId },
      { status: { notIn: ["delivered", "declined"] } },
      {
        NOT: {
          AND: [{ status: "pending" }, { stripeSessionId: { not: null } }],
        },
      },
    ],
  };
}
