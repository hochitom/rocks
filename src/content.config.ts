import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { isCountryCode } from './lib/countries';
import { isPinDate } from './lib/pin-date';
import { PINS_DIR } from './pins-dir.mjs';

/**
 * `YYYY`, `YYYY-MM` or `YYYY-MM-DD`. YAML reads unquoted `2019-06-14` as a Date and `2015` as a
 * number, so both are turned back into the text the collector wrote.
 */
const pinDate = z.preprocess(
  (value) => {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value === 'number') return String(value);
    return value;
  },
  z
    .string({ error: 'Every pin needs a date: YYYY, YYYY-MM or YYYY-MM-DD' })
    .refine(isPinDate, { error: (issue) => `"${issue.input}" is not a valid date: use YYYY, YYYY-MM or YYYY-MM-DD` }),
);

const countryCode = z.string({ error: 'Every pin needs a country code, e.g. DE, IS, US' }).refine(isCountryCode, {
  error: (issue) => `"${issue.input}" is not a known ISO 3166-1 alpha-2 country code (e.g. DE, IS, US)`,
});

const pins = defineCollection({
  loader: glob({ pattern: '*.md', base: PINS_DIR }),
  schema: z.object({
    city: z.string({ error: 'Every pin needs a city' }).min(1),
    country: countryCode,
    lat: z.number({ error: 'Every pin needs a latitude (lat) as a number' }).min(-90).max(90),
    lng: z.number({ error: 'Every pin needs a longitude (lng) as a number' }).min(-180).max(180),
    date: pinDate,
    cafeName: z.string().optional(),
    closed: z.boolean().default(false),
    series: z.string().optional(),
    origin: z.enum(['bought', 'traded', 'gift']).optional(),
  }),
});

export const collections = { pins };
