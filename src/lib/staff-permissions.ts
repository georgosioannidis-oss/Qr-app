import type { AppDashboardSession } from "./app-session";
import {
  FLOOR_ROLE,
  KITCHEN_ROLE,
  STAFF_GRANULAR_ROLE,
  WAITER_ROLE,
} from "./dashboard-roles";
import { isOwnerCapableRole } from "./restaurant-user-policy";

export const DASHBOARD_SECTION_IDS = [
  "overview",
  "menu",
  "tables",
  "stations",
  "orders",
  "waitStaff",
  "office",
  "branding",
] as const;

export type DashboardSectionId = (typeof DASHBOARD_SECTION_IDS)[number];

export type StaffPermissionsMap = Record<DashboardSectionId, boolean>;

export const SECTION_LABELS: Record<DashboardSectionId, string> = {
  overview: "Overview",
  menu: "Menu",
  tables: "Tables",
  stations: "Stations (order routing)",
  orders: "Orders (prep / active queue)",
  waitStaff: "Waiter",
  office: "Office (sales, team, invites)",
  branding: "Options (theme, routing, logo)",
};

export function emptyStaffPermissions(): StaffPermissionsMap {
  return {
    overview: false,
    menu: false,
    tables: false,
    stations: false,
    orders: false,
    waitStaff: false,
    office: false,
    branding: false,
  };
}

export function parseStaffPermissions(raw: unknown): StaffPermissionsMap | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const out = emptyStaffPermissions();
  for (const key of DASHBOARD_SECTION_IDS) {
    if (typeof o[key] === "boolean") out[key] = o[key];
  }
  return out;
}

export function staffPermissionsHasAny(p: StaffPermissionsMap): boolean {
  return DASHBOARD_SECTION_IDS.some((k) => p[k]);
}

export type ResolvedDashboardAccess = {
  overview: boolean;
  menu: boolean;
  tables: boolean;
  stations: boolean;
  orders: boolean;
  waitStaff: boolean;
  office: boolean;
  branding: boolean;
  /** Owner tab accounts and legacy owner-capable roles (not granular `staff`). */
  isTrueOwner: boolean;
};

/**
 * Accept / decline incoming guest orders (wait staff queue). Matches {@link requireWaitStaffApiAccess} waiter gate,
 * including granular `staff` accounts with `waitStaff` in permissions — unlike role-only helpers on legacy roles.
 */
export function sessionCanRelayIncomingGuestOrders(session: AppDashboardSession): boolean {
  if (!session?.user?.restaurantId) return false;
  return resolveDashboardAccess({
    role: session.user.role ?? "",
    permissions: session.user.permissions,
  }).waitStaff;
}

export function resolveDashboardAccess(user: {
  role: string;
  permissions: unknown;
}): ResolvedDashboardAccess {
  const role = user.role;
  const parsed = parseStaffPermissions(user.permissions);

  if (role === STAFF_GRANULAR_ROLE && parsed) {
    return {
      overview: parsed.overview,
      menu: parsed.menu,
      tables: parsed.tables,
      stations: parsed.stations ?? parsed.menu,
      orders: parsed.orders,
      waitStaff: parsed.waitStaff,
      office: parsed.office,
      branding: parsed.branding,
      isTrueOwner: false,
    };
  }

  if (isOwnerCapableRole(role)) {
    return {
      overview: true,
      menu: true,
      tables: true,
      stations: true,
      orders: true,
      waitStaff: true,
      office: true,
      branding: true,
      isTrueOwner: true,
    };
  }

  const k = role === KITCHEN_ROLE || role === FLOOR_ROLE;
  const w = role === WAITER_ROLE || role === FLOOR_ROLE;

  return {
    overview: false,
    menu: false,
    tables: false,
    stations: false,
    orders: k,
    waitStaff: w,
    office: false,
    branding: false,
    isTrueOwner: false,
  };
}

/** `basePath` = `/{slug}/dashboard` — first path the user may open for that restaurant. */
export function defaultDashboardHome(
  access: ResolvedDashboardAccess,
  basePath: string
): string {
  if (access.isTrueOwner) return basePath;
  if (access.overview) return basePath;
  if (access.waitStaff) return `${basePath}/wait-staff`;
  if (access.orders) return `${basePath}/orders`;
  if (access.menu) return `${basePath}/menu`;
  if (access.tables) return `${basePath}/tables`;
  if (access.office || access.branding) return `${basePath}/office`;
  return `${basePath}/orders`;
}

/** Path guard: returns redirect target if `pathname` is not allowed. */
export function pathNotAllowedRedirect(
  pathname: string,
  access: ResolvedDashboardAccess,
  basePath: string
): string | null {
  if (access.isTrueOwner) return null;

  const on = (sectionBase: string) =>
    pathname === sectionBase || pathname.startsWith(`${sectionBase}/`);

  /** Must run before `on(.../orders)` — print URLs live under `.../orders/print`. */
  if (pathname.startsWith(`${basePath}/orders/print/`)) {
    if (!access.orders && !access.waitStaff) return defaultDashboardHome(access, basePath);
    return null;
  }

  if (on(`${basePath}/menu`) && !access.menu) return defaultDashboardHome(access, basePath);
  if (on(`${basePath}/tables`) && !access.tables) return defaultDashboardHome(access, basePath);
  if (on(`${basePath}/stations`) && !access.stations) return defaultDashboardHome(access, basePath);
  if (on(`${basePath}/orders`) && !access.orders) return defaultDashboardHome(access, basePath);
  if (on(`${basePath}/wait-staff`) && !access.waitStaff) return defaultDashboardHome(access, basePath);
  if (on(`${basePath}/office`) && !access.office) return defaultDashboardHome(access, basePath);
  if (on(`${basePath}/branding`) && !access.branding) return defaultDashboardHome(access, basePath);
  if (pathname === basePath || pathname === `${basePath}/`) {
    if (!access.overview) return defaultDashboardHome(access, basePath);
    return null;
  }

  if (on(`${basePath}/menu`) && access.menu) return null;
  if (on(`${basePath}/tables`) && access.tables) return null;
  if (on(`${basePath}/stations`) && access.stations) return null;
  if (on(`${basePath}/orders`) && access.orders) return null;
  if (on(`${basePath}/wait-staff`) && access.waitStaff) return null;
  if (on(`${basePath}/office`) && access.office) return null;
  if (on(`${basePath}/branding`) && access.branding) return null;

  if (pathname.startsWith(basePath)) {
    return defaultDashboardHome(access, basePath);
  }

  return null;
}

export function normalizeInvitePermissions(
  body: Record<string, unknown>
): StaffPermissionsMap | null {
  const p = body.permissions;
  if (p === undefined || p === null) return null;
  if (typeof p !== "object" || Array.isArray(p)) return null;
  const out = emptyStaffPermissions();
  const o = p as Record<string, unknown>;
  for (const key of DASHBOARD_SECTION_IDS) {
    if (typeof o[key] === "boolean") out[key] = o[key];
  }
  return out;
}
