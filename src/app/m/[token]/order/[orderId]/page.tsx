import { notFound } from "next/navigation";
import { confirmOrderPaidIfStripeSessionComplete } from "@/lib/confirm-order-paid-from-stripe-session";
import { prisma } from "@/lib/prisma";
import { OrderStatusView } from "./OrderStatusView";

export const dynamic = "force-dynamic";

export default async function OrderStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string; orderId: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { token, orderId } = await params;
  const { paid } = await searchParams;

  if (paid === "1") {
    await confirmOrderPaidIfStripeSessionComplete(orderId);
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, table: { token } },
    include: {
      table: { select: { name: true } },
      restaurant: { select: { name: true, logoUrl: true, vatRate: true } },
      items: {
        select: {
          quantity: true,
          unitPrice: true,
          optionPriceModifier: true,
          selectedOptionsSummary: true,
          menuItem: { select: { name: true } },
        },
      },
    },
  });

  if (!order) notFound();

  return (
    <OrderStatusView
      orderId={order.id}
      tableToken={token}
      tableName={order.table.name}
      restaurantName={order.restaurant.name}
      restaurantLogoUrl={order.restaurant.logoUrl ?? undefined}
      paidSuccess={paid === "1"}
      totalAmount={order.totalAmount}
      paymentPreference={order.paymentPreference ?? undefined}
      stripeSessionId={order.stripeSessionId ?? undefined}
      vatRate={order.restaurant.vatRate ?? 0}
      orderCreatedAtIso={order.createdAt.toISOString()}
      receiptItems={order.items.map((i) => ({
        name: i.menuItem.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice + (i.optionPriceModifier ?? 0),
        optionsSummary: i.selectedOptionsSummary ?? undefined,
      }))}
    />
  );
}
