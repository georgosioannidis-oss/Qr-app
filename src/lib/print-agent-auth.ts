import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

export type PrintAgentRestaurant = {
  id: string;
  name: string;
  waiterRelayEnabled: boolean;
  onlinePaymentEnabled: boolean;
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

export type PrintAgentAuthFailure =
  | { kind: "invalid_secret" }
  | { kind: "missing_slug" }
  | { kind: "unknown_slug"; slug: string };

/**
 * Validates `X-Print-Agent-Secret` against `PRINT_AGENT_API_SECRET` (server env),
 * then loads the restaurant by URL slug (same slug as `/[slug]/dashboard`).
 */
export async function authorizePrintAgentRestaurant(
  secretHeader: string | null,
  restaurantSlug: string | null
): Promise<{ ok: true; restaurant: PrintAgentRestaurant } | { ok: false; failure: PrintAgentAuthFailure }> {
  const configured = getConfiguredSecret();
  if (!configured) {
    return { ok: false, failure: { kind: "invalid_secret" } };
  }

  const provided = (secretHeader ?? "").trim();
  if (!timingSafeStringEqual(provided, configured)) {
    return { ok: false, failure: { kind: "invalid_secret" } };
  }

  const slug = (restaurantSlug ?? "").trim();
  if (!slug) {
    return { ok: false, failure: { kind: "missing_slug" } };
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { id: true, name: true, waiterRelayEnabled: true, onlinePaymentEnabled: true },
  });

  if (!restaurant) {
    return { ok: false, failure: { kind: "unknown_slug", slug } };
  }

  return { ok: true, restaurant };
}

/** @deprecated Prefer {@link authorizePrintAgentRestaurant} for correct HTTP status (404 unknown slug vs 401 bad secret). */
export async function restaurantForPrintAgentRequest(
  secretHeader: string | null,
  restaurantSlug: string | null
): Promise<PrintAgentRestaurant | null> {
  const r = await authorizePrintAgentRestaurant(secretHeader, restaurantSlug);
  return r.ok ? r.restaurant : null;
}

export function printAgentApiDisabledReason(): "missing_secret" | null {
  return getConfiguredSecret() ? null : "missing_secret";
}
