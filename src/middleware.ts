/**
 * Guest menu: `/m/…`. Staff dashboard: `/{restaurantSlug}/dashboard/…` (legacy `/dashboard/…` redirects here).
 */
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sessionTokenCookieName, shouldUseSecureAuthCookies } from "@/lib/auth-cookies";
import { pickDashboardSession, resolveDashboardPathnameForApi } from "@/lib/dashboard-session-pick";
import {
  parseTenantDashboardPath,
  tenantDashboardHref,
  virtualDashboardPathForCookies,
} from "@/lib/dashboard-tenant-paths";
import { CUSTOMER_PATHNAME_HEADER } from "@/lib/load-customer-table";

const DASHBOARD_PATH_HEADER = "x-dashboard-path";
const DASHBOARD_SESSION_PATH_HEADER = "x-dashboard-session-path";
const MOUSTAKALLIS_CUSTOM_HOSTS = new Set([
  "moustakallis-tavern-menu.com",
  "www.moustakallis-tavern-menu.com",
]);
const MOUSTAKALLIS_SLUG = "moustakallis";
const SHARED_LOGIN_BASE_URL =
  process.env.SHARED_LOGIN_BASE_URL?.trim() || "http://46.224.113.33:3000";
const SHARED_LOGIN_HOSTNAME = (() => {
  try {
    return new URL(SHARED_LOGIN_BASE_URL).hostname.toLowerCase();
  } catch {
    return "46.224.113.33";
  }
})();

function moustakallisDashboardUrl(req: NextRequest): string {
  const u = req.nextUrl.clone();
  u.protocol = "https:";
  u.host = "moustakallis-tavern-menu.com";
  u.pathname = `/${MOUSTAKALLIS_SLUG}/dashboard`;
  u.search = "";
  return u.toString();
}

