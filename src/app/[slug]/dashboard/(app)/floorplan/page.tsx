import { redirect } from "next/navigation";
import { getDashboardServerSession } from "@/lib/auth-server";
import { hasWaitStaffAccess, isPureKitchenRole } from "@/lib/dashboard-roles";
import { tenantDashboardHref } from "@/lib/dashboard-tenant-paths";
import { FloorPlanCanvas } from "./FloorPlanCanvas";

export default async function FloorPlanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getDashboardServerSession();
  if (!session?.user?.restaurantId) redirect("/dashboard/login");
  if (isPureKitchenRole(session.user.role)) redirect(tenantDashboardHref(slug, "/orders"));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-ink mb-1">Floor Plan</h1>
        <p className="text-sm text-ink-muted">
          Drag tables to match your venue layout. Click a table to see its active orders.
        </p>
      </div>
      <FloorPlanCanvas />
    </div>
  );
}
