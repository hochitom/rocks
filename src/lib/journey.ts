// Distances and days between the places I have been to, for the pin page and the tour.
import { geoDistance } from 'd3-geo';
import type { PinDate } from './pin-date';

const EARTH_RADIUS_KM = 6371;

/** Kilometres as the crow flies, rounded. */
export const kmBetween = (a: { lat: number; lng: number }, b: { lat: number; lng: number }): number =>
  Math.round(geoDistance([a.lng, a.lat], [b.lng, b.lat]) * EARTH_RADIUS_KM);

/** "1,013 km". */
export const formatKm = (km: number): string => `${km.toLocaleString('en')} km`;

/** Days from `a` to `b`, if both dates name a day; otherwise unknown. */
export function daysBetween(a: PinDate, b: PinDate): number | undefined {
  if (a.length !== 10 || b.length !== 10) return undefined;
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/** Only the year is known (`2018`): the order within that year is unknown. */
export const onlyYear = (date: PinDate): boolean => /^\d{4}$/.test(date);
