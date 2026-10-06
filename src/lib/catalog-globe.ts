// The globe's part of the Katalog (ticket 07): cafes and the tour route. Pages get it via `getCatalog()`.
import type { CatalogPin } from './catalog';
import type { PinKind } from './pin-kind';
import { byDay, byName, bySlug, compareText } from './pin-order';

/**
 * A Hard Rock Cafe on the globe: all its pins, i.e. all Hard Rock pins whose coordinates are identical.
 * The place of side finds is one too (`kind: 'side-find'`), never merged with a cafe at the same spot.
 */
export interface Cafe {
  /** Stable within a build: the slug of the first pin collected there. */
  id: string;
  kind: PinKind;
  /** The city for a cafe, the title of its first side find for a side find's place. */
  name: string;
  city: string;
  place?: string;
  countryCode: string;
  countryName: string;
  lat: number;
  lng: number;
  /** The pins from this cafe, in the order they were collected. */
  pins: CatalogPin[];
}

export interface Globe {
  /** Every cafe once; pins of one kind with identical coordinates are one cafe. Ordered by name, then place. */
  cafes: Cafe[];
  /** The cafes in the order they were visited, without the same cafe twice in a row. */
  route: Cafe[];
}

export function globeOf(pins: CatalogPin[]): Globe {
  // Imprecise dates count as their earliest day, ties go by slug (as everywhere else).
  const chronological = [...pins].sort((a, b) => byDay(a, b) || bySlug(a, b));
  const byCoordinates = new Map<string, Cafe>();
  const route: Cafe[] = [];
  for (const pin of chronological) {
    const key = `${pin.kind}:${pin.lat},${pin.lng}`;
    let cafe = byCoordinates.get(key);
    if (!cafe) {
      const { slug: id, kind, name, city, place, countryCode, countryName, lat, lng } = pin;
      cafe = { id, kind, name, city, place, countryCode, countryName, lat, lng, pins: [] };
      byCoordinates.set(key, cafe);
    }
    cafe.pins.push(pin);
    if (route.at(-1) !== cafe) route.push(cafe);
  }
  const cafes = [...byCoordinates.values()].sort(
    (a, b) => byName(a.name, b.name) || byName(a.place ?? '', b.place ?? '') || compareText(a.id, b.id),
  );
  return { cafes, route };
}
