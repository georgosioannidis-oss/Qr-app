# Claude Code — full product backlog & phased workflow

Read this entire file before writing code. **Do not implement multiple epics in one pass.**

---

## How you must work (mandatory)

1. **One epic at a time.** Finish one numbered epic, commit logically, and **stop**.
2. **After each epic**, print a short **“Ready for human testing”** section: what changed, how to test manually, env vars, migrations run.
3. **Wait for the human** to say testing passed (or to request fixes) **before** starting the next epic.
4. **First epic to implement:** **Epic B** (guest QR ordering window + staff “take order manually” link). **Ignore Epic A, C, D, E until B is done and the human says to continue.**

5. **Ask questions before coding each epic (mandatory).** Before you write or change implementation code for **any** epic (including Epic B), output a section titled **“Questions before I implement Epic X”** (use the real epic letter) with **numbered questions** only—clear, concrete, and minimal (typically 5–12 questions). Cover product ambiguities, edge cases, security, data retention, and UX where relevant. **Then stop and wait** for the human’s answers. If the human says **“use reasonable defaults,”** you may state your assumptions in one short bullet list and proceed—but **do not skip** the question round unless the human explicitly opts out for that epic.

6. **Same rule between epics.** When moving to the **next** epic after testing is approved, repeat: **questions first**, then implementation.

### Example themes to ask about (not exhaustive—tailor per epic)

| Epic | Example topics for questions |
|------|------------------------------|
| **B** | When does the 20‑minute window **start** (first page load, first “Add to cart”, token issued)? Can guests **view** menu after expiry? Should staff orders be visually flagged in kitchen? Guest session vs table reset behavior? |
| **A** | Station identity: id vs slug vs name? Migration for old `OrderStationPrintAck` rows? Per-restaurant secret now or later? ZIP contents and secret handling policy? |
| **D** | Single VAT rate per venue vs reduced rates per item? Rounding per line vs invoice total? Show VAT on guest menu or **ticket only**? |
| **E** | Reset = soft-delete archive vs hard delete? Required exports before reset? Report format (CSV/PDF)? Who can access Office—role name? |
| **C** | Which translation provider and env vars? Silent auto-fill vs review step? Fallback locale when translation fails? Character limits for fields? |

Suggested order **after** Epic B is approved:

| Step | Epic | Topic |
|------|------|--------|
| 1 | **B** | QR 20‑minute window + dashboard/staff flow to pick table and place order for customer |
| 2 | **A** | Print agent per store + Options download + dynamic stations (`Station.id`) |
| 3 | **D** | VAT % per restaurant + printed ticket shows net / VAT / total (menu prices VAT-inclusive) |
| 4 | **E** | Office: date-range sales/VAT report for accountant + optional reset (password from **env only**, never hardcode) |
| 5 | **C** | Restaurant language picker + multilingual menu fields + runtime translation (API) |

---

# Epic B — FIRST (guest QR window + staff manual ordering)

## Goals

1. **Guest / QR flow is special:** From the normal table QR link, the customer may only **place an order within a 20‑minute window** (define precisely: from first visit, from scan time, or per session — pick one behavior and document it). After the window, ordering from that guest path is blocked or clearly disabled while **viewing** may still be allowed if the product requires it.

2. **“Take order manually” must keep working** for staff: a **separate, privileged path** (special link / dashboard page) where logged-in staff select a **table** and submit an order **on behalf of the customer**, **without** being limited by the guest 20‑minute QR rule.

3. Security: staff manual ordering requires **dashboard authentication** (and appropriate role: wait staff / manager — match existing `staff-permissions` / dashboard roles). Do not expose a public unauthenticated URL that can create orders.

## Acceptance criteria

- Guest menu accessed via existing table token/QR is subject to the **20‑minute ordering window** rule.
- Staff can open the manual-order UI from the dashboard (or linked route under `[slug]/dashboard/...`), choose a table, build/submit an order like a guest would, and orders appear in kitchen/wait flows as today.
- Automated tests or clear manual steps documented for: inside window (guest can order), outside window (guest cannot), staff path always works.

## Where to search

- Guest menu and ordering: `src/app/m/`, `MenuView.tsx`, table token routes, guest session / localStorage if used.
- Order creation APIs: `src/app/api/` (orders, checkout, tables).
- Dashboard navigation & roles: `src/app/[slug]/dashboard/`, `src/lib/staff-permissions.ts`, `src/lib/dashboard-roles.ts`.

## Implementation notes

- Prefer **server-side enforcement** of the window (not only client UI), using timestamps tied to table session or token issuance as appropriate.
- Manual orders may need a flag on `Order` or use existing staff flows — align with schema and reporting expectations.

---

# Epic A — Print agent per store + dynamic stations

Per-restaurant downloadable print-agent bundle (ZIP/CMD) linked from **dashboard Options** (e.g. near `PrintAgentSection.tsx`). Print-agent API and `print-agent-standalone/print-agent.mjs` must use **each restaurant’s `Station` rows** (stable id recommended), not only `bar` / `cold-kitchen` / `kitchen`.

