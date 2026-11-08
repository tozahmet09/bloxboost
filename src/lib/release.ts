// Release dates are whole days, stored as midnight UTC of that day.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Nov 14" */
export function releaseDay(d: Date) {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** Whole days from today (UTC) until the release day. 0 = today. */
export function daysUntil(d: Date, now = new Date()) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((d.getTime() - today) / 864e5);
}

/** "Out Nov 14 · in 6 days" / "Out tomorrow" / "Out today" */
export function releaseLabel(d: Date, now = new Date()) {
  const n = daysUntil(d, now);
  if (n <= 0) return "Out today";
  if (n === 1) return `Out tomorrow · ${releaseDay(d)}`;
  return `Out ${releaseDay(d)} · in ${n} days`;
}

/** Parses an <input type="date"> value. Returns null for empty, undefined for invalid. */
export function parseReleaseDate(v: string): Date | null | undefined {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return undefined;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCDate() === +m[3] ? d : undefined;
}

/** A game is "coming soon" while its release day hasn't started yet (UTC). */
export const isUpcoming = (d: Date | null | undefined, now = new Date()) => !!d && d > now;
