/** A pin's date as the collector knows it: `YYYY`, `YYYY-MM` or `YYYY-MM-DD`. */
export type PinDate = string;

const PIN_DATE_PATTERN = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Year, month and day as numbers, or `undefined` if the text doesn't have the pin date shape. */
function dateParts(date: string) {
  const match = PIN_DATE_PATTERN.exec(date);
  if (!match) return undefined;
  const [, year, month, day] = match;
  return { year: Number(year), month: month ? Number(month) : undefined, day: day ? Number(day) : undefined };
}

function parts(date: PinDate) {
  const result = dateParts(date);
  if (!result) throw new Error(`Invalid pin date "${date}"`);
  return result;
}

/** True if the text is a pin date naming a real year, month and day. */
export function isPinDate(date: string): boolean {
  const result = dateParts(date);
  if (!result) return false;
  const { year, month = 1, day = 1 } = result;
  const asDate = new Date(Date.UTC(year, month - 1, day));
  return asDate.getUTCFullYear() === year && asDate.getUTCMonth() === month - 1 && asDate.getUTCDate() === day;
}

/** The earliest day the date can mean (`2015` → `2015-01-01`), for sorting. */
export function earliestDay(date: PinDate): string {
  const { year, month = 1, day = 1 } = parts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** `14 June 2019`, `June 2019` or `2019`. */
export function formatLong(date: PinDate): string {
  const { year, month, day } = parts(date);
  return [day, month && MONTHS[month - 1], year].filter(Boolean).join(' ');
}

/** `June 2019` or `2019`: a date to the month at most, for spans of time. */
export function formatMonth(date: PinDate): string {
  const { year, month } = parts(date);
  return [month && MONTHS[month - 1], year].filter(Boolean).join(' ');
}

/** When the pin was collected, for a sentence: `on 14 June 2019`, `in June 2019` or `in 2019`. */
export function whenCollected(date: PinDate): string {
  return `${parts(date).day ? 'on' : 'in'} ${formatLong(date)}`;
}

/** The year the date falls in. */
export function yearOf(date: PinDate): number {
  return parts(date).year;
}

/** The date within its year as far as it is known: `Jun 14`, `Dec` or `` (year only). */
export function formatWithinYear(date: PinDate): string {
  const { month, day } = parts(date);
  if (!month) return '';
  const name = MONTHS[month - 1].slice(0, 3);
  return day ? `${name} ${String(day).padStart(2, '0')}` : name;
}
