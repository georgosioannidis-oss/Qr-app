export type ScheduleWindow = { start: string; end: string };

/** Minutes since midnight (0–1439) for the current moment in the given IANA timezone. */
export function nowMinutesInTz(tz: string): number {
  const now = new Date();
  // toLocaleString in a specific timezone gives us a parseable local date string
  const local = new Date(now.toLocaleString("en-US", { timeZone: tz }));
  return local.getHours() * 60 + local.getMinutes();
}

/** "HH:MM" → minutes since midnight */
function hhmm(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Returns true if `nowMinutes` falls inside at least one window.
 * Overnight windows (end < start) are handled: active when now >= start OR now < end.
 * Empty array → always active (no restriction).
 */
export function isCategoryActiveNow(windows: ScheduleWindow[], nowMinutes: number): boolean {
  if (windows.length === 0) return true;
  return windows.some(({ start, end }) => {
    const s = hhmm(start);
    const e = hhmm(end);
    if (s === e) return true; // degenerate window = always active
    if (s < e) return nowMinutes >= s && nowMinutes < e;
    // overnight: active when now >= start (tonight) OR now < end (early morning)
    return nowMinutes >= s || nowMinutes < e;
  });
}

/** Parse the raw DB string; returns [] on null / invalid JSON. */
export function parseScheduleWindows(raw: string | null | undefined): ScheduleWindow[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (w): w is ScheduleWindow =>
        w && typeof w.start === "string" && typeof w.end === "string"
    );
  } catch {
    return [];
  }
}
