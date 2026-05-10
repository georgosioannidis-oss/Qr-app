import { NextRequest, NextResponse } from "next/server";
import { getDashboardServerSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { stationSlug } from "@/lib/print-station-routing";
import { readFile } from "fs/promises";
import path from "path";
import { zipSync } from "fflate";

const enc = (s: string) => new TextEncoder().encode(s);

function buildCmd(restaurantName: string, restaurantSlug: string, station: string, baseUrl: string, apiSecret: string): string {
  const isReceipt = station === "receipt";
  const stationLabel = isReceipt ? "receipt" : station;
  const scriptName = isReceipt ? "START-RECEIPT-PRINTER.cmd" : `START-${station.toUpperCase()}.cmd`;
  const title = isReceipt
    ? `QR Menu receipt printer — ${restaurantName}`
    : `QR Menu print agent — ${station} station — ${restaurantName}`;

  return [
    `@echo off`,
    `REM ${title}`,
    `REM 1) Run "npm install" once in this folder (requires Node 18+).`,
    `REM 2) Double-click ${scriptName} to start. Keep the window open.`,
    ``,
    `REM ---------- Pre-filled — no editing needed ----------`,
    `set "PRINT_AGENT_API_SECRET=${apiSecret}"`,
    `set "PRINT_AGENT_BASE_URL=${baseUrl}"`,
    `set "PRINT_AGENT_RESTAURANT_SLUG=${restaurantSlug}"`,
    `set "PRINT_AGENT_STATION=${stationLabel}"`,
    ``,
    `REM ---------- Optional: auto-send to printer ----------`,
    `set "PRINT_AGENT_PDF_DIR=%USERPROFILE%\\print-agent-pdfs"`,
    `REM set "PRINT_COMMAND=SumatraPDF.exe -print-to-default -silent {file}"`,
    ``,
    `echo.`,
    `echo Starting ${isReceipt ? "receipt printer" : `print agent (${station})`} for ${restaurantName}...`,
    `echo Close this window to stop.`,
    `echo.`,
    ``,
    `node "%~dp0print-agent.mjs"`,
    `pause`,
  ].join("\r\n");
}

function buildReadme(restaurantName: string, station: string): string {
  const isReceipt = station === "receipt";
  const cmdFile = isReceipt ? "START-RECEIPT-PRINTER.cmd" : `START-${station.toUpperCase()}.cmd`;
  return [
    `QR Menu — Print Agent Setup`,
    `===========================`,
    `Restaurant : ${restaurantName}`,
    `Station    : ${station}`,
    ``,
    `QUICK START`,
    `-----------`,
    `1. Install Node.js 18+ if not already installed.`,
    `   Download: https://nodejs.org`,
    ``,
    `2. Open a terminal / command prompt in THIS folder and run:`,
    `      npm install`,
    `   (only needed once)`,
    ``,
    `3. Double-click  ${cmdFile}  to start the agent.`,
    `   Keep the window open — close it to stop printing.`,
    ``,
    `PDFs are saved to:  %USERPROFILE%\\print-agent-pdfs\\`,
    ``,
    `AUTOMATIC PRINTING`,
    `------------------`,
    `To send each PDF straight to your printer, edit the .cmd file and`,
    `uncomment the PRINT_COMMAND line, replacing SumatraPDF.exe with`,
    `the path to SumatraPDF on this PC.`,
    `Download SumatraPDF: https://www.sumatrapdfreader.org`,
    ``,
    `UPDATE`,
    `------`,
    `When a new version is available, re-download the ZIP from the`,
    `dashboard and replace print-agent.mjs + package.json.`,
    `Your .cmd file can stay — it does not need to be replaced.`,
  ].join("\r\n");
}

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

  // For non-receipt stations, verify the station exists
  if (stationParam !== "receipt") {
    const stations = await prisma.station.findMany({
      where: { restaurantId },
      select: { name: true },
    });
    const matched = stations.find((s) => stationSlug(s.name) === stationParam);
    if (!matched) return NextResponse.json({ error: "Station not found" }, { status: 404 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ??
    `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const apiSecret = process.env.PRINT_AGENT_API_SECRET?.trim() ?? "";

  // Read print-agent files from the project directory
  const agentDir = path.join(process.cwd(), "print-agent-standalone");
  let printAgentMjs: Uint8Array;
  let packageJson: Uint8Array;
  try {
    printAgentMjs = new Uint8Array(await readFile(path.join(agentDir, "print-agent.mjs")));
    packageJson = new Uint8Array(await readFile(path.join(agentDir, "package.json")));
  } catch {
    return NextResponse.json({ error: "Print agent files not found on server" }, { status: 500 });
  }

  const isReceipt = stationParam === "receipt";
  const cmdFileName = isReceipt ? "START-RECEIPT-PRINTER.cmd" : `START-${stationParam.toUpperCase()}.cmd`;
  const zipFileName = isReceipt ? "receipt-printer-setup.zip" : `${stationParam}-printer-setup.zip`;

  const cmdContent = buildCmd(restaurant.name, restaurant.slug, stationParam, baseUrl, apiSecret);
  const readmeContent = buildReadme(restaurant.name, stationParam);

  const zipped = zipSync({
    "print-agent.mjs": [printAgentMjs, { level: 6 }],
    "package.json": [packageJson, { level: 6 }],
    [cmdFileName]: [enc(cmdContent), { level: 6 }],
    "README.txt": [enc(readmeContent), { level: 6 }],
  });

  return new NextResponse(zipped, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipFileName}"`,
    },
  });
}
