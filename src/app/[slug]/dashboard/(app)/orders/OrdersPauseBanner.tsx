"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { tenantDashboardHref } from "@/lib/dashboard-tenant-paths";

export function OrdersPauseBanner() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const [paused, setPaused] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/restaurant/guest-ordering-pause")
      .then((r) => r.json())
      .then((d) => setPaused(d.paused === true))
      .catch(() => {});
  }, []);

  if (!paused) return null;

  return (
    <div className="rounded-2xl border border-amber-400/60 bg-amber-500/10 px-4 py-3 group-data-[theme=dark]/dashboard:border-amber-500/45 group-data-[theme=dark]/dashboard:bg-amber-500/15">
      <p className="text-sm font-semibold text-amber-950 group-data-[theme=dark]/dashboard:text-amber-100">
        QR ordering is paused — guests cannot place new orders.{" "}
        {slug && (
          <Link
            href={tenantDashboardHref(slug, "/branding")}
            className="underline underline-offset-2 hover:opacity-80"
          >
            Go to Options to resume.
          </Link>
        )}
      </p>
    </div>
  );
}
