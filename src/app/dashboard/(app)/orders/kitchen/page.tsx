import { GuestOrderingPauseCard } from "../GuestOrderingPauseCard";
import { OrdersList } from "../OrdersList";
import { OrdersViewNav } from "../OrdersViewNav";

export default function OrdersKitchenPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink mb-2">Kitchen</h1>
        <p className="text-ink-muted">
          Shows the combined food queue (Kitchen + Cold Kitchen + default kitchen items), same as Cold kitchen.
        </p>
      </div>
      <OrdersViewNav />
      <GuestOrderingPauseCard />
      <OrdersList stationPreset="full-kitchen" />
    </div>
  );
}
