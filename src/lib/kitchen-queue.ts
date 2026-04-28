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
 * Payment / lifecycle gate for print (no waiter relay): excludes finished orders and
 * Stripe Checkout still in progress (`pending` + `stripeSessionId`).
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

/**
 * Orders the station print agent may fetch / ack: same rules as the dashboard kitchen list.
 * - **Wait staff relay off** (`waiterRelayEnabled: false`): prints as soon as the guest order exists (and passes {@link ordersEligibleForStationPrintWhere}).
 * - **Relay on**: prints only after wait staff accepts (`waiterRelayAt` set). Guest `paymentPreference` is display-only and does not affect this.
 */
export function ordersForStationPrintAgent(restaurantId: string): Prisma.OrderWhereInput {
  return {
    AND: [ordersEligibleForStationPrintWhere(restaurantId), ordersInKitchenQueueWhere(restaurantId)],
  };
}
