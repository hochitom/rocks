// What the map pages hand to the map script: the cafes as markers, the countries I have been to,
// and where the map starts. Built at build time from the Katalog.
import { getImage } from 'astro:assets';
import type { Cafe, CatalogPin, MissingPin } from './catalog';
import { countriesAt } from './map-countries';
import { formatLong } from './pin-date';
import { byDay, byName, bySlug } from './pin-order';
import type { MapCafe, MapData } from '../scripts/pin-map';

/** Under a cafe's name: cafe name (if any) and country; for a side find also its city, as its name is the title. */
export const cafePlace = (cafe: Cafe) =>
  [cafe.place, cafe.kind === 'side-find' && cafe.city, cafe.countryName].filter(Boolean).join(', ');
export const missingPlace = (missing: MissingPin) => [missing.place, missing.countryName].filter(Boolean).join(', ');
/** Missing pins have their own marker ids, which never clash with a cafe's. */
export const missingId = (missing: MissingPin) => `missing-${missing.slug}`;

/** One small cut-out per pin, for markers, card and lists. */
export const thumbOf = async (pin: CatalogPin) => (await getImage({ src: pin.cutout, width: 112, format: 'webp' })).src;

/**
 * The map's data for these cafes and missing pins. `everyPlace` decides which countries are shaded:
 * all places I have been to, also those not on this map.
 */
export async function mapDataOf(
  cafes: Cafe[],
  missingPins: MissingPin[],
  everyPlace: { countryCode: string }[],
  view: MapData['view'],
): Promise<MapData> {
  const markers: MapCafe[] = [
    ...(await Promise.all(
      cafes.map(async (cafe) => ({
        id: cafe.id,
        kind: cafe.kind,
        name: cafe.name,
        place: cafePlace(cafe),
        lat: cafe.lat,
        lng: cafe.lng,
        pins: await Promise.all(
          cafe.pins.map(async (pin) => ({ slug: pin.slug, name: pin.name, date: formatLong(pin.date), image: await thumbOf(pin) })),
        ),
      })),
    )),
    ...[...missingPins]
      .sort((a, b) => byName(a.city, b.city) || byName(a.place ?? '', b.place ?? ''))
      .map((missing) => ({
        id: missingId(missing),
        kind: 'missing' as const,
        name: missing.city,
        place: missingPlace(missing),
        lat: missing.lat,
        lng: missing.lng,
        pins: [],
        visited: formatLong(missing.date),
        closed: missing.closed,
      })),
  ];
  // Stepping through the cafes goes from the newest pin back, like the gallery.
  const newest = (cafe: Cafe) => cafe.pins.at(-1)!;
  const order = [...cafes].sort((a, b) => byDay(newest(b), newest(a)) || bySlug(newest(a), newest(b))).map((cafe) => cafe.id);
  return {
    countries: '/map/countries.json',
    states: '/map/states.json',
    visited: countriesAt(everyPlace),
    cafes: markers,
    order,
    view,
  };
}
