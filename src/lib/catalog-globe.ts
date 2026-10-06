// The globe's part of the Katalog (ticket 07): cafes and the tour route. Pages get it via `getCatalog()`.
import type { CatalogPin } from './catalog';
import { byDay, byName, bySlug, compareText } from './pin-order';

/** A Hard Rock Cafe on the globe: all pins whose coordinates are identical. */
export interface Cafe {
  /** Stable within a build: the slug of the first pin collected there. */
  id: string;
  city: string;
  cafeName?: string;
  countryCode: string;
  countryName: string;
  lat: number;
  lng: number;
  /** The pins from this cafe, in the order they were collected. */
  pins: CatalogPin[];
}

export interface Globe {
  /** Every cafe once; pins with identical coordinates are one cafe. Ordered by city, then cafe name. */
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
    const key = `${pin.lat},${pin.lng}`;
    let cafe = byCoordinates.get(key);
    if (!cafe) {
      const { slug: id, city, cafeName, countryCode, countryName, lat, lng } = pin;
      cafe = { id, city, cafeName, countryCode, countryName, lat, lng, pins: [] };
      byCoordinates.set(key, cafe);
    }
    cafe.pins.push(pin);
    if (route.at(-1) !== cafe) route.push(cafe);
  }
  const cafes = [...byCoordinates.values()].sort(
    (a, b) => byName(a.city, b.city) || byName(a.cafeName ?? '', b.cafeName ?? '') || compareText(a.id, b.id),
  );
  return { cafes, route };
}
