/**
 * Which of the map's country shapes (Natural Earth via `world-atlas`, keyed by ISO 3166-1 numeric)
 * I have been to. Worked out at build time from the places' country codes, so a cafe right on a
 * border (Niagara Falls) or a coast counts for its own country.
 */
import countries from 'i18n-iso-countries';

/** The map ids of the countries with these ISO 3166-1 alpha-2 codes. */
export function countriesAt(places: { countryCode: string }[]): string[] {
  const ids = new Set<string>();
  for (const { countryCode } of places) {
    const id = countries.alpha2ToNumeric(countryCode);
    if (id) ids.add(id);
  }
  return [...ids].sort();
}
