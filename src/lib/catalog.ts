import type { ImageMetadata } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { continentPagesOf, type ContinentPage } from './catalog-continents';
import { globeOf, type Globe } from './catalog-globe';
import { CONTINENTS, continentOf, countryName, type Continent } from './countries';
import type { PinKind } from './pin-kind';
import type { PinOrigin } from './pin-origin';
import { byDay, bySlug } from './pin-order';
import { yearOf, type PinDate } from './pin-date';
import { isRimMetal, type RimMetal } from './rim-metal';

/** A pin with everything derived from its file. */
export interface CatalogPin {
  slug: string;
  /** A Hard Rock pin (from a cafe) or a side find (from a museum, a sight …). */
  kind: PinKind;
  /** What the site calls the pin: the city for a Hard Rock pin, the title for a side find ("Johnny Cash"). */
  name: string;
  /** What a side find shows, e.g. "Johnny Cash"; Hard Rock pins have none. */
  title?: string;
  city: string;
  countryCode: string;
  countryName: string;
  continent: Continent;
  /** Where the cafe (or the place of a side find) is. */
  lat: number;
  lng: number;
  date: PinDate;
  /** The exact place: the cafe's own name if the city has more than one ("Universal CityWalk"), or where a side find is from ("Johnny Cash Museum"). */
  place?: string;
  /** The series the pin belongs to (e.g. "City shield"). */
  series?: string;
  /** How the pin came into the collection. */
  origin?: PinOrigin;
  /** The cafe (or the place of a side find) has closed for good. */
  closed: boolean;
  /** Alt text for every photo of the pin: "Hard Rock Cafe Hamburg pin", "Johnny Cash pin". */
  alt: string;
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

/** A Hard Rock Cafe I've been to without bringing a pin home. Not a pin: no photo, no page. */
export interface MissingPin {
  slug: string;
  city: string;
  countryCode: string;
  countryName: string;
  lat: number;
  lng: number;
  /** The first visit. */
  date: PinDate;
  /** The cafe's own name if the city has more than one. */
  place?: string;
  note?: string;
  /** The cafe has closed for good: this pin stays missing. */
  closed: boolean;
}

export type { RimMetal } from './rim-metal';
export type { PinKind } from './pin-kind';
export type { PinOrigin } from './pin-origin';
export type { Cafe, RouteStop } from './catalog-globe';
export type { ContinentPage } from './catalog-continents';
export { continentSlug } from './catalog-continents';

/** A stop on the tour: a pin I brought home, or a cafe I left without one. */
export type TourStop = { kind: 'pin'; pin: CatalogPin } | { kind: 'missing'; missing: MissingPin };

/** One year of the tour: the pins collected that year and the missing pins visited, in visit order. */
export interface TourYear {
  year: number;
  /** The pins collected that year (missing pins don't count). */
  pins: CatalogPin[];
  stops: TourStop[];
}

export interface Neighbours {
  /** The next older pin. */
  previous?: CatalogPin;
  /** The next newer pin. */
  next?: CatalogPin;
}

/** The size of the collection, for the intro sentence. Pins, countries and year count Hard Rock pins only. */
export interface Stats {
  pins: number;
  countries: number;
  /** The year of the oldest Hard Rock pin. */
  firstYear: number;
  sideFinds: number;
}

/** Everything the pages show, derived from the validated pins. Pages read pin data only from here. */
export interface Catalog extends Globe {
  /** Gallery order: newest first; imprecise dates count as their earliest day, ties go by slug. */
  pins: CatalogPin[];
  /** The Hard Rock pins, in gallery order: the hero picks from these. */
  hardRockPins: CatalogPin[];
  /** The continents the pins come from, alphabetically: the gallery's filter. */
  continents: Continent[];
  /** Every continent, alphabetically, including those without pins yet (a filter link may name one). */
  allContinents: Continent[];
  stats: Stats;
  /** Unfinished business: open cafes first, closed ones last; within each, the newest visit first. */
  missingPins: MissingPin[];
  /** One page per continent with pins, alphabetically: the map's continents. */
  continentPages: ContinentPage[];
  /** Timeline: newest year first, within a year oldest first; imprecise dates count as their earliest day, ties go by slug. */
  tour: TourYear[];
  neighbours(slug: string): Neighbours;
}

export function createCatalog(entries: CollectionEntry<'pins'>[], missingEntries: CollectionEntry<'missing'>[] = []): Catalog {
  const pins = entries
    .map((entry) => ({
      slug: entry.id,
      kind: entry.data.kind,
      name: entry.data.title ?? entry.data.city,
      title: entry.data.title,
      city: entry.data.city,
      countryCode: entry.data.country,
      countryName: countryName(entry.data.country),
      continent: continentOf(entry.data.country),
      lat: entry.data.lat,
      lng: entry.data.lng,
      date: entry.data.date,
      place: entry.data.place,
      series: entry.data.series,
      origin: entry.data.origin,
      closed: entry.data.closed,
      alt: entry.data.title ? `${entry.data.title} pin` : `Hard Rock Cafe ${entry.data.city} pin`,
      cutout: cutoutOf(entry.id),
      model: modelOf(entry.id),
      entry,
    }))
    .sort((a, b) => byDay(b, a) || bySlug(a, b));

  const hardRockPins = pins.filter((pin) => pin.kind === 'hard-rock');

  const missingPins: MissingPin[] = missingEntries
    .map((entry) => ({
      slug: entry.id,
      city: entry.data.city,
      countryCode: entry.data.country,
      countryName: countryName(entry.data.country),
      lat: entry.data.lat,
      lng: entry.data.lng,
      date: entry.data.date,
      place: entry.data.place,
      note: entry.data.note,
      closed: entry.data.closed,
    }))
    .sort((a, b) => Number(a.closed) - Number(b.closed) || byDay(b, a) || bySlug(a, b));
  for (const missing of missingPins) {
    const pin = hardRockPins.find((pin) => sameCafe(pin, missing));
    if (pin) {
      throw new Error(
        `Missing pin "${missing.slug}" is the cafe of pin "${pin.slug}" (${pin.city}): ` +
          `you have a pin from there now, delete missing/${missing.slug}.md`,
      );
    }
  }

  const globe = globeOf(pins, missingPins);
  return {
    pins,
    hardRockPins,
    continents: CONTINENTS.filter((continent) => pins.some((pin) => pin.continent === continent)),
    allContinents: [...CONTINENTS],
    stats: {
      pins: hardRockPins.length,
      countries: new Set(hardRockPins.map((pin) => pin.countryCode)).size,
      firstYear: Math.min(...hardRockPins.map((pin) => yearOf(pin.date))),
      sideFinds: pins.length - hardRockPins.length,
    },
    missingPins,
    tour: groupByYear(pins, missingPins),
    neighbours(slug) {
      const index = pins.findIndex((pin) => pin.slug === slug);
      if (index === -1) throw new Error(`No pin "${slug}"`);
      return { previous: pins[index + 1], next: pins[index - 1] };
    },
    ...globe,
    continentPages: continentPagesOf(pins, globe.cafes, missingPins),
  };
}

/** The same cafe: same city and same place (or neither has one), whatever the case. */
const sameCafe = (a: { city: string; place?: string }, b: { city: string; place?: string }) =>
  a.city.toLowerCase() === b.city.toLowerCase() && (a.place ?? '').toLowerCase() === (b.place ?? '').toLowerCase();

/** Groups pins and missing pins by year, newest year first; within a year they go chronologically. */
function groupByYear(pins: CatalogPin[], missingPins: MissingPin[]): TourYear[] {
  const visit = (stop: TourStop) => (stop.kind === 'pin' ? stop.pin : stop.missing);
  const stops: TourStop[] = [
    ...pins.map((pin) => ({ kind: 'pin' as const, pin })),
    ...missingPins.map((missing) => ({ kind: 'missing' as const, missing })),
  ].sort((a, b) => byDay(visit(a), visit(b)) || bySlug(visit(a), visit(b)));
  const years = new Map<number, TourYear>();
  for (const stop of stops) {
    const year = yearOf(visit(stop).date);
    if (!years.has(year)) years.set(year, { year, pins: [], stops: [] });
    const group = years.get(year)!;
    group.stops.push(stop);
    if (stop.kind === 'pin') group.pins.push(stop.pin);
  }
  return [...years.values()].sort((a, b) => b.year - a.year);
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
  if (!isRimMetal(rim)) {
    throw new Error(`Pin "${slug}" has rim ${JSON.stringify(rim)} in meta.json: use "gold" or "silver"`);
  }
  return { outline: files['outline.json']!, texture: files['texture.jpg']!, normal: files['normal.png']!, rim };
}

export async function getCatalog(): Promise<Catalog> {
  return createCatalog(await getCollection('pins'), await getCollection('missing'));
}
