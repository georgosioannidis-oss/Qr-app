import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

export type PrintAgentRestaurant = {
  id: string;
  name: string;
  waiterRelayEnabled: boolean;
};

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function getConfiguredSecret(): string | null {
  const s = process.env.PRINT_AGENT_API_SECRET?.trim();
  return s && s.length > 0 ? s : null;
}

/**
 * Validates `X-Print-Agent-Secret` against `PRINT_AGENT_API_SECRET` (server env),
 * then loads the restaurant by URL slug (same slug as `/[slug]/dashboard`).
 */
export async function restaurantForPrintAgentRequest(
  secretHeader: string | null,
  restaurantSlug: string | null
): Promise<PrintAgentRestaurant | null> {
  const configured = getConfiguredSecret();
  if (!configured) return null;

  const provided = (secretHeader ?? "").trim();
  if (!timingSafeStringEqual(provided, configured)) return null;

  const slug = (restaurantSlug ?? "").trim();
  if (!slug) return null;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { id: true, name: true, waiterRelayEnabled: true },
  });

  return restaurant;
}

export function printAgentApiDisabledReason(): "missing_secret" | null {
  return getConfiguredSecret() ? null : "missing_secret";
}
