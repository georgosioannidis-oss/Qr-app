import { GuestOrderingPauseCard } from "../../GuestOrderingPauseCard";
import { OrdersList } from "../../OrdersList";
import { OrdersViewNav } from "../../OrdersViewNav";

export default async function OrdersStationPage({
  params,
}: {
  params: Promise<{ slug: string; stationId: string }>;
}) {
  const { stationId } = await params;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink mb-2">Station queue</h1>
        <p className="text-ink-muted">Orders with items assigned to this station. Refreshes every 15 seconds.</p>
      </div>
      <OrdersViewNav />
      <GuestOrderingPauseCard />
      <OrdersList stationId={stationId} />
    </div>
  );
}
