"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useMemo } from "react";
import { tenantDashboardHref } from "@/lib/dashboard-tenant-paths";

function linkClass(active: boolean) {
  return `min-h-[40px] inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
    active ? "bg-primary text-white shadow-sm ring-1 ring-black/10" : "border border-border bg-card text-ink hover:bg-surface"
  }`;
}

export function OrdersViewNav() {
  const pathname = usePathname();
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";

  const LINKS = useMemo(
    () =>
      slug
        ? ([
            { href: tenantDashboardHref(slug, "/orders"), label: "All orders" },
            { href: tenantDashboardHref(slug, "/orders/bar"), label: "Bar" },
            { href: tenantDashboardHref(slug, "/orders/cold-kitchen"), label: "Cold kitchen" },
            { href: tenantDashboardHref(slug, "/orders/kitchen"), label: "Kitchen" },
          ] as const)
        : [],
    [slug]
  );

  const allOrdersHref = slug ? tenantDashboardHref(slug, "/orders") : "";

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Order queue views">
      {LINKS.map(({ href, label }) => {
        const active =
          href === allOrdersHref
            ? pathname === allOrdersHref
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} prefetch className={linkClass(active)}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
