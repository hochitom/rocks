/**
 * `npm run new-pin`: asks for a new pin's details, looks up its coordinates on OpenStreetMap Nominatim,
 * writes `src/content/pins/<slug>.md`, copies the photo in and starts the photo processing.
 *
 * Environment (for tests): HOCHITOM_PINS_DIR (pins directory), HOCHITOM_NOMINATIM_URL (place search),
 * HOCHITOM_PROCESS_PIN (photo processing executable, called as `<exe> --pins-dir <dir> <slug>`).
 */
import { spawn } from 'node:child_process';
import { copyFile, mkdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { countryName, isCountryCode } from '../src/lib/countries.ts';
import { isPinDate } from '../src/lib/pin-date.ts';
import { PIN_ORIGINS } from '../src/lib/pin-origin.ts';

const root = resolve(import.meta.dirname, '..');
const pinsDir = resolve(root, process.env.HOCHITOM_PINS_DIR ?? 'src/content/pins');
const nominatimUrl = process.env.HOCHITOM_NOMINATIM_URL ?? 'https://nominatim.openstreetmap.org';
const userAgent = 'hochitom.rocks new-pin (hochitom@me.com)';
const PHOTO_EXTENSIONS = ['.heic', '.heif', '.jpg', '.jpeg'];

// --- Asking -------------------------------------------------------------------------------------------

class InputEnded extends Error {}

// The async iterator buffers lines, so answers piped in all at once are not lost while a search runs.
const readline = createInterface({ input: process.stdin, output: process.stdout });
const lines = readline[Symbol.asyncIterator]();
let inputClosed = false;
readline.on('close', () => (inputClosed = true));

async function ask(question: string): Promise<string> {
  // Piped input may be read completely (and readline closed) while answers are still buffered.
  if (inputClosed) {
    process.stdout.write(question + ' ');
  } else {
    readline.setPrompt(question + ' ');
    readline.prompt();
  }
  const line = await lines.next();
  if (line.done) throw new InputEnded();
  if (!process.stdin.isTTY) process.stdout.write('\n');
  return line.value.trim();
}

/** Asks until `parse` accepts the answer; `parse` returns the value or throws the explanation. */
async function askUntilValid<T>(question: string, parse: (answer: string) => T): Promise<T> {
  for (;;) {
    const answer = await ask(question);
    try {
      return parse(answer);
    } catch (error) {
      console.log(`  ${(error as Error).message}`);
    }
  }
}

async function askYesNo(question: string, defaultAnswer: boolean): Promise<boolean> {
  return askUntilValid(`${question} [${defaultAnswer ? 'Y/n' : 'y/N'}]`, (answer) => {
    if (answer === '') return defaultAnswer;
    if (/^y(es)?$/i.test(answer)) return true;
    if (/^no?$/i.test(answer)) return false;
    throw new Error('Please answer y or n.');
  });
}

function coordinate(name: string, limit: number) {
  return (answer: string) => {
    const value = Number(answer.replace(',', '.'));
    if (answer === '' || !Number.isFinite(value) || Math.abs(value) > limit) {
      throw new Error(`${name} must be a number between -${limit} and ${limit}, e.g. 53.5503.`);
    }
    return value;
  };
}

// --- Place search (Nominatim) -------------------------------------------------------------------------

interface Place {
  name: string;
  lat: number;
  lng: number;
}

let lastSearch = 0;

/** First match on Nominatim, at most one request per second (Nominatim usage policy). */
async function searchPlace(query: string, country: string): Promise<Place | undefined> {
  const wait = lastSearch + 1000 - Date.now();
  if (wait > 0) await new Promise((done) => setTimeout(done, wait));
  const url = new URL('/search', nominatimUrl);
  url.search = new URLSearchParams({ q: query, countrycodes: country.toLowerCase(), format: 'jsonv2', limit: '1' }).toString();
  let results: { lat: string; lon: string; display_name: string }[];
  try {
    const response = await fetch(url, { headers: { 'User-Agent': userAgent, 'Accept-Language': 'en' } });
    if (!response.ok) throw new Error(`OpenStreetMap search failed: HTTP ${response.status}`);
    results = await response.json();
  } finally {
    // Counted from the answer, so two requests never reach the server within a second.
    lastSearch = Date.now();
  }
  const [first] = results;
  if (!first) return undefined;
  return { name: first.display_name, lat: round(Number(first.lat)), lng: round(Number(first.lon)) };
}

/** Four decimals: about 10 m, plenty for a cafe on a globe. */
const round = (value: number) => Math.round(value * 10_000) / 10_000;

async function askCoordinates(city: string, country: string): Promise<{ lat: number; lng: number }> {
  let query = city;
  for (;;) {
    console.log(`Searching OpenStreetMap for "${query}" in ${countryName(country)} …`);
    try {
      const place = await searchPlace(query, country);
      if (place) {
        console.log(`  Found: ${place.name}\n         ${place.lat}, ${place.lng}`);
        if (await askYesNo('Use these coordinates?', true)) return place;
        break;
      }
      console.log(`  Nothing found for "${query}".`);
    } catch (error) {
      if (error instanceof InputEnded) throw error;
      console.log(`  ${(error as Error).message}`);
    }
    query = await ask('Other search term (empty: enter coordinates yourself):');
    if (query === '') break;
  }
  return {
    lat: await askUntilValid('Latitude:', coordinate('Latitude', 90)),
    lng: await askUntilValid('Longitude:', coordinate('Longitude', 180)),
  };
}

// --- Slug ---------------------------------------------------------------------------------------------

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Letters that Unicode does not split into a base letter and a mark. */
const LETTERS: Record<string, string> = { ß: 'ss', ø: 'o', æ: 'ae', œ: 'oe', ł: 'l', đ: 'd', ð: 'd', þ: 'th', ı: 'i' };

/** `Reykjavík` → `reykjavik`, `Tromsø` → `tromso`, `New York` → `new-york`. */
const slugify = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[ßøæœłđðþı]/g, (letter) => LETTERS[letter])
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const isTaken = (slug: string) => existsSync(join(pinsDir, `${slug}.md`)) || existsSync(join(pinsDir, slug));

