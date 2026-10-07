// The tally under every page: a few stupid facts about the whole collection, and the way from cafe to
// cafe that the tour and the footer's map draw.
import type { CatalogPin, TourStop, TourYear } from './catalog';
import { daysBetween, kmBetween, onlyYear } from './journey';

/** Price and weight are not recorded per pin: what a Hard Rock pin usually costs and weighs. */
const PRICE_USD = 12;
const EUR_PER_USD = 0.86;
const GRAMS_PER_PIN = [15, 20] as const;
const EARTH_CIRCUMFERENCE_KM = 40_075;

export const visitOf = (stop: TourStop) => (stop.kind === 'pin' ? stop.pin : stop.missing);

/** Every stop whose order is known (not only its year), oldest first. */
export const knownStops = (tour: TourYear[]): TourStop[] =>
  tour
    .toReversed()
    .flatMap((year) => year.stops)
    .filter((stop) => !onlyYear(visitOf(stop).date));

/** From cafe to cafe as the crow flies: the way to each stop from the one before, by its slug. */
export function legsOf(stops: TourStop[]): Map<string, number> {
  const legs = new Map<string, number>();
  stops.forEach((stop, i) => {
    const km = i > 0 ? kmBetween(visitOf(stops[i - 1]), visitOf(stop)) : 0;
    // A second pin from the same cafe is no way at all.
    if (km > 0) legs.set(visitOf(stop).slug, km);
  });
  return legs;
}

/** Long ways to the nearest thousand: nobody flies 58,213 km as the crow flies. */
export const roughKm = (km: number): number => (km >= 10_000 ? Math.round(km / 1000) * 1000 : km);

/** One stupid fact, as a badge: "58,000" "km", "cafe to cafe, 1.4× around the Earth". */
export interface Fact {
  value: string;
  unit: string;
  label: string;
}

const number = (n: number) => n.toLocaleString('en');
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export function tallyOf(pins: CatalogPin[], tour: TourYear[]): Fact[] {
  const facts: Fact[] = [];
  const origins = (origin: CatalogPin['origin']) => pins.filter((pin) => pin.origin === origin).length;
  const bought = origins('bought');
  const traded = origins('traded');
  const gifts = origins('gift');
  const how = [
    bought && `${bought} bought`,
    traded && `${traded} traded`,
    gifts && (gifts === 1 ? '1 a gift' : `${gifts} gifts`),
  ].filter(Boolean);
  facts.push({ value: number(pins.length), unit: pins.length === 1 ? 'pin' : 'pins', label: how.join(', ') || 'in the collection' });

  const km = [...legsOf(knownStops(tour)).values()].reduce((sum, leg) => sum + leg, 0);
  if (km > 0) {
    const laps = km / EARTH_CIRCUMFERENCE_KM;
    const label = laps >= 1 ? `cafe to cafe, ${laps.toFixed(1)}× around the Earth` : 'from cafe to cafe';
    facts.push({ value: number(roughKm(km)), unit: 'km', label });
  }

  if (bought > 0) {
    const euros = bought * PRICE_USD * EUR_PER_USD;
    facts.push({
      value: `~€${number(roundTo(euros, euros >= 100 ? 10 : 1))}`,
      unit: 'spent',
      label: `$${PRICE_USD} a pin, about €${Math.round(PRICE_USD * EUR_PER_USD)}`,
    });
  }

  const [light, heavy] = GRAMS_PER_PIN;
  facts.push({
    value: `~${number(roundTo((pins.length * (light + heavy)) / 2, 10))}`,
    unit: 'grams',
    label: `${light}–${heavy} g a pin`,
  });

  // From cafe pin to cafe pin (a side find is no Hard Rock pin), only between two whose day is known: a
  // month alone would make the wait up. Pins known only by their year are left out, as on the tour:
  // where they fall within the year is unknown.
  const oldestFirst = pins.toReversed().filter((pin) => pin.kind === 'hard-rock' && !onlyYear(pin.date));
  const waits = oldestFirst.slice(1).map((pin, i) => daysBetween(oldestFirst[i].date, pin.date) ?? 0);
  const longest = Math.max(0, ...waits);
  if (longest > 0) facts.push({ value: number(longest), unit: 'days', label: 'the longest wait for a pin' });

  return facts;
}
