import { redirect } from "next/navigation";

/** `/dashboard` without slug — send users to sign-in (middleware redirects signed-in users to `/{slug}/dashboard`). */
export default function DashboardRootPage() {
  redirect("/dashboard/login");
}
