import { GuestOrderingPauseCard } from "../GuestOrderingPauseCard";
import { OrdersList } from "../OrdersList";
import { OrdersViewNav } from "../OrdersViewNav";

export default function OrdersColdKitchenPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink mb-2">Cold kitchen</h1>
        <p className="text-ink-muted">
          Shows the combined food queue (Kitchen + Cold Kitchen + default kitchen items), same as Kitchen.
        </p>
      </div>
      <OrdersViewNav />
      <GuestOrderingPauseCard />
      <OrdersList stationPreset="cold-kitchen" />
    </div>
  );
}
