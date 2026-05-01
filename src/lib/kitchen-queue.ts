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
 * Orders the station print agent may fetch / ack: **same rules as the dashboard kitchen list**
 * (not filtered on Stripe, `paid`, or guest payment preference).
 * - **Wait staff relay off** (`waiterRelayEnabled: false`): prints as soon as the guest order exists (`waiterRelayAt` set at creation).
 * - **Relay on**: prints only after wait staff accepts (`waiterRelayAt` set).
 */
export function ordersForStationPrintAgent(restaurantId: string): Prisma.OrderWhereInput {
  return ordersInKitchenQueueWhere(restaurantId);
}
