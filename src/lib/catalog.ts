import type { ImageMetadata } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { CONTINENTS, continentOf, countryName, type Continent } from './countries';
import type { PinOrigin } from './pin-origin';
import { earliestDay, yearOf, type PinDate } from './pin-date';

/** A pin with everything derived from its file. */
export interface CatalogPin {
  slug: string;
  city: string;
  countryCode: string;
  countryName: string;
  continent: Continent;
  date: PinDate;
  /** The cafe's own name, if the city has more than one (e.g. "Universal CityWalk"). */
  cafeName?: string;
  /** The series the pin belongs to (e.g. "City shield"). */
  series?: string;
  /** How the pin came into the collection. */
  origin?: PinOrigin;
  /** The cafe has closed for good. */
  closed: boolean;
  /** The cut-out photo of the pin's front (from the photo processing). */
  cutout: ImageMetadata;
  /** What the 3D viewer builds the pin from (from the photo processing). */
  model: PinModel;
  entry: CollectionEntry<'pins'>;
}

/** The files the 3D viewer builds a pin from in the browser. */
export interface PinModel {
  /** URL of the outline (`Array<{ outer: [x, y][]; holes: [x, y][][] }>`, x, y ∈ [-0.5, 0.5], y up). */
  outline: string;
  /** The photo of the front with its colour smeared out to the edge. */
  texture: ImageMetadata;
  /** Relief map (normal map) derived from the photo's brightness. */
  normal: ImageMetadata;
  /** The metal of rim and back. */
  rim: RimMetal;
}

export type RimMetal = 'gold' | 'silver';

export type { PinOrigin } from './pin-origin';

/** One year of the tour: the pins collected that year, in the order they were collected. */
export interface TourYear {
  year: number;
  pins: CatalogPin[];
}

export interface Neighbours {
  /** The next older pin. */
  previous?: CatalogPin;
  /** The next newer pin. */
  next?: CatalogPin;
}

/** The size of the collection, for the intro sentence. */
export interface Stats {
  pins: number;
  countries: number;
  /** The year of the oldest pin. */
  firstYear: number;
}

/** Everything the pages show, derived from the validated pins. Pages read pin data only from here. */
export interface Catalog {
  /** Gallery order: newest first; imprecise dates count as their earliest day, ties go by slug. */
  pins: CatalogPin[];
  /** The continents the pins come from, alphabetically: the gallery's filter. */
  continents: Continent[];
  stats: Stats;
  /** Timeline: newest year first, within a year oldest first; imprecise dates count as their earliest day, ties go by slug. */
  tour: TourYear[];
  neighbours(slug: string): Neighbours;
  /** Globe: every cafe once; pins with identical coordinates are one cafe. Ordered by city, then cafe name. */
  cafes: Cafe[];
  /** Globe: the cafes in the order they were visited, without the same cafe twice in a row. */
  route: Cafe[];
}

export function createCatalog(entries: CollectionEntry<'pins'>[]): Catalog {
  const pins = entries
    .map((entry) => ({
      slug: entry.id,
      city: entry.data.city,
      countryCode: entry.data.country,
      countryName: countryName(entry.data.country),
      continent: continentOf(entry.data.country),
      date: entry.data.date,
      cafeName: entry.data.cafeName,
      series: entry.data.series,
      origin: entry.data.origin,
      closed: entry.data.closed,
      cutout: cutoutOf(entry.id),
      model: modelOf(entry.id),
      entry,
    }))
    .sort((a, b) => byDay(b, a) || bySlug(a, b));

  return {
    pins,
    continents: CONTINENTS.filter((continent) => pins.some((pin) => pin.continent === continent)),
    stats: {
      pins: pins.length,
      countries: new Set(pins.map((pin) => pin.countryCode)).size,
      firstYear: Math.min(...pins.map((pin) => yearOf(pin.date))),
    },
    tour: groupByYear(pins),
    neighbours(slug) {
      const index = pins.findIndex((pin) => pin.slug === slug);
      if (index === -1) throw new Error(`No pin "${slug}"`);
      return { previous: pins[index + 1], next: pins[index - 1] };
    },
    ...globeOf(pins),
  };
}

