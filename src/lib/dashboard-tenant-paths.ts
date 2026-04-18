/** URL segments that cannot be a restaurant slug (other app routes). */
export const TENANT_SLUG_DENYLIST = new Set([
  "m",
  "api",
  "_next",
  "static",
  "join",
  "signup",
  "provision",
  "dashboard",
  "favicon.ico",
]);

export function tenantDashboardBase(slug: string): string {
  return `/${encodeURIComponent(slug)}/dashboard`;
}

/** @param tail e.g. `/menu`, ``, `/orders/print/x` */
export function tenantDashboardHref(slug: string, tail: string): string {
  const base = tenantDashboardBase(slug);
  if (!tail || tail === "/") return base;
  const p = tail.startsWith("/") ? tail : `/${tail}`;
  return `${base}${p}`;
}

/** Match `/{slug}/dashboard` and `/{slug}/dashboard/...` */
export function parseTenantDashboardPath(pathname: string): { slug: string; rest: string } | null {
  const p = pathname.split("?")[0] || "/";
  const m = p.match(/^\/([^/]+)\/dashboard(?:\/(.*))?$/);
  if (!m) return null;
  const slug = decodeURIComponent(m[1]);
  if (TENANT_SLUG_DENYLIST.has(slug)) return null;
  const rest = m[2] ? `/${m[2]}` : "";
  return { slug, rest };
}

/** Map tenant URL to legacy `/dashboard…` shape for owner/staff cookie routing. */
export function virtualDashboardPathForCookies(pathname: string): string {
  const t = parseTenantDashboardPath(pathname);
  if (t) return "/dashboard" + (t.rest || "");
  return pathname.split("?")[0] || "/";
}
