"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { tenantDashboardHref } from "@/lib/dashboard-tenant-paths";

type Station = { id: string; name: string };

function linkClass(active: boolean) {
  return `min-h-[40px] inline-flex items-center whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
    active
      ? "bg-primary text-white shadow-sm ring-1 ring-black/10"
      : "border border-border bg-card text-ink hover:bg-surface"
  }`;
}

export function OrdersViewNav() {
  const pathname = usePathname();
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const [stations, setStations] = useState<Station[]>([]);

  useEffect(() => {
    if (!slug) return;
    fetch("/api/dashboard/stations")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setStations(data);
      })
      .catch(() => {});
  }, [slug]);

  const allOrdersHref = slug ? tenantDashboardHref(slug, "/orders") : "";

  return (
    <nav
      className="flex gap-2 overflow-x-auto pb-1"
      aria-label="Order queue views"
    >
      <Link href={allOrdersHref} prefetch className={linkClass(pathname === allOrdersHref)}>
        All orders
      </Link>
      {stations.map((station) => {
        const href = tenantDashboardHref(slug, `/orders/station/${station.id}`);
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={station.id} href={href} prefetch className={linkClass(active)}>
            {station.name}
          </Link>
        );
      })}
    </nav>
  );
}