/** DB slug renamed from `demo-restaurant` → `moustakallis`; JWT may still carry the old value until re-login. */
function canonicalDashboardRestaurantSlug(slug: string): string {
  return slug === "demo-restaurant" ? "moustakallis" : slug;
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0];
  const isMoustakallisCustomHost = MOUSTAKALLIS_CUSTOM_HOSTS.has(host);

  if (isMoustakallisCustomHost) {
    const isSharedLoginPath =
      path === "/dashboard/login" || path.startsWith("/dashboard/login/");

    if (path === "/" || path === "") {
      const target = new URL(`${SHARED_LOGIN_BASE_URL}/dashboard/login`);
      target.searchParams.set("callbackUrl", moustakallisDashboardUrl(req));
      return NextResponse.redirect(target, 301);
    }

    if (isSharedLoginPath) {
      const target = new URL(`${SHARED_LOGIN_BASE_URL}/dashboard/login`);
      const callback = req.nextUrl.searchParams.get("callbackUrl");
      if (callback) target.searchParams.set("callbackUrl", callback);
      else target.searchParams.set("callbackUrl", moustakallisDashboardUrl(req));
      return NextResponse.redirect(target, 301);
    }

    if (path === "/dashboard" || path === "/dashboard/") {
      const u = req.nextUrl.clone();
      u.pathname = `/${MOUSTAKALLIS_SLUG}/dashboard`;
      return NextResponse.redirect(u, 301);
    }

    if (path.startsWith("/dashboard/")) {
      const u = req.nextUrl.clone();
      u.pathname = `/${MOUSTAKALLIS_SLUG}${path}`;
      return NextResponse.redirect(u, 301);
    }

    const tenantPath = parseTenantDashboardPath(path);
    if (tenantPath && tenantPath.slug !== MOUSTAKALLIS_SLUG) {
      const u = req.nextUrl.clone();
      u.pathname = tenantDashboardHref(MOUSTAKALLIS_SLUG, tenantPath.rest || "");
      return NextResponse.redirect(u, 301);
    }
  }

  if (path === "/demo-restaurant" || path.startsWith("/demo-restaurant/")) {
    const u = req.nextUrl.clone();
    u.pathname = "/moustakallis" + path.slice("/demo-restaurant".length);
    return NextResponse.redirect(u);
  }

  if (path.startsWith("/m/")) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set(CUSTOMER_PATHNAME_HEADER, path);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  if (path.startsWith("/api/dashboard")) {
    const ref = req.headers.get("referer") ?? "";
    const sessionPath = resolveDashboardPathnameForApi(ref);
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set(DASHBOARD_SESSION_PATH_HEADER, sessionPath);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  const tenantFloor = parseTenantDashboardPath(path);
  if (
    tenantFloor &&
    (tenantFloor.rest === "/floor" || tenantFloor.rest.startsWith("/floor/"))
  ) {
    const u = req.nextUrl.clone();
    u.pathname = tenantDashboardHref(
      tenantFloor.slug,
      "/wait-staff" + tenantFloor.rest.slice("/floor".length)
    );
    return NextResponse.redirect(u);
  }

  const tenant = parseTenantDashboardPath(path);
  const flatDashboardProtected =
    path.startsWith("/dashboard") &&
    !path.startsWith("/dashboard/login") &&
    path !== "/dashboard" &&
    path !== "/dashboard/";
  const flatDashboardRoot = path === "/dashboard" || path === "/dashboard/";
  const needsAuth = tenant !== null || flatDashboardProtected || flatDashboardRoot;

  if (!needsAuth) {
    return NextResponse.next();
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    const login = new URL("/dashboard/login", req.url);
    login.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(login);
  }

  const secureCookie = shouldUseSecureAuthCookies();
  const [owner, staff] = await Promise.all([
    getToken({
      req,
      secret,
      cookieName: sessionTokenCookieName("owner"),
      secureCookie,
    }),
    getToken({
      req,
      secret,
      cookieName: sessionTokenCookieName("staff"),
      secureCookie,
    }),
  ]);

  const virtualPick = (p: string) => pickDashboardSession(virtualDashboardPathForCookies(p), owner, staff);

  if (path === "/dashboard/floor" || path.startsWith("/dashboard/floor/")) {
    const { jwt } = virtualPick(path);
    const raw = typeof jwt?.restaurantSlug === "string" ? jwt.restaurantSlug : "";
    const slug = raw ? canonicalDashboardRestaurantSlug(raw) : "";
    if (slug) {
      const u = req.nextUrl.clone();
      const after = path.slice("/dashboard/floor".length);
      u.pathname = tenantDashboardHref(slug, "/wait-staff" + after);
      return NextResponse.redirect(u);
    }
    const login = new URL("/dashboard/login", req.url);
    login.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(login);
  }

  if (flatDashboardProtected) {
    const { jwt } = virtualPick(path);
    if (!jwt) {
      const login = new URL("/dashboard/login", req.url);
      login.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(login);
    }
    const raw = typeof jwt.restaurantSlug === "string" ? jwt.restaurantSlug : "";
    const slug = raw ? canonicalDashboardRestaurantSlug(raw) : "";
    if (!slug) {
      const login = new URL("/dashboard/login", req.url);
      login.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(login);
    }
    const tail = path.slice("/dashboard".length);
    if (host === SHARED_LOGIN_HOSTNAME && slug === MOUSTAKALLIS_SLUG) {
      const u = req.nextUrl.clone();
      u.protocol = "https:";
      u.host = "moustakallis-tavern-menu.com";
      u.pathname = tenantDashboardHref(slug, tail && tail !== "/" ? tail : "");
      return NextResponse.redirect(u);
    }
    const u = req.nextUrl.clone();
    u.pathname = tenantDashboardHref(slug, tail && tail !== "/" ? tail : "");
    return NextResponse.redirect(u);
  }

  if (flatDashboardRoot) {
    const { jwt } = virtualPick("/dashboard");
    if (!jwt) {
      const login = new URL("/dashboard/login", req.url);
      return NextResponse.redirect(login);
    }
    const raw = typeof jwt.restaurantSlug === "string" ? jwt.restaurantSlug : "";
    const slug = raw ? canonicalDashboardRestaurantSlug(raw) : "";
    if (!slug) {
      const login = new URL("/dashboard/login", req.url);
      return NextResponse.redirect(login);
    }
    if (host === SHARED_LOGIN_HOSTNAME && slug === MOUSTAKALLIS_SLUG) {
      const u = req.nextUrl.clone();
      u.protocol = "https:";
      u.host = "moustakallis-tavern-menu.com";
      u.pathname = tenantDashboardHref(slug, "");
      return NextResponse.redirect(u);
    }
    const u = req.nextUrl.clone();
    u.pathname = tenantDashboardHref(slug, "");
    return NextResponse.redirect(u);
  }

  if (tenant) {
    const { jwt } = virtualPick(path);
    if (!jwt) {
      const login = new URL("/dashboard/login", req.url);
      login.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(login);
    }
    const rawRs = typeof jwt.restaurantSlug === "string" ? jwt.restaurantSlug : "";
    const rs = rawRs ? canonicalDashboardRestaurantSlug(rawRs) : "";
    if (!rs) {
      const login = new URL("/dashboard/login", req.url);
      login.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(login);
    }
    if (tenant.slug !== rs) {
      const u = req.nextUrl.clone();
      u.pathname = tenantDashboardHref(rs, tenant.rest || "");
      return NextResponse.redirect(u);
    }
    if (host === SHARED_LOGIN_HOSTNAME && rs === MOUSTAKALLIS_SLUG) {
      const u = req.nextUrl.clone();
      u.protocol = "https:";
      u.host = "moustakallis-tavern-menu.com";
      u.pathname = tenantDashboardHref(rs, tenant.rest || "");
      return NextResponse.redirect(u);
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set(DASHBOARD_PATH_HEADER, path);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/m/:path*",
    "/api/dashboard/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/:slug/dashboard",
    "/:slug/dashboard/:path*",
  ],
};
