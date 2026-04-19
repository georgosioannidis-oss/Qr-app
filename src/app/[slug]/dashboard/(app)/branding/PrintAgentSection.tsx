"use client";

/**
 * Setup copy for station print agents (no per-restaurant token — server uses PRINT_AGENT_API_SECRET).
 */
export function PrintAgentSection({ restaurantSlug }: { restaurantSlug: string }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-base font-semibold text-ink mb-1">Auto-print (kitchen PC)</h2>
      <p className="text-ink-muted text-sm mb-4">
        Run the small <code className="text-xs bg-surface px-1 rounded">print-agent-standalone</code> script on each
        station computer next to its printer. Each copy polls for new orders and prints only that station&apos;s lines
        (bar, cold kitchen, or kitchen). Tickets are built as PDFs first. Station tickets run only after the order is{" "}
        <strong className="text-ink">paid</strong> (or otherwise past <code className="text-xs bg-surface px-1 rounded">pending</code>) and, when{" "}
        <strong className="text-ink">wait staff relay</strong> is on, only after someone sends it to the kitchen from
        the waiter / floor queue — same as the kitchen screens. Staff orders placed while logged into the dashboard skip
        that relay and can print immediately once confirmed.
      </p>
      <p className="text-ink-muted text-sm mb-4">
        Your venue is identified by its dashboard slug (below). The same shared secret must be set on the{" "}
        <strong className="text-ink">server</strong> and on <strong className="text-ink">every</strong> print PC (
        <code className="text-xs bg-surface px-1 rounded">PRINT_AGENT_API_SECRET</code>) — pick a long random string
        once in hosting env, then reuse it in each machine&apos;s startup script. No token to create or rotate in this
        screen.
      </p>

      <ol className="list-decimal list-inside text-sm text-ink-muted space-y-2 mb-4">
        <li>
          On the server (Vercel / Docker / <code className="text-xs bg-surface px-1 rounded">.env</code>): set{" "}
          <code className="text-xs bg-surface px-1 rounded">PRINT_AGENT_API_SECRET</code> to a long random value and
          redeploy or restart.
        </li>
        <li>
          On each kitchen PC: install Node 18+, unzip{" "}
          <code className="text-xs bg-surface px-1 rounded">print-agent-standalone</code>, run{" "}
          <code className="text-xs bg-surface px-1 rounded">npm install</code> once in that folder.
        </li>
        <li>
          <strong className="text-ink">Windows (easiest):</strong> copy{" "}
          <code className="text-xs bg-surface px-1 rounded">START-PRINT-AGENT.example.cmd</code> to{" "}
          <code className="text-xs bg-surface px-1 rounded">START-PRINT-AGENT.cmd</code>, edit the four lines at the top
          (site URL, same secret as server, this venue&apos;s slug, station ={" "}
          <code className="text-xs bg-surface px-1 rounded">bar</code> /{" "}
          <code className="text-xs bg-surface px-1 rounded">cold-kitchen</code> /{" "}
          <code className="text-xs bg-surface px-1 rounded">kitchen</code>), then double-click{" "}
          <code className="text-xs bg-surface px-1 rounded">START-PRINT-AGENT.cmd</code>. Or set the same values as env
          vars and run <code className="text-xs bg-surface px-1 rounded">npm start</code> (see{" "}
          <code className="text-xs bg-surface px-1 rounded">README.txt</code>). Put a shortcut to the{" "}
          <code className="text-xs bg-surface px-1 rounded">.cmd</code> in{" "}
          <code className="text-xs bg-surface px-1 rounded">shell:startup</code> to run at sign-in.
        </li>
        <li>
          Optional: <code className="text-xs bg-surface px-1 rounded">PRINT_COMMAND</code> to send each PDF to the
          printer (see <code className="text-xs bg-surface px-1 rounded">.env.example</code>).
        </li>
      </ol>

      <p className="text-sm text-ink-muted mb-2">
        This venue&apos;s slug (use as <code className="text-xs bg-surface px-1 rounded">PRINT_AGENT_RESTAURANT_SLUG</code>):
      </p>
      <p className="dashboard-copy-mono mb-4 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm text-ink break-all">
        {restaurantSlug}
      </p>

      <p className="text-xs text-ink-muted">
        Details: <code className="rounded bg-surface px-1">print-agent-standalone/README.txt</code> in the repo.
      </p>
    </section>
  );
}
