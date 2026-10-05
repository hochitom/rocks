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
