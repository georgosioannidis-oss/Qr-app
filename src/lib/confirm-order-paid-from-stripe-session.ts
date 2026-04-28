import { prisma } from "@/lib/prisma";

/**
 * Stripe Checkout success hits `/m/.../order/...?paid=1` before the webhook may run.
 * Orders stay `pending` + `stripeSessionId` until `paid`, and the print agent skips that state.
 * If the webhook is slow or misconfigured, confirming here unblocks kitchen tickets.
 */
export async function confirmOrderPaidIfStripeSessionComplete(orderId: string): Promise<void> {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, stripeSessionId: true },
  });
  if (!order || order.status !== "pending" || !order.stripeSessionId) return;

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(key);
    const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
    if (session.payment_status === "paid") {
      await prisma.order.updateMany({
        where: { id: orderId, status: "pending" },
        data: { status: "paid", paidAt: new Date() },
      });
    }
  } catch {
    // Webhook may still deliver; avoid breaking the status page.
  }
}
