/**
 * Id for `/m/[token]` guest device session (localStorage). Used when placing orders
 * and loading "Your orders".
 *
 * `crypto.randomUUID()` is not available on plain `http://` (non-localhost) in several
 * browsers (secure-context only). VPS deployments often use HTTP first, so we fall
 * back to `getRandomValues` (allowed on insecure origins) or a last-resort string.
 */
export function createGuestSessionId(): string {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === "function") {
    try {
      return c.randomUUID();
    } catch {
      /* secure-context restriction or other runtime failure */
    }
  }
  if (c && typeof c.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}
