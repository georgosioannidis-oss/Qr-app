import { NextRequest, NextResponse } from "next/server";
import { getDashboardServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { stationSlug } from "@/lib/print-station-routing";

/**
 * GET /api/dashboard/print-agent-download?station=<stationSlug>
 * Authenticated dashboard route — returns a pre-filled Windows .cmd startup script for the given station.
 */
export async function GET(req: NextRequest) {
  const session = await getDashboardServerSession(req);
  const restaurantId = session?.user?.restaurantId;
  if (!restaurantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stationParam = (req.nextUrl.searchParams.get("station") ?? "").trim();
  if (!stationParam) return NextResponse.json({ error: "station required" }, { status: 400 });

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { slug: true, name: true },
  });
  if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });

  const stations = await prisma.station.findMany({
    where: { restaurantId },
    select: { name: true },
  });
  const matched = stations.find((s) => stationSlug(s.name) === stationParam);
  if (!matched) return NextResponse.json({ error: "Station not found" }, { status: 404 });

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ??
    `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  const apiSecret = process.env.PRINT_AGENT_API_SECRET?.trim() ?? "";

  // Special case: receipt printer CMD (no station lookup needed)
  if (stationParam === "receipt") {
    const cmd = [
      `@echo off`,
      `REM QR Menu receipt printer — ${restaurant.name}`,
      `REM Prints a full customer receipt (all items + total) for every new order.`,
      `REM 1) Place this file in your print-agent-standalone folder (next to print-agent.mjs).`,
      `REM 2) In the print-agent-standalone folder, run "npm install" once in a terminal.`,
      `REM 3) Double-click this file to start. Leave the window open.`,
      ``,
      `REM ---------- Pre-filled — no editing needed ----------`,
      `set "PRINT_AGENT_API_SECRET=${apiSecret}"`,
      `set "PRINT_AGENT_BASE_URL=${baseUrl}"`,
      `set "PRINT_AGENT_RESTAURANT_SLUG=${restaurant.slug}"`,
      `set "PRINT_AGENT_STATION=receipt"`,
      ``,
      `REM ---------- Usually leave these as-is ----------`,
      `set "PRINT_AGENT_PDF_DIR=%USERPROFILE%\\print-agent-pdfs"`,
      `REM To send each receipt to a printer automatically, uncomment and fix the next line:`,
      `REM set "PRINT_COMMAND=SumatraPDF.exe -print-to-default -silent {file}"`,
      ``,
      `echo.`,
      `echo Starting receipt printer for ${restaurant.name}... (close this window to stop)`,
      `echo.`,
      ``,
      `node "%~dp0print-agent.mjs"`,
      `pause`,
    ].join("\r\n");

    return new NextResponse(cmd, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="START-RECEIPT-PRINTER.cmd"`,
      },
    });
  }

  const cmd = [
    `@echo off`,
    `REM QR Menu print agent — ${matched.name} station — ${restaurant.name}`,
    `REM 1) Place this file in your print-agent-standalone folder (next to print-agent.mjs).`,
    `REM 2) In the print-agent-standalone folder, run "npm install" once in a terminal.`,
    `REM 3) Double-click this file to start. Leave the window open.`,
    ``,
    `REM ---------- Pre-filled — no editing needed ----------`,
    `set "PRINT_AGENT_API_SECRET=${apiSecret}"`,
    `set "PRINT_AGENT_BASE_URL=${baseUrl}"`,
    `set "PRINT_AGENT_RESTAURANT_SLUG=${restaurant.slug}"`,
    `set "PRINT_AGENT_STATION=${stationParam}"`,
    ``,
    `REM ---------- Usually leave these as-is ----------`,
    `set "PRINT_AGENT_PDF_DIR=%USERPROFILE%\\print-agent-pdfs"`,
    `REM To send each ticket to a printer automatically, uncomment and fix the next line:`,
    `REM set "PRINT_COMMAND=SumatraPDF.exe -print-to-default -silent {file}"`,
    ``,
    `echo.`,
    `echo Starting print agent for ${matched.name}... (close this window to stop)`,
    `echo.`,
    ``,
    `node "%~dp0print-agent.mjs"`,
    `pause`,
  ].join("\r\n");

  const filename = `START-${stationParam.toUpperCase()}.cmd`;
  return new NextResponse(cmd, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
