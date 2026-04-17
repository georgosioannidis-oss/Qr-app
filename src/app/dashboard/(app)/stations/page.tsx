import Link from "next/link";
import { StationsManager } from "./StationsManager";

export default function StationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink mb-2">Stations</h1>
        <p className="max-w-3xl text-ink-muted">
          Create preparation stations (e.g. Bar, Kitchen, Cold Kitchen) and assign them to menu categories or
          individual items. For the split prep screens under{" "}
          <Link href="/dashboard/orders" className="font-semibold text-primary underline">
            Orders
          </Link>
          , use station names <strong>Bar</strong>, <strong>Kitchen</strong>, and <strong>Cold Kitchen</strong>{" "}
          (case-insensitive; typo <strong>Cold Kicthen</strong> is recognised). The{" "}
          <strong>Kitchen</strong> view also lists items with no station (default kitchen routing).
        </p>
      </div>
      <StationsManager />
    </div>
  );
}
