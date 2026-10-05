import { getCollection, type CollectionEntry } from 'astro:content';
import { continentOf, countryName, type Continent } from './countries';
import { earliestDay, yearOf, type PinDate } from './pin-date';

/** A pin with everything derived from its file. */
export interface CatalogPin {
  slug: string;
  city: string;
  countryCode: string;
  countryName: string;
  continent: Continent;
  date: PinDate;
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

/** Everything the pages show, derived from the validated pins. Pages read pin data only from here. */
export interface Catalog {
  /** Gallery order: newest first; imprecise dates count as their earliest day, ties go by slug. */
  pins: CatalogPin[];
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
      entry,
    }))
    .sort((a, b) => compareText(earliestDay(b.date), earliestDay(a.date)) || compareText(a.slug, b.slug));

  return {
    pins,
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
    pins.sort((a, b) => compareText(earliestDay(a.date), earliestDay(b.date)) || compareText(a.slug, b.slug));
  }
  return tour;
}

/** Code-point order, independent of the build machine's locale. */
const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export async function getCatalog(): Promise<Catalog> {
  return createCatalog(await getCollection('pins'));
}
