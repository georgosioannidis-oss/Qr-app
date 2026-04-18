"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RestaurantOnboardingForm() {
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName: restaurantName.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const text = await res.text();
      let data: { error?: string; slug?: string } = {};
      try {
        if (text) data = JSON.parse(text);
      } catch {
        if (!res.ok) setError("Invalid response from server");
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      const slugQ = data.slug ? `&slug=${encodeURIComponent(data.slug)}` : "";
      const cbQ =
        data.slug && typeof data.slug === "string"
          ? `&callbackUrl=${encodeURIComponent(`/${encodeURIComponent(data.slug)}/dashboard`)}`
          : "";
      router.push(`/dashboard/login?signedup=1${slugQ}${cbQ}`);
    } catch {
      setError(
        "Connection failed. Make sure the app is running (npm run dev) and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-[1.65rem] font-semibold leading-tight text-ink sm:text-2xl">
          Create your restaurant account
        </h1>
        <p className="mb-6 text-center text-base leading-relaxed text-ink-muted sm:text-sm">
          Create your venue and an <strong>owner</strong> login. Add kitchen and wait staff later under{" "}
          <strong>Office</strong> with their own emails.
        </p>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-black/5 bg-white p-6 shadow-sm"
        >
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-base leading-relaxed text-red-700 sm:text-sm">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="restaurantName" className="mb-1 block text-base font-medium text-ink sm:text-sm">
              Restaurant name
            </label>
            <input
              id="restaurantName"
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              required
              className="w-full min-h-[48px] rounded-lg border border-black/10 px-3 py-2.5 text-base text-ink sm:min-h-0 sm:py-2 sm:text-sm"
              placeholder="e.g. Bella Italia"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="mb-1 block text-base font-medium text-ink sm:text-sm">
                Your first name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
                className="w-full min-h-[48px] rounded-lg border border-black/10 px-3 py-2.5 text-base text-ink sm:min-h-0 sm:py-2 sm:text-sm"
                placeholder="Alex"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="mb-1 block text-base font-medium text-ink sm:text-sm">
                Your last name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="family-name"
                className="w-full min-h-[48px] rounded-lg border border-black/10 px-3 py-2.5 text-base text-ink sm:min-h-0 sm:py-2 sm:text-sm"
                placeholder="Kim"
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-base font-medium text-ink sm:text-sm">
              Owner email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full min-h-[48px] rounded-lg border border-black/10 px-3 py-2.5 text-base text-ink sm:min-h-0 sm:py-2 sm:text-sm"
              placeholder="you@restaurant.com"
            />
          </div>

          <div className="space-y-4 border-t border-black/10 pt-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted sm:text-xs">Password</p>
            <div>
              <label htmlFor="owner-password" className="mb-1 block text-base font-medium text-ink sm:text-sm">
                Password
              </label>
              <input
                id="owner-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full min-h-[48px] rounded-lg border border-black/10 px-3 py-2.5 text-base text-ink sm:min-h-0 sm:py-2 sm:text-sm"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-base font-medium text-ink sm:text-sm">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full min-h-[48px] rounded-lg border border-black/10 px-3 py-2.5 text-base text-ink sm:min-h-0 sm:py-2 sm:text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] rounded-lg bg-primary py-3 text-base font-semibold text-white hover:bg-primary-hover disabled:opacity-60 sm:min-h-0 sm:py-2.5 sm:text-sm"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-center text-base text-ink-muted sm:text-sm">
          Already have an account?{" "}
          <Link href="/dashboard/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
