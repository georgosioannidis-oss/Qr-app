#!/usr/bin/env node
/**
 * Station auto-print agent.
 *
 * Generates a PDF ticket per order, saves it locally, and optionally sends the PDF
 * to a print command.
 */

import { spawn } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const BASE =
  process.env.PRINT_AGENT_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "";
const TOKEN = process.env.PRINT_AGENT_TOKEN || "";
const POLL_MS = Math.max(3000, parseInt(process.env.PRINT_AGENT_POLL_MS || "5000", 10) || 5000);
const PRINT_CMD = process.env.PRINT_COMMAND || "";
const STATION = (process.env.PRINT_AGENT_STATION || "").trim().toLowerCase();
const PDF_DIR = process.env.PRINT_AGENT_PDF_DIR || path.join(process.cwd(), "print-agent-pdfs");
const FONT_PATH = process.env.PRINT_AGENT_FONT_PATH || "";
const COUNTER_FILE =
  process.env.PRINT_AGENT_COUNTER_FILE || path.join(PDF_DIR, `${STATION}-ticket-counter.txt`);
const STATION_LABELS = {
  bar: "BAR",
  "cold-kitchen": "COLD KITCHEN",
  kitchen: "KITCHEN",
};
let nextTicketNumber = null;

if (!BASE || !TOKEN || !STATION_LABELS[STATION]) {
  console.error(
    "Missing PRINT_AGENT_BASE_URL (or NEXT_PUBLIC_APP_URL), PRINT_AGENT_TOKEN, or PRINT_AGENT_STATION.\n" +
      "Create a token under Dashboard → Options → Auto-print, then:\n" +
      "  export PRINT_AGENT_BASE_URL=https://your-app.com\n" +
      "  export PRINT_AGENT_TOKEN=...\n" +
      "  export PRINT_AGENT_STATION=bar | cold-kitchen | kitchen\n" +
      "  export PRINT_AGENT_PDF_DIR=./print-agent-pdfs\n" +
      "  npm run print-agent"
  );
  process.exit(1);
}

function money(cents) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function wrapLine(text, width, indent = "") {
  const source = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!source) return [indent];
  const words = source.split(" ");
  const rows = [];
  let current = indent;
  const max = Math.max(8, width);

  for (const word of words) {
    if (current.trim().length === 0) {
      if ((indent + word).length <= max) {
        current = indent + word;
      } else {
        rows.push(...chunkLongWord(word, max, indent));
        current = indent;
      }
      continue;
    }
    const next = `${current} ${word}`;
    if (next.length <= max) {
      current = next;
      continue;
    }
    rows.push(current);
    if ((indent + word).length <= max) {
      current = indent + word;
    } else {
      rows.push(...chunkLongWord(word, max, indent));
      current = indent;
    }
  }
  if (current.trim().length > 0) rows.push(current);
  return rows;
}

function chunkLongWord(word, width, indent = "") {
  const rows = [];
  const avail = Math.max(1, width - indent.length);
  for (let i = 0; i < word.length; i += avail) {
    rows.push(indent + word.slice(i, i + avail));
  }
  return rows;
}

function formatTicketLines(order) {
  const w = 42;
  const rows = [];
  rows.push("=".repeat(w));
  rows.push(...wrapLine(order.restaurantName.toUpperCase(), w));
  rows.push(...wrapLine(`${order.stationLabel.toUpperCase()} TICKET`, w));
  rows.push("=".repeat(w));
  rows.push(...wrapLine(`Table: ${order.tableName}`, w));
  rows.push(...wrapLine(`Status: ${order.status}`, w));
  rows.push(...wrapLine(new Date(order.createdAt).toLocaleString(), w));
  rows.push(...wrapLine(`Ticket #: ${order.ticketNumber}`, w));
  rows.push(...wrapLine(`Order: ${order.id}`, w));
  rows.push("-".repeat(w));

  const sectioned = [];
  if (STATION === "kitchen" || STATION === "cold-kitchen") {
    const cold = order.items.filter((it) => it.routedStation === "Cold kitchen");
    const hot = order.items.filter((it) => it.routedStation !== "Cold kitchen");
    if (cold.length > 0) sectioned.push({ title: "COLD KITCHEN ITEMS", items: cold });
    if (hot.length > 0) sectioned.push({ title: "KITCHEN ITEMS", items: hot });
  } else {
    sectioned.push({ title: null, items: order.items });
  }

  for (const section of sectioned) {
    if (section.title) {
      rows.push(...wrapLine(section.title, w));
      rows.push("-".repeat(w));
    }
    for (const it of section.items) {
      const extra = [it.notes, it.selectedOptionsSummary].filter(Boolean).join(" · ");
      rows.push(...wrapLine(`${it.quantity}x ${it.name}`, w));
      if (extra) rows.push(...wrapLine(extra, w, "  "));
      rows.push(...wrapLine(money(it.unitPrice * it.quantity), w));
    }
  }
  rows.push("-".repeat(w));
  rows.push(...wrapLine(`STATION TOTAL ${money(order.stationTotalAmount)}`, w));
  rows.push(...wrapLine(`FULL ORDER ${money(order.totalAmount)}`, w));
  rows.push("=".repeat(w));
  return rows;
}

function sanitizeFilePart(value) {
  return String(value)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 64);
}

/**
 * pdf-lib standard fonts use WinAnsi; replace unsupported Unicode chars so
 * ticket generation never crashes on menu items/table names.
 */