**Detailed technical checklist** (routing, `pending`/`ack` routes, Prisma `OrderStationPrintAck`, standalone script, `.env.example`) — keep following the sections below under **“Epic A — technical appendix”**.

### Epic A — Current baseline

- `src/lib/print-station-routing.ts` collapses names to three keys.
- `src/app/api/print-agent/pending/route.ts` and `ack/route.ts` validate only those three keys.
- `print-agent-standalone/print-agent.mjs` hardcodes the same three stations.
- `src/lib/print-agent-auth.ts`: single global `PRINT_AGENT_API_SECRET`.

### Epic A — Acceptance criteria

- Two arbitrary stations (e.g. “Grill”, “Desserts”) work as two agent configs; lines route by `Station.id` (or chosen stable key).
- Options UI offers **Download print agent** scoped to that tenant’s slug (and station list documentation).
- Optional: per-restaurant API secret (document migration).

---

# Epic C — Languages + runtime translation

## Goals

- When **creating/configuring a restaurant**, choose enabled languages: English, Greek, Serbian, Russian, French, Polish, German, Spanish, Chinese (minimum set as listed).
- Configure from **dashboard at runtime** (no redeploy for “adding a language”).
- When staff add or edit a menu item in one language, **suggest or fill** other enabled languages via a **translation API** (cost + API keys — use env). Prefer explicit UX (e.g. “Translate” / review) over silent overwrite unless product says otherwise.

## Acceptance criteria

- Guest menu respects restaurant’s enabled locales / fallback chain.
- Translation keys or JSON fields stored in DB; migrations documented.

---

# Epic D — VAT per restaurant (inclusive menu prices)

## Goals

- Per-restaurant **VAT rate** (e.g. Cyprus 19%) configurable in dashboard when creating/editing restaurant.
- Menu prices entered **include VAT**.
- Printed full-order ticket shows **amount before VAT**, **VAT amount**, **total** (consistent cent rounding).

## Acceptance criteria

- Formula documented (gross-inclusive extraction or equivalent).
- Print path updated (`PrintOrderTicket` / payload from `page.tsx`).

---

# Epic E — Office: accountant report + optional reset

## Goals

- **Monthly / arbitrary date range** statement: pick start and end date, download aggregate report (e.g. quantity sold per item / category, revenue, VAT totals suitable for accountant).
- **Reset** “money / orders” counters from office UI behind a **secret** stored only in **environment variables** (or hashed server-side config) — **never** commit real passwords to git. Define whether reset is soft-archive vs hard delete.

## Acceptance criteria

- Export format agreed (CSV/PDF).
- Audit trail or backup recommendation documented before destructive reset.

---

# Epic A — technical appendix (print agent)

### A. Stable station identifiers

Recommend **`Station.id`** as `PRINT_AGENT_STATION` and API `stationKey`; verify station belongs to restaurant on each request.

### B. Server

1. `src/lib/print-station-routing.ts` — restaurant-scoped matching for print agent paths.
2. `src/app/api/print-agent/pending/route.ts` — validate station id belongs to slug’s restaurant; filter lines by resolved station id.
3. `src/app/api/print-agent/ack/route.ts` — same.
4. `OrderStationPrintAck` — document migration from legacy `bar`|`cold-kitchen`|`kitchen` strings.

### C. `print-agent-standalone/print-agent.mjs`

- Dynamic station list or discovery endpoint; `PRINT_AGENT_STATION=all` polls all stations for that restaurant.
- Update README, CMD samples, `.env.example`.

### D. Options UI + ZIP download

- Authenticated route generating per-tenant bundle; no plaintext production secrets embedded without policy.

### Files to search (Epic A)

| Area | Path |
|------|------|
| Routing | `src/lib/print-station-routing.ts` |
| API | `src/app/api/print-agent/pending/route.ts`, `src/app/api/print-agent/ack/route.ts` |
| Auth | `src/lib/print-agent-auth.ts` |
| Schema | `prisma/schema.prisma` → `Station`, `OrderStationPrintAck` |
| Stations API | `src/app/api/dashboard/stations/route.ts` |
| Options UI | `src/app/[slug]/dashboard/(app)/branding/PrintAgentSection.tsx`, `KitchenTicketPrintHint.tsx` |
| Agent | `print-agent-standalone/print-agent.mjs` |

### Epic A — Testing suggestions

- Two stations, place order, poll/ack per station id.
- Regression: `kitchen-queue.ts` / waiter relay alignment.

---

## Prompt you can paste to Claude Code

**First time (Epic B):**

```text
Read CLAUDE.md in the repo root. Follow every mandatory workflow rule including “Questions before each epic.” Start with Epic B only: first output “Questions before I implement Epic B,” wait for my answers, then implement. When implementation is finished, output “Ready for human testing” with steps. Do not start Epic A until I confirm testing passed.
```

**After you test Epic B:**

```text
Epic B testing passed. Move to Epic A per CLAUDE.md. First ask “Questions before I implement Epic A,” wait for my answers, then implement only Epic A. Stop with testing notes when done.
```

**Continuing:**

Use the same pattern for Epic D, E, and C: **questions for that epic → implement → Ready for human testing → wait for confirmation**.
