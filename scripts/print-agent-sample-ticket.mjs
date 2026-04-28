#!/usr/bin/env node
/**
 * Prints a demo kitchen ticket to stdout (same 42-column layout as print-agent.mjs).
 * Run: node scripts/print-agent-sample-ticket.mjs
 *      PRINT_AGENT_STATION=bar node scripts/print-agent-sample-ticket.mjs
 */

const STATION = (process.env.PRINT_AGENT_STATION || "kitchen").trim().toLowerCase();

function money(cents) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function chunkLongWord(word, width, indent = "") {
  const rows = [];
  const avail = Math.max(1, width - indent.length);
  for (let i = 0; i < word.length; i += avail) {
    rows.push(indent + word.slice(i, i + avail));
  }
  return rows;
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

const barItems = [
  {
    quantity: 2,
    name: "Aperol Spritz",
    unitPrice: 850,
    notes: "",
    selectedOptionsSummary: "",
    routedStation: "Bar",
  },
];
const kitchenItems = [
  {
    quantity: 1,
    name: "Τζατζίκι",
    unitPrice: 450,
    notes: "",
    selectedOptionsSummary: "",
    routedStation: "Cold kitchen",
  },
  {
    quantity: 2,
    name: "Σουβλάκι χοιρινό",
    unitPrice: 1250,
    notes: "No onion",
    selectedOptionsSummary: "Μέγεθος: Large",
    routedStation: "Kitchen",
  },
  {
    quantity: 1,
    name: "Μουσακάς",
    unitPrice: 850,
    notes: "",
    selectedOptionsSummary: "",
    routedStation: "Kitchen",
  },
];
const items = STATION === "bar" ? barItems : kitchenItems;
const stationTotalAmount = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);

/** Demo payload shaped like GET /api/print-agent/pending */
const order = {
  restaurantName: "Moustakallis Tavern",
  stationLabel: STATION === "bar" ? "Bar" : "Kitchen",
  tableName: "Table 5",
  status: "in_kitchen",
  createdAt: new Date().toISOString(),
  ticketNumber: 42,
  id: "clsample0123456789abcdefghij",
  totalAmount: 4590,
  stationTotalAmount,
  items,
};

console.log(`(sample station=${STATION}, 42 chars wide — thermal text matches this layout)\n`);
console.log(formatTicketLines(order).join("\n"));
