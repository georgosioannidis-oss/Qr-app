import { notFound, redirect } from "next/navigation";
import { getDashboardServerSession } from "@/lib/auth-server";
import { isPureKitchenRole } from "@/lib/dashboard-roles";
import { loadCustomerTableWithMenuByToken } from "@/lib/load-customer-table";
import { resolvedMenuItemAllergenCodes } from "@/lib/merge-menu-allergens";
import { restaurantUsesStripeCheckout } from "@/lib/restaurant-checkout";
import { ensureMinTwoPeopleOptionGroup } from "@/lib/min-two-people-option";
import { parseGuestMenuOptionGroups } from "@/lib/parse-guest-menu-option-groups";
import { StaffOrderView } from "./StaffOrderView";

export default async function StaffOrderPage({
  params,
}: {
  params: Promise<{ slug: string; tableToken: string }>;
}) {
  const { slug, tableToken } = await params;
  const session = await getDashboardServerSession();
  if (!session?.user) redirect(`/${slug}/dashboard/login`);
  if (isPureKitchenRole(session.user.role)) redirect(`/${slug}/dashboard`);

  const table = await loadCustomerTableWithMenuByToken(tableToken);
  if (!table || table.restaurant.slug !== slug) notFound();

  const menu = table.restaurant.menuCategories.filter((c) => c.items.length > 0);
  const usesOnlineCheckout = restaurantUsesStripeCheckout(table.restaurant);

  return (
    <StaffOrderView
      restaurantSlug={slug}
      tableName={table.name}
      tableToken={tableToken}
      usesOnlineCheckout={usesOnlineCheckout}
      payAtTableCardEnabled={table.restaurant.payAtTableCardEnabled === true}
      payAtTableCashEnabled={table.restaurant.payAtTableCashEnabled === true}
      categories={menu.map((c) => ({
        id: c.id,
        name: c.name,
        items: c.items.map((i) => {
          const allergenCodes = resolvedMenuItemAllergenCodes(i.name, i.allergenCodes);
          return {
            id: i.id,
            name: i.name,
            price: i.price,
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
