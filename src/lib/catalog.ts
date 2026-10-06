import type { ImageMetadata } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
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

export type { RimMetal } from './rim-metal';
export type { PinKind } from './pin-kind';
export type { PinOrigin } from './pin-origin';
export type { Cafe } from './catalog-globe';

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
  /** Timeline: newest year first, within a year oldest first; imprecise dates count as their earliest day, ties go by slug. */
  tour: TourYear[];
  neighbours(slug: string): Neighbours;
}

export function createCatalog(entries: CollectionEntry<'pins'>[]): Catalog {
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
  if (!isRimMetal(rim)) {
    throw new Error(`Pin "${slug}" has rim ${JSON.stringify(rim)} in meta.json: use "gold" or "silver"`);
  }
  return { outline: files['outline.json']!, texture: files['texture.jpg']!, normal: files['normal.png']!, rim };
}

export async function getCatalog(): Promise<Catalog> {
  return createCatalog(await getCollection('pins'));
}
