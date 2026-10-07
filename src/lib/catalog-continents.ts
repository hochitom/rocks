// The continent pages' part of the Katalog: one page per continent I have pins from. Pages get it via `getCatalog()`.
import type { Cafe } from './catalog-globe';
import type { CatalogPin, MissingPin } from './catalog';
import { CONTINENTS, continentOf, type Continent } from './countries';

/** A continent with its pins, the cafes they come from and the cafes I left without one. */
export interface ContinentPage {
  continent: Continent;
  /** URL segment: `europe`, `north-america`. */
  slug: string;
  /** In gallery order: newest first. */
  pins: CatalogPin[];
  /** Every cafe (and side find's place) of these pins, as on the map. */
  cafes: Cafe[];
  /** Cafes there I left without a pin, in the order of the catalog's unfinished business. */
  missingPins: MissingPin[];
  /** Countries the Hard Rock pins come from. */
  countries: number;
}

export const continentSlug = (continent: Continent): string => continent.toLowerCase().replace(/ /g, '-');

/** One page per continent with pins, alphabetically. */
export function continentPagesOf(pins: CatalogPin[], cafes: Cafe[], missingPins: MissingPin[]): ContinentPage[] {
  return CONTINENTS.filter((continent) => pins.some((pin) => pin.continent === continent)).map((continent) => {
    const here = pins.filter((pin) => pin.continent === continent);
    return {
      continent,
      slug: continentSlug(continent),
      pins: here,
      cafes: cafes.filter((cafe) => continentOf(cafe.countryCode) === continent),
      missingPins: missingPins.filter((missing) => continentOf(missing.countryCode) === continent),
      countries: new Set(here.filter((pin) => pin.kind === 'hard-rock').map((pin) => pin.countryCode)).size,
    };
  });
}
