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
import { parseGuestMenuOptionGroups } from "@/lib/parse-guest-menu-option-groups";
import { parseEnabledLocales } from "@/lib/locale-config";
import { MenuView } from "./MenuView";
import type { TranslationMap } from "./MenuView";

export const revalidate = 30;

export default async function TableMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paid?: string; cancel?: string; qr?: string; wifi_required?: string }>;
}) {
  const { token } = await params;
  const { paid, qr, wifi_required } = await searchParams;
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
    table.orderingWindowNonce,
    jar.get(GUEST_QR_ACCESS_COOKIE)?.value
  );
  if (!hasCurrentAccess) {
    if (wifi_required === "1") {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface">
          <div className="max-w-md w-full rounded-3xl border border-border bg-card p-8 shadow-sm text-center">
            <h2 className="text-xl font-bold text-ink mb-3 leading-snug">
              Connect to {table.restaurant.name} WiFi to order
            </h2>
            <p className="text-base leading-relaxed text-ink-muted sm:text-sm">
              This menu is only available on the restaurant&apos;s WiFi. Connect to the WiFi and scan the QR code again.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface">
        <div className="max-w-md w-full rounded-3xl border border-border bg-card p-8 shadow-sm text-center">
          <h2 className="text-xl font-bold text-ink mb-3 leading-snug">Scan table QR to order</h2>
          <p className="text-base leading-relaxed text-ink-muted sm:text-sm">
            Your ordering access has expired. Scan the QR code at your table again to start a new 15-minute session.
          </p>
        </div>
      </div>
    );
  }

  const enabledLocales = parseEnabledLocales(table.restaurant.enabledLocales);
  const defaultLocale = table.restaurant.defaultLocale ?? "el";

  // Build translation map from loaded data
  const translationMap: TranslationMap = { items: {}, categories: {} };
  for (const cat of table.restaurant.menuCategories) {
    if (cat.translations.length > 0) {
      translationMap.categories[cat.id] = {};
      for (const t of cat.translations) {
        translationMap.categories[cat.id][t.locale] = { name: t.name };
      }
    }
    for (const item of cat.items) {
      if (item.translations.length > 0) {
        translationMap.items[item.id] = {};
        for (const t of item.translations) {
          translationMap.items[item.id][t.locale] = {
            name: t.name,
            description: t.description ?? undefined,
            optionGroups: t.optionGroups ?? undefined,
          };
        }
      }
    }
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
        enabledLocales={enabledLocales}
        defaultLocale={defaultLocale}
        translationMap={translationMap}
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
