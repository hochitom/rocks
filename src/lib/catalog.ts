import type { ImageMetadata } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { CONTINENTS, continentOf, countryName, type Continent } from './countries';
import { earliestDay, yearOf, type PinDate } from './pin-date';

/** A pin with everything derived from its file. */
export interface CatalogPin {
  slug: string;
  city: string;
  countryCode: string;
  countryName: string;
  continent: Continent;
  date: PinDate;
  /** The cafe has closed since. */
  closed: boolean;
  /** The cut-out photo of the pin's front (from the photo processing). */
  cutout: ImageMetadata;
  entry: CollectionEntry<'pins'>;
}

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
      closed: entry.data.closed,
      cutout: cutoutOf(entry.id),
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

/** Code-point order, independent of the build machine's locale. */
const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
/** Older first; imprecise dates count as their earliest day. */
const byDay = (a: CatalogPin, b: CatalogPin) => compareText(earliestDay(a.date), earliestDay(b.date));
const bySlug = (a: CatalogPin, b: CatalogPin) => compareText(a.slug, b.slug);

export async function getCatalog(): Promise<Catalog> {
  return createCatalog(await getCollection('pins'));
}