function toWinAnsiSafeText(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

function buildTicketFileName(order) {
  const ts = new Date(order.createdAt).toISOString().replace(/[:.]/g, "-");
  const table = sanitizeFilePart(order.tableName);
  const idShort = sanitizeFilePart(order.id).slice(0, 10);
  const station = sanitizeFilePart(STATION);
  return `${ts}_${station}_${table}_${idShort}.pdf`;
}

async function loadPdfFont(doc) {
  const candidates = [
    FONT_PATH,
    "C:\\Windows\\Fonts\\arial.ttf",
    "C:\\Windows\\Fonts\\segoeui.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  ].filter(Boolean);

  doc.registerFontkit(fontkit);
  for (const fontPath of candidates) {
    try {
      await access(fontPath);
      const bytes = await readFile(fontPath);
      const font = await doc.embedFont(bytes, { subset: true });
      return { font, unicode: true, fontPath };
    } catch {
      // Try next candidate.
    }
  }

  const fallback = await doc.embedFont(StandardFonts.Courier);
  return { font: fallback, unicode: false, fontPath: null };
}

async function renderTicketPdf(order) {
  const doc = await PDFDocument.create();
  let page = doc.addPage([226.77, 700]); // 80mm thermal-like width
  const fontInfo = await loadPdfFont(doc);
  const font = fontInfo.font;

  const rows = formatTicketLines(order);
  const fontSize = 9;
  const lineHeight = 11.5;
  let y = page.getHeight() - 24;

  for (const row of rows) {
    if (y < 24) {
      y = page.getHeight() - 24;
      page = doc.addPage([226.77, 700]);
    }
    const text = fontInfo.unicode ? row : toWinAnsiSafeText(row);
    page.drawText(text, {
      x: 12,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight;
  }
  return { bytes: await doc.save(), fontPath: fontInfo.fontPath, usingUnicode: fontInfo.unicode };
}

async function writeTicketPdf(order) {
  await mkdir(PDF_DIR, { recursive: true });
  const filePath = path.join(PDF_DIR, buildTicketFileName(order));
  const rendered = await renderTicketPdf(order);
  await writeFile(filePath, Buffer.from(rendered.bytes));
  return { filePath, fontPath: rendered.fontPath, usingUnicode: rendered.usingUnicode };
}

async function readLastTicketNumber() {
  try {
    const raw = await readFile(COUNTER_FILE, "utf8");
    const n = Number.parseInt(raw.trim(), 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

async function reserveNextTicketNumber() {
  if (nextTicketNumber == null) {
    const last = await readLastTicketNumber();
    nextTicketNumber = last + 1;
  }
  const current = nextTicketNumber;
  nextTicketNumber += 1;
  await mkdir(path.dirname(COUNTER_FILE), { recursive: true });
  await writeFile(COUNTER_FILE, String(current), "utf8");
  return current;
}

function sendPdfToPrinter(pdfFilePath) {
  if (!PRINT_CMD) {
    console.log(`PDF saved: ${pdfFilePath}`);
    return Promise.resolve(true);
  }

  const escapedPath = `"${pdfFilePath.replace(/"/g, '\\"')}"`;
  const command = PRINT_CMD.includes("{file}")
    ? PRINT_CMD.replaceAll("{file}", escapedPath)
    : `${PRINT_CMD} ${escapedPath}`;

  return new Promise((resolve) => {
    const child = spawn(command, { shell: true, stdio: ["ignore", "inherit", "inherit"] });
    child.on("error", (err) => {
      console.error("Print command failed:", err.message);
      resolve(false);
    });
    child.on("close", (code) => resolve(code === 0));
  });
}

async function fetchPending() {
  const res = await fetch(`${BASE}/api/print-agent/pending?station=${encodeURIComponent(STATION)}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (res.status === 401) {
    console.error("Unauthorized — check PRINT_AGENT_TOKEN.");
    return null;
  }
  if (!res.ok) {
    console.error("pending HTTP", res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return Array.isArray(data.orders) ? data.orders : [];
}

async function ack(orderId) {
  const res = await fetch(`${BASE}/api/print-agent/ack`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ orderId, stationKey: STATION }),
  });
  return res.ok;
}

async function tick() {
  const orders = await fetchPending();
  if (orders == null) return;
  for (const order of orders) {
    const ticketNumber = await reserveNextTicketNumber();
    const printableOrder = { ...order, ticketNumber };
    const { filePath, fontPath, usingUnicode } = await writeTicketPdf(printableOrder);
    if (!usingUnicode) {
      console.error("Unicode font not found; ticket text may show ? characters.");
    } else if (fontPath) {
      console.error(`PDF font: ${fontPath}`);
    }
    const ok = await sendPdfToPrinter(filePath);
    if (!ok) {
      console.error("Skipping ack for", order.id, "(print failed)");
      continue;
    }
    const acked = await ack(order.id);
    if (!acked) console.error("Ack failed for", order.id, "(will retry next poll)");
  }
}

console.error(`Print agent polling ${BASE} for ${STATION_LABELS[STATION]} every ${POLL_MS}ms`);
console.error(`PDF output folder: ${PDF_DIR}`);
console.error(`Ticket counter file: ${COUNTER_FILE}`);
if (PRINT_CMD) {
  console.error(`Print command enabled: ${PRINT_CMD}`);
  console.error('Use "{file}" placeholder to control argument position.');
} else {
  console.error("PRINT_COMMAND not set. Agent will only save PDF files.");
}
await tick();
setInterval(tick, POLL_MS);
