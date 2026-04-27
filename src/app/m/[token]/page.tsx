/**
 * Server page for `/m/[token]`: resolves the table by public token, loads menu tree, renders `MenuView`.
 * `token` is the `Table.token` column (what QR codes point at), not a session secret.
 */
import { notFound, redirect } from "next/navigation";
import { loadCustomerTableWithMenuByToken } from "@/lib/load-customer-table";
import { normalizePublicMediaUrl } from "@/lib/media-url";
import { resolvedMenuItemAllergenCodes } from "@/lib/merge-menu-allergens";
import { restaurantUsesStripeCheckout } from "@/lib/restaurant-checkout";
import { isGuestQrOrderingBlocked } from "@/lib/guest-ordering-pause";
import { cookies } from "next/headers";
import { GUEST_QR_ACCESS_COOKIE, isValidQrProof, verifyAccessToken } from "@/lib/guest-qr-access";
import { ensureMinTwoPeopleOptionGroup } from "@/lib/min-two-people-option";
import { MenuView } from "./MenuView";

export const revalidate = 30;

/** DB JSON can be a string, wrong shape, or non-array; never pass non-arrays into the menu UI. */
function parseGuestMenuOptionGroups(raw: unknown):
  | {
      id: string;
      label: string;
      required: boolean;
      type: "single" | "multi";
      choices: { id: string; label: string; priceCents: number }[];
    }[]
  | undefined {
  if (raw == null) return undefined;
  let v: unknown = raw;
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      return undefined;
    }
  }
  if (!Array.isArray(v) || v.length === 0) return undefined;
  const out: NonNullable<ReturnType<typeof parseGuestMenuOptionGroups>> = [];
  for (const entry of v) {
    if (!entry || typeof entry !== "object") continue;
    const g = entry as Record<string, unknown>;
    const id = typeof g.id === "string" ? g.id : "";
    const label = typeof g.label === "string" ? g.label : "";
    if (!id || !label) continue;
    const required = g.required === true;
    const type: "single" | "multi" = g.type === "multi" ? "multi" : "single";
    const choicesRaw = g.choices;
    if (!Array.isArray(choicesRaw)) continue;
    const choices: { id: string; label: string; priceCents: number }[] = [];
    for (const c of choicesRaw) {
      if (!c || typeof c !== "object") continue;
      const ch = c as Record<string, unknown>;
      const cid = typeof ch.id === "string" ? ch.id : "";
      const cl = typeof ch.label === "string" ? ch.label : "";
      if (!cid || !cl) continue;
      const priceCents =
        typeof ch.priceCents === "number" && Number.isFinite(ch.priceCents)
          ? Math.round(ch.priceCents)
          : 0;
      choices.push({ id: cid, label: cl, priceCents });
    }
    if (choices.length === 0) continue;
    out.push({ id, label, required, type, choices });
  }
  return out.length > 0 ? out : undefined;
}

export default async function TableMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paid?: string; cancel?: string; qr?: string }>;
}) {
  const { token } = await params;
  const { paid, qr } = await searchParams;
  const table = await loadCustomerTableWithMenuByToken(token);

  if (!table) notFound();
  /** Cookie can only be set in a Route Handler (Next.js 15+); bootstrap then redirects back here. */
  if (qr && isValidQrProof(token, qr)) {
    const qs = new URLSearchParams({ token, qr });
    redirect(`/api/guest-qr-bootstrap?${qs.toString()}`);
  }
  const jar = await cookies();
  const hasCurrentAccess = verifyAccessToken(
    token,
    jar.get(GUEST_QR_ACCESS_COOKIE)?.value
  );
  if (!hasCurrentAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface">
        <div className="max-w-md w-full rounded-3xl border border-border bg-card p-8 shadow-sm text-center">
          <h2 className="text-xl font-bold text-ink mb-3 leading-snug">Scan table QR to order</h2>
          <p className="text-base leading-relaxed text-ink-muted sm:text-sm">
            Your ordering access has expired. Scan the QR code at your table again to start a new 30-minute session.
          </p>
        </div>
      </div>
    );
  }

  const menu = table.restaurant.menuCategories.filter((c) => c.items.length > 0);
  const usesOnlineCheckout = restaurantUsesStripeCheckout(table.restaurant);

  return (
    <MenuView
        restaurantName={table.restaurant.name}
        restaurantSlug={table.restaurant.slug}
        tableName={table.name}
        tableToken={token}
        tableLogoUrl={table.restaurant.logoUrl ?? undefined}
        paidSuccess={paid === "1"}
        usesOnlineCheckout={usesOnlineCheckout}
        payAtTableCardEnabled={table.restaurant.payAtTableCardEnabled === true}
        payAtTableCashEnabled={table.restaurant.payAtTableCashEnabled === true}
        guestOrderingPaused={isGuestQrOrderingBlocked({
          restaurantPaused: table.restaurant.guestQrOrderingPaused === true,
          sectionPaused: table.tableSection?.guestQrOrderingPaused === true,
          tablePaused: table.guestQrOrderingPaused === true,
        })}
        categories={menu.map((c) => ({
        id: c.id,
        name: c.name,
        items: c.items.map((i) => {
          const allergenCodes = resolvedMenuItemAllergenCodes(i.name, i.allergenCodes);
          return {
            id: i.id,
            name: i.name,
            description: i.description ?? undefined,
            price: i.price,
            imageUrl: normalizePublicMediaUrl(i.imageUrl ?? undefined) ?? undefined,
            optionGroups: ensureMinTwoPeopleOptionGroup(
              i.name,
              parseGuestMenuOptionGroups(i.optionGroups)
            ),
            ...(allergenCodes.length > 0 ? { allergenCodes } : {}),
          };
        }),
      }))}
    />
  );
}