function proposeSlug(city: string, date: string): string {
  const base = `${slugify(city) || 'pin'}-${date.slice(0, 4)}`;
  let slug = base;
  for (let n = 2; isTaken(slug); n++) slug = `${base}-${n}`;
  return slug;
}

// --- Photo --------------------------------------------------------------------------------------------

/** A path as typed or dragged into the terminal: quotes, `\ ` escapes and `~` are undone. */
function photoPath(answer: string): string {
  let path = answer.replace(/^(['"])(.*)\1$/, '$2').replace(/\\(.)/g, '$1');
  if (path === '~' || path.startsWith('~/')) path = homedir() + path.slice(1);
  return resolve(path);
}

async function checkPhoto(answer: string): Promise<string> {
  if (answer === '') throw new Error('Every pin needs a photo: enter the path to a HEIC or JPEG file.');
  const path = photoPath(answer);
  const extension = extname(path).toLowerCase();
  if (!PHOTO_EXTENSIONS.includes(extension)) {
    throw new Error(`"${path}" is not a HEIC or JPEG photo (expected ${PHOTO_EXTENSIONS.join(', ')}).`);
  }
  const info = await stat(path).catch(() => undefined);
  if (!info?.isFile()) throw new Error(`There is no file at "${path}".`);
  return path;
}

// --- Pin file -----------------------------------------------------------------------------------------

interface Pin {
  city: string;
  country: string;
  lat: number;
  lng: number;
  date: string;
  cafeName?: string;
  closed: boolean;
  series?: string;
  origin?: string;
}

/** YAML frontmatter; text is written as JSON strings, which YAML reads as double-quoted strings. */
function pinFile(pin: Pin): string {
  const fields = Object.entries(pin)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? JSON.stringify(value) : value}`);
  return ['---', ...fields, '---', ''].join('\n');
}

const optional = (answer: string) => (answer === '' ? undefined : answer);

// --- Photo processing ---------------------------------------------------------------------------------

function processPhoto(slug: string): Promise<number> {
  const python = join(root, '.venv', 'bin', 'python');
  const [command, args] = process.env.HOCHITOM_PROCESS_PIN
    ? [process.env.HOCHITOM_PROCESS_PIN, []]
    : [python, [join(root, 'scripts', 'process-pin', 'process_pin.py')]];
  if (!process.env.HOCHITOM_PROCESS_PIN && !existsSync(python)) {
    console.log('  The photo processing is not set up yet (no .venv/): run npm run setup-python first.');
    return Promise.resolve(1);
  }
  return new Promise((done) => {
    const child = spawn(command, [...args, '--pins-dir', pinsDir, slug], { cwd: root, stdio: ['ignore', 'inherit', 'inherit'] });
    child.on('error', (error) => {
      console.log(`  ${error.message}`);
      done(1);
    });
    child.on('exit', (code) => done(code ?? 1));
  });
}

// --- The command --------------------------------------------------------------------------------------

async function main(): Promise<number> {
  console.log('New pin. Optional answers can be left empty.\n');

  const city = await askUntilValid('City:', (answer) => {
    if (answer === '') throw new Error('Every pin needs a city, e.g. Hamburg.');
    return answer;
  });
  const country = await askUntilValid('Country code (ISO 3166-1 alpha-2, e.g. DE, IS, US):', (answer) => {
    const code = answer.toUpperCase();
    if (!isCountryCode(code)) throw new Error(`"${answer}" is not a known two-letter country code, e.g. DE, IS, US.`);
    return code;
  });
  const { lat, lng } = await askCoordinates(city, country);
  const date = await askUntilValid('Date (YYYY, YYYY-MM or YYYY-MM-DD):', (answer) => {
    if (!isPinDate(answer)) {
      throw new Error(`"${answer}" is not a valid date: use YYYY, YYYY-MM or YYYY-MM-DD with a real month and day, e.g. 2019 or 2019-06-14.`);
    }
    return answer;
  });
  const cafeName = optional(await ask('Cafe name (if it differs from the city):'));
  const series = optional(await ask('Series (e.g. City Tee, Guitar):'));
  const origin = await askUntilValid(`Origin (${PIN_ORIGINS.join(', ')}):`, (answer) => {
    const value = answer.toLowerCase();
    if (value !== '' && !(PIN_ORIGINS as readonly string[]).includes(value)) throw new Error(`Origin must be one of ${PIN_ORIGINS.join(', ')}, or empty.`);
    return optional(value);
  });
  const closed = await askYesNo('Is the cafe closed?', false);
  let photo = '';
  for (;;) {
    try {
      photo = await checkPhoto(await ask('Photo (path to a .heic or .jpg file, drag it in here):'));
      break;
    } catch (error) {
      if (error instanceof InputEnded) throw error;
      console.log(`  ${(error as Error).message}`);
    }
  }
  const proposal = proposeSlug(city, date);
  const slug = await askUntilValid(`Slug [${proposal}]:`, (answer) => {
    if (answer === '') return proposal;
    if (!SLUG_PATTERN.test(answer)) throw new Error('A slug uses only a-z, 0-9 and single dashes, e.g. new-york-2019.');
    if (isTaken(answer)) throw new Error(`There is already a pin "${answer}".`);
    return answer;
  });

  const file = join(pinsDir, `${slug}.md`);
  const folder = join(pinsDir, slug);
  await writeFile(file, pinFile({ city, country, lat, lng, date, cafeName, closed, series, origin }), { flag: 'wx' });
  await mkdir(folder);
  await copyFile(photo, join(folder, `photo${extname(photo).toLowerCase()}`));
  console.log(`\nWrote ${file}\nCopied the photo to ${folder}\n\nProcessing the photo …`);

  if ((await processPhoto(slug)) !== 0) {
    console.log(
      `\nThe photo processing failed, so pin "${slug}" has no cutout.png yet and the site build will fail.\n` +
        `Fix the problem above and run: npm run process-pin -- ${slug}`,
    );
    return 1;
  }
  console.log(`\nDone: pin "${slug}". Write its story below the frontmatter in ${file}.`);
  return 0;
}

try {
  process.exitCode = await main();
} catch (error) {
  if (!(error instanceof InputEnded)) throw error;
  console.log('\nInput ended before the pin was complete; nothing was written.');
  process.exitCode = 1;
} finally {
  readline.close();
}
