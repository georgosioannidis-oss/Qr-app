import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { shouldUseSecureAuthCookies } from "@/lib/auth-cookies";
import {
  ONBOARDING_GATE_COOKIE_NAME,
  ONBOARDING_GATE_COOKIE_VALUE,
} from "@/lib/onboarding-gate";

function expectedGatePassword(): string {
  return (process.env.RESTAURANT_ONBOARDING_GATE_PASSWORD ?? "Apoelapoel04").trim();
}

function passwordMatches(input: string): boolean {
  const a = Buffer.from(expectedGatePassword(), "utf8");
  const b = Buffer.from(input, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const password =
    typeof body === "object" && body !== null && "password" in body
      ? String((body as { password: unknown }).password ?? "")
      : "";
  if (!passwordMatches(password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ONBOARDING_GATE_COOKIE_NAME, ONBOARDING_GATE_COOKIE_VALUE, {
    httpOnly: true,
    secure: shouldUseSecureAuthCookies(),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
