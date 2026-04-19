import { describe, expect, it } from "vitest";
import { dashboardPathRedirect } from "./dashboard-path-guard";

const base = "/moustakallis/dashboard";

describe("dashboardPathRedirect", () => {
  it("allows owner on any dashboard path", () => {
    expect(dashboardPathRedirect(`${base}/office`, "owner")).toBeNull();
    expect(dashboardPathRedirect(`${base}/menu`, "owner")).toBeNull();
  });

  it("redirects kitchen-only from office to orders", () => {
    expect(dashboardPathRedirect(`${base}/office`, "kitchen")).toBe(`${base}/orders`);
    expect(dashboardPathRedirect(`${base}/orders`, "kitchen")).toBeNull();
  });

  it("redirects kitchen from menu and tables", () => {
    expect(dashboardPathRedirect(`${base}/menu`, "kitchen")).toBe(`${base}/orders`);
    expect(dashboardPathRedirect(`${base}/tables`, "kitchen")).toBe(`${base}/orders`);
  });

  it("redirects waiter from orders to wait-staff", () => {
    expect(dashboardPathRedirect(`${base}/orders`, "waiter")).toBe(`${base}/wait-staff`);
    expect(dashboardPathRedirect(`${base}/wait-staff`, "waiter")).toBeNull();
  });

  it("allows floor on orders, wait-staff; redirects from menu and office", () => {
    expect(dashboardPathRedirect(`${base}/orders`, "floor")).toBeNull();
    expect(dashboardPathRedirect(`${base}/wait-staff`, "floor")).toBeNull();
    expect(dashboardPathRedirect(`${base}/menu`, "floor")).toBe(`${base}/wait-staff`);
    expect(dashboardPathRedirect(`${base}/office`, "floor")).toBe(`${base}/wait-staff`);
  });

  it("allows print route for waiter", () => {
    expect(dashboardPathRedirect(`${base}/orders/print/abc`, "waiter")).toBeNull();
  });

  it("respects granular staff permissions", () => {
    const p = {
      overview: false,
      menu: true,
      tables: false,
      orders: false,
      waitStaff: false,
      office: false,
      branding: false,
    };
    expect(dashboardPathRedirect(`${base}/menu`, "staff", p)).toBeNull();
    expect(dashboardPathRedirect(`${base}/office`, "staff", p)).toBe(`${base}/menu`);
  });
});
