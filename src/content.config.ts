import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { isCountryCode } from './lib/countries';
import { isPinDate } from './lib/pin-date';
import { PIN_KINDS } from './lib/pin-kind';
import { PIN_ORIGINS } from './lib/pin-origin';
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
  schema: z
    .object({
      kind: z.enum(PIN_KINDS).default('hard-rock'),
      title: z.string().min(1).optional(),
      city: z.string({ error: 'Every pin needs a city' }).min(1),
      country: countryCode,
      lat: z.number({ error: 'Every pin needs a latitude (lat) as a number' }).min(-90).max(90),
      lng: z.number({ error: 'Every pin needs a longitude (lng) as a number' }).min(-180).max(180),
      date: pinDate,
      place: z.string().optional(),
      closed: z.boolean().default(false),
      series: z.string().optional(),
      origin: z.enum(PIN_ORIGINS).optional(),
    })
    .superRefine((pin, context) => {
      if (pin.kind === 'side-find' && !pin.title) {
        context.addIssue({ code: 'custom', path: ['title'], message: 'A side find needs a title: what the pin shows, e.g. Johnny Cash' });
      }
      if (pin.kind === 'hard-rock' && pin.title) {
        context.addIssue({
          code: 'custom',
          path: ['title'],
          message: 'Only a side find has a title: add kind: side-find, or remove the title from this Hard Rock pin',
        });
      }
    }),
});

export const collections = { pins };
