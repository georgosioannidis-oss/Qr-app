import type { NextRequest } from "next/server";
import { headers } from "next/headers";

function baseFromEnv(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/$/, "");
}

function joinBaseFromHeaderGetter(get: (name: string) => string | null): string {
  const rawHost = get("x-forwarded-host") ?? get("host");
  const host = rawHost?.split(",")[0]?.trim() ?? "";
  if (!host) return "";
  const protoRaw = get("x-forwarded-proto")?.trim() ?? "";
  const proto =
    protoRaw === "http" || protoRaw === "https"
      ? protoRaw
      : process.env.VERCEL
        ? "https"
        : "http";
  return `${proto}://${host}`;
}

/**
 * Full URL for `/join/[token]`.
 * Uses `NEXT_PUBLIC_APP_URL` when set; otherwise the current request host (so copied links work when shared).
 */
export async function staffJoinUrl(token: string): Promise<string> {
  const env = baseFromEnv();
  if (env) return `${env}/join/${token}`;
  const h = await headers();
  const base = joinBaseFromHeaderGetter((name) => h.get(name));
  if (base) return `${base}/join/${token}`;
  return `/join/${token}`;
}

/** Same as {@link staffJoinUrl} but uses a `Request` (e.g. Route Handlers). */
export function staffJoinUrlFromRequest(req: NextRequest, token: string): string {
  const env = baseFromEnv();
  if (env) return `${env}/join/${token}`;
  const base = joinBaseFromHeaderGetter((name) => req.headers.get(name));
  if (base) return `${base}/join/${token}`;
  return `/join/${token}`;
}

const LOCAL_APP_ORIGIN_RE =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

/**
 * Public site origin (no trailing slash) for absolute guest/dashboard links.
 * Uses `NEXT_PUBLIC_APP_URL` when it is set and not a loopback URL; otherwise
 * uses the current request host (so QR codes match the domain you opened the dashboard on).
 */
export function publicAppOriginFromRequest(req: NextRequest): string {
  const env = baseFromEnv();
  const fromReq = joinBaseFromHeaderGetter((name) => req.headers.get(name)).replace(
    /\/$/,
    ""
  );
  const envIsUsable = env && !LOCAL_APP_ORIGIN_RE.test(env);
  if (envIsUsable) return env;
  if (fromReq) return fromReq;
  if (env) return env;
  return "http://localhost:3000";
}

