"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard/orders", label: "All orders" },
  { href: "/dashboard/orders/bar", label: "Bar" },
  { href: "/dashboard/orders/cold-kitchen", label: "Cold kitchen" },
  { href: "/dashboard/orders/kitchen", label: "Kitchen" },
] as const;

function linkClass(active: boolean) {
  return `min-h-[40px] inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
    active ? "bg-primary text-white shadow-sm ring-1 ring-black/10" : "border border-border bg-card text-ink hover:bg-surface"
  }`;
}

export function OrdersViewNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Order queue views">
      {LINKS.map(({ href, label }) => {
        const active =
          href === "/dashboard/orders"
            ? pathname === "/dashboard/orders"
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