/** Groups pins in gallery order (newest first) by year; within a year the pins go chronologically. */
function groupByYear(newestFirst: CatalogPin[]): TourYear[] {
  const tour: TourYear[] = [];
  for (const pin of newestFirst) {
    const year = yearOf(pin.date);
    if (tour.at(-1)?.year !== year) tour.push({ year, pins: [] });
    tour.at(-1)!.pins.push(pin);
  }
  for (const { pins } of tour) {
    pins.sort((a, b) => byDay(a, b) || bySlug(a, b));
  }
  return tour;
}

const cutouts = new Map(
  Object.entries(import.meta.glob<ImageMetadata>('@pins/*/cutout.png', { eager: true, import: 'default' })).map(
    ([path, image]) => [path.split('/').at(-2), image],
  ),
);

function cutoutOf(slug: string): ImageMetadata {
  const cutout = cutouts.get(slug);
  if (!cutout) throw new Error(`Pin "${slug}" has no cutout.png: run npm run process-pin -- ${slug}`);
  return cutout;
}

// ---- 3D model files ----

/** Files from `@pins/<slug>/<file>`, by slug. */
const filesBySlug = <T,>(files: Record<string, T>) =>
  new Map(Object.entries(files).map(([path, file]) => [path.split('/').at(-2), file]));
const outlines = filesBySlug(
  // `no-inline`: small outlines would otherwise end up as data URLs in every page that lists them.
  import.meta.glob<string>('@pins/*/outline.json', { eager: true, query: '?url&no-inline', import: 'default' }),
);
const textures = filesBySlug(import.meta.glob<ImageMetadata>('@pins/*/texture.jpg', { eager: true, import: 'default' }));
const normals = filesBySlug(import.meta.glob<ImageMetadata>('@pins/*/normal.png', { eager: true, import: 'default' }));
const metas = filesBySlug(import.meta.glob<{ rim?: unknown }>('@pins/*/meta.json', { eager: true, import: 'default' }));

function modelOf(slug: string): PinModel {
  const files = {
    'outline.json': outlines.get(slug),
    'texture.jpg': textures.get(slug),
    'normal.png': normals.get(slug),
    'meta.json': metas.get(slug),
  };
  const missing = Object.entries(files).filter(([, file]) => !file).map(([name]) => name);
  if (missing.length) throw new Error(`Pin "${slug}" has no ${missing.join(', ')}: run npm run process-pin -- ${slug}`);
  const rim = files['meta.json']!.rim;
  if (rim !== 'gold' && rim !== 'silver') {
    throw new Error(`Pin "${slug}" has rim ${JSON.stringify(rim)} in meta.json: use "gold" or "silver"`);
  }
  return { outline: files['outline.json']!, texture: files['texture.jpg']!, normal: files['normal.png']!, rim };
}

/** Code-point order, independent of the build machine's locale. */
const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
/** Older first; imprecise dates count as their earliest day. */
const byDay = (a: CatalogPin, b: CatalogPin) => compareText(earliestDay(a.date), earliestDay(b.date));
const bySlug = (a: CatalogPin, b: CatalogPin) => compareText(a.slug, b.slug);

// ---- Globe (ticket 07): cafes and the tour route ---------------------------------------------

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

function globeOf(newestFirst: CatalogPin[]): Pick<Catalog, 'cafes' | 'route'> {
  // Imprecise dates count as their earliest day, ties go by slug (as everywhere else).
  const chronological = [...newestFirst].sort((a, b) => byDay(a, b) || bySlug(a, b));
  const byCoordinates = new Map<string, Cafe>();
  const route: Cafe[] = [];
  for (const pin of chronological) {
    const { lat, lng } = pin.entry.data;
    const key = `${lat},${lng}`;
    let cafe = byCoordinates.get(key);
    if (!cafe) {
      const { slug: id, city, cafeName, countryCode, countryName } = pin;
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

/** Alphabetical order for names a visitor reads (`Zürich` next to `Zurich`, not after `Zz`). */
const byName = (a: string, b: string) => a.localeCompare(b, 'en');

// ---- end Globe ------------------------------------------------------------------------------

export async function getCatalog(): Promise<Catalog> {
  return createCatalog(await getCollection('pins'));
}
