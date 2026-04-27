import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

const ACCESS_WINDOW_SECONDS = 30 * 60;

export const GUEST_QR_ACCESS_COOKIE = "qr_menu_access";
export const GUEST_QR_ACCESS_MAX_AGE_SEC = ACCESS_WINDOW_SECONDS;

function base64url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function unbase64url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(input: string) {
  const secret =
    process.env.GUEST_QR_ACCESS_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    "local-dev-qr-secret";
  return createHmac("sha256", secret).update(input).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export function createQrProof(tableToken: string) {
  const payload = base64url(`table:${tableToken}`);
  const mac = sign(payload);
  return `${payload}.${mac}`;
}

export function isValidQrProof(tableToken: string, proof: string | null | undefined) {
  if (!proof || typeof proof !== "string") return false;
  const [payload, mac] = proof.split(".");
  if (!payload || !mac) return false;
  const expectedMac = sign(payload);
  if (!safeEqual(mac, expectedMac)) return false;
  try {
    const decoded = unbase64url(payload);
    return decoded === `table:${tableToken}`;
  } catch {
    return false;
  }
}

export function createAccessToken(tableToken: string, now = Date.now()) {
  const exp = Math.floor(now / 1000) + ACCESS_WINDOW_SECONDS;
  const payload = base64url(`${tableToken}|${exp}`);
  const mac = sign(payload);
  return `${payload}.${mac}`;
}

export function verifyAccessToken(tableToken: string, token: string | null | undefined, now = Date.now()) {
  if (!token || typeof token !== "string") return false;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return false;
  const expectedMac = sign(payload);
  if (!safeEqual(mac, expectedMac)) return false;
  try {
    const decoded = unbase64url(payload);
    const [tokenTable, expRaw] = decoded.split("|");
    const exp = Number(expRaw);
    if (tokenTable !== tableToken || !Number.isFinite(exp)) return false;
    return Math.floor(now / 1000) <= exp;
  } catch {
    return false;
  }
}

export function hasGuestQrAccess(req: NextRequest, tableToken: string) {
  const value = req.cookies.get(GUEST_QR_ACCESS_COOKIE)?.value;
  return verifyAccessToken(tableToken, value);
}
