import { GuestOrderingPauseCard } from "../GuestOrderingPauseCard";
import { OrdersList } from "../OrdersList";
import { OrdersViewNav } from "../OrdersViewNav";

export default function OrdersBarQueuePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink mb-2">Bar queue</h1>
        <p className="text-ink-muted">Only lines assigned to the Bar station (e.g. drinks).</p>
      </div>
      <OrdersViewNav />
      <GuestOrderingPauseCard />
      <OrdersList stationPreset="bar" />
    </div>
  );
}
