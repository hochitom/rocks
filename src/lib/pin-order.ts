import { earliestDay, type PinDate } from './pin-date';

/** Code-point order, independent of the build machine's locale. */
export const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Older first; imprecise dates count as their earliest day. */
export const byDay = (a: { date: PinDate }, b: { date: PinDate }) =>
  compareText(earliestDay(a.date), earliestDay(b.date));

export const bySlug = (a: { slug: string }, b: { slug: string }) => compareText(a.slug, b.slug);

/** Alphabetical order for names a visitor reads (`Zürich` next to `Zurich`, not after `Zz`). */
export const byName = (a: string, b: string) => a.localeCompare(b, 'en');
