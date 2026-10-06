import { execFile } from 'node:child_process';
import { chmod, cp, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { createServer, type IncomingHttpHeaders } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildSite, text } from './build-site';

const root = resolve(import.meta.dirname, '..');
const fixturePins = join(root, 'test', 'fixtures', 'pins');

interface Place {
  lat: string;
  lon: string;
  display_name: string;
}

interface SearchRequest {
  url: URL;
  headers: IncomingHttpHeaders;
  at: number;
}

/** A stand-in for Nominatim: answers each search with the next list of places. */
async function startPlaceSearch(...answers: Place[][]) {
  const requests: SearchRequest[] = [];
  const server = createServer((req, res) => {
    requests.push({ url: new URL(req.url ?? '/', 'http://localhost'), headers: req.headers, at: Date.now() });
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(answers.shift() ?? []));
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  servers.push(server);
  const { port } = server.address() as AddressInfo;
  return { url: `http://127.0.0.1:${port}`, requests };
}

const servers: ReturnType<typeof createServer>[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((done) => server.close(done))));
});

/** A temporary pins directory holding the example pins (hamburg-2019, orlando-2012, orlando-2012-2, prague-2015). */
async function examplePins() {
  const work = await mkdtemp(join(tmpdir(), 'hochitom-new-pin-'));
  const pinsDir = join(work, 'pins');
  await cp(fixturePins, pinsDir, { recursive: true });
  const photo = join(work, 'IMG_0001.HEIC');
  await writeFile(photo, 'not really a photo');
  // Stands in for the photo processing: records the call and creates the assets from an example pin.
  const processing = join(work, 'process-pin-stub.mjs');
  await writeFile(
    processing,
    `#!/usr/bin/env node
import { appendFileSync, cpSync } from 'node:fs';
const args = process.argv.slice(2);
appendFileSync(${JSON.stringify(join(work, 'processing.log'))}, JSON.stringify(args) + '\\n');
if (process.env.STUB_FAIL) { console.error('rembg exploded'); process.exit(3); }
const pinsDir = args[args.indexOf('--pins-dir') + 1];
cpSync(${JSON.stringify(join(fixturePins, 'hamburg-2019'))}, pinsDir + '/' + args.at(-1), { recursive: true });
`,
  );
  await chmod(processing, 0o755);
  return {
    pinsDir,
    photo,
    processing,
    async processingCalls(): Promise<string[][]> {
      const log = await readFile(join(work, 'processing.log'), 'utf8').catch(() => '');
      return log.trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
    },
  };
}

interface Run {
  code: number;
  output: string;
}

/**
 * Runs `npm run new-pin`'s script, typing the answers one line each. The first question, the kind,
 * is answered with `options.kind` (default: Enter, a Hard Rock pin), so `answers` start with what follows it.
 */
async function newPin(
  answers: string[],
  options: { pinsDir: string; search: string; processing: string; env?: Record<string, string>; kind?: string[] },
): Promise<Run> {
  return new Promise((done) => {
    const child = execFile(
      process.execPath,
      [join(root, 'scripts', 'new-pin.ts')],
      {
        cwd: root,
        env: {
          ...process.env,
          HOCHITOM_PINS_DIR: options.pinsDir,
          HOCHITOM_NOMINATIM_URL: options.search,
          HOCHITOM_PROCESS_PIN: options.processing,
          ...options.env,
        },
      },
      (error, stdout, stderr) => {
        done({ code: error ? Number(error.code ?? 1) : 0, output: stdout + stderr });
      },
    );
    child.stdin?.end([...(options.kind ?? ['']), ...answers].map((answer) => answer + '\n').join(''));
  });
}

const hamburg: Place = { lat: '53.550341', lon: '10.000654', display_name: 'Hamburg, Deutschland' };
const orlando: Place = { lat: '28.5421109', lon: '-81.3790304', display_name: 'Orlando, Orange County, Florida, United States' };

describe('new-pin', () => {
  it('writes a pin file with the answers and the found coordinates, then processes its photo', async () => {
    const pins = await examplePins();
    const search = await startPlaceSearch([hamburg]);

    const run = await newPin(
      [
        'Hamburg', // city
        'de', // country
        '', // coordinates found: accept
        '2019-06-14', // date
        'Hard Rock Cafe Hamburg', // cafe name (place)
        'City Tee', // series
        'bought', // origin
        'n', // closed
        pins.photo, // photo
        '', // slug: accept proposal
      ],
      { pinsDir: pins.pinsDir, search: search.url, processing: pins.processing },
    );

    expect(run.output).toContain('Hamburg, Deutschland');
    expect(run.output).toContain('53.5503, 10.0007');
    expect(run.code).toBe(0);
    expect(await readFile(join(pins.pinsDir, 'hamburg-2019-2.md'), 'utf8')).toBe(
      [
        '---',
        'city: "Hamburg"',
        'country: "DE"',
        'lat: 53.5503',
        'lng: 10.0007',
        'date: "2019-06-14"',
        'place: "Hard Rock Cafe Hamburg"',
        'closed: false',
        'series: "City Tee"',
        'origin: "bought"',
        '---',
        '',
      ].join('\n'),
    );
    expect(await readFile(join(pins.pinsDir, 'hamburg-2019-2', 'photo.heic'), 'utf8')).toBe('not really a photo');
    expect(await pins.processingCalls()).toEqual([['--pins-dir', pins.pinsDir, 'hamburg-2019-2']]);
  });

  it("builds: the new pin passes the site's schema and gets its page", async () => {
    const pins = await examplePins();
    const search = await startPlaceSearch([orlando]);

    const run = await newPin(['Orlando', 'US', 'y', '2012', '', '', '', '', pins.photo, ''], {
      pinsDir: pins.pinsDir,
      search: search.url,
      processing: pins.processing,
    });
    expect(run.code).toBe(0);

    const site = await buildSite(pins.pinsDir);
    const page = await site.page('/pins/orlando-2012-3/');
    expect(text(page.querySelector('h1'))).toContain('Orlando');
  });

  it('proposes the city and year as slug, with a suffix on collision, and lets me choose my own', async () => {
    const pins = await examplePins();
    const search = await startPlaceSearch([orlando], [orlando], [hamburg]);
    const options = { pinsDir: pins.pinsDir, search: search.url, processing: pins.processing };

    const orlandoRun = await newPin(['Orlando', 'US', '', '2012-03', '', '', '', '', pins.photo, ''], options);
    expect(orlandoRun.output).toContain('Slug [orlando-2012-3]');

    const reykjavikRun = await newPin(['Reykjavík', 'IS', '', '2023', '', '', '', '', pins.photo, ''], options);
    expect(reykjavikRun.output).toContain('Slug [reykjavik-2023]');

    const ownRun = await newPin(
      ['New York', 'US', '', '2001', '', '', '', '', pins.photo, 'hamburg-2019', 'Times Square', 'times-square-2001'],
      options,
    );
    expect(ownRun.output).toContain('Slug [new-york-2001]');
    expect(ownRun.output).toContain('There is already a pin "hamburg-2019".');
    expect(ownRun.output).toContain('A slug uses only a-z, 0-9 and single dashes');

    expect([orlandoRun.code, reykjavikRun.code, ownRun.code]).toEqual([0, 0, 0]);
    const files = await readdir(pins.pinsDir);
    expect(files).toEqual(expect.arrayContaining(['orlando-2012-3.md', 'reykjavik-2023.md', 'times-square-2001.md']));
    expect(files).not.toContain('new-york-2001.md');
    expect(await pins.processingCalls()).toEqual([
      ['--pins-dir', pins.pinsDir, 'orlando-2012-3'],
      ['--pins-dir', pins.pinsDir, 'reykjavik-2023'],
      ['--pins-dir', pins.pinsDir, 'times-square-2001'],
    ]);
  });

  it('spells special letters out in the proposed slug', async () => {
    const pins = await examplePins();
    const cities = {
      Tromsø: 'tromso',
      Łódź: 'lodz',
      Ærøskøbing: 'aeroskobing',
      'Þórshöfn': 'thorshofn',
      Straße: 'strasse',
      'Rock & Roll': 'rock-and-roll',
    };
    const search = await startPlaceSearch(...Object.keys(cities).map(() => [hamburg]));
    const options = { pinsDir: pins.pinsDir, search: search.url, processing: pins.processing };

    for (const [city, slug] of Object.entries(cities)) {
      const run = await newPin([city, 'DE', '', '2026', '', '', '', '', pins.photo, ''], options);
      expect(run.output).toContain(`Slug [${slug}-2026]`);
    }
  });

  it('writes a side find with its title and place, proposes its slug from the title, and the site builds it', async () => {
    const pins = await examplePins();
    const nashville: Place = { lat: '36.1608873', lon: '-86.7758427', display_name: 'Nashville, Tennessee, United States' };
    const search = await startPlaceSearch([nashville]);

    const run = await newPin(
      [
        '', // title missing
        'Johnny Cash', // title
        'Nashville', // city
        'US', // country
        '', // coordinates found: accept
        '2018-06', // date
        'Johnny Cash Museum', // place
        '', // series
        'bought', // origin
        '', // closed
        pins.photo, // photo
        '', // slug: accept proposal
      ],
      { pinsDir: pins.pinsDir, search: search.url, processing: pins.processing, kind: ['museum', 'side-find'] },
    );

    expect(run.code).toBe(0);
    expect(run.output).toContain('Kind must be one of hard-rock, side-find.');
    expect(run.output).toContain('Every side find needs a title');
    expect(run.output).toContain('Place (e.g. Johnny Cash Museum):');
    expect(run.output).toContain('Is the place closed?');
    expect(run.output).toContain('Slug [johnny-cash-2018]');
    expect(await readFile(join(pins.pinsDir, 'johnny-cash-2018.md'), 'utf8')).toBe(
      [
        '---',
        'kind: "side-find"',
        'title: "Johnny Cash"',
        'city: "Nashville"',
        'country: "US"',
        'lat: 36.1609',
        'lng: -86.7758',
        'date: "2018-06"',
        'place: "Johnny Cash Museum"',
        'closed: false',
        'origin: "bought"',
        '---',
        '',
      ].join('\n'),
    );

    const site = await buildSite(pins.pinsDir);
    const page = await site.page('/pins/johnny-cash-2018/');
    expect(text(page.querySelector('.plaque-title'))).toBe('Johnny Cash');
  });

  it('rejects an invalid date with an explanation and asks again', async () => {
    const pins = await examplePins();
    const search = await startPlaceSearch([hamburg]);

    const run = await newPin(
      ['Hamburg', 'DE', '', '2019-13', '14.06.2019', '2019-02-30', '2019-06', '', '', '', '', pins.photo, ''],
      { pinsDir: pins.pinsDir, search: search.url, processing: pins.processing },
    );

    expect(run.code).toBe(0);
    for (const wrong of ['2019-13', '14.06.2019', '2019-02-30']) {
      expect(run.output).toContain(`"${wrong}" is not a valid date: use YYYY, YYYY-MM or YYYY-MM-DD`);
    }
    expect(await readFile(join(pins.pinsDir, 'hamburg-2019-2.md'), 'utf8')).toContain('date: "2019-06"\n');
  });

  it('rejects other invalid answers with an explanation and asks again', async () => {
    const pins = await examplePins();
    const search = await startPlaceSearch([hamburg]);

    const run = await newPin(
      [
        '', // city missing
        'Hamburg',
        'XY',
        'Germany',
        'de',
        'maybe', // coordinates: neither yes nor no
        '',
        '2019',
        '',
        '',
        'stolen', // origin
        'traded',
        'sometimes', // closed
        'y',
        '', // photo missing
        '/nowhere/photo.heic',
        join(pins.pinsDir, 'hamburg-2019.md'),
        pins.photo,
        '',
      ],
      { pinsDir: pins.pinsDir, search: search.url, processing: pins.processing },
    );

    expect(run.code).toBe(0);
    expect(run.output).toContain('Every pin needs a city');
    expect(run.output).toContain('"XY" is not a known two-letter country code');
    expect(run.output).toContain('"Germany" is not a known two-letter country code');
    expect(run.output).toContain('Please answer y or n.');
    expect(run.output).toContain('Origin must be one of bought, traded, gift');
    expect(run.output).toContain('Every pin needs a photo');
    expect(run.output).toContain('There is no file at "/nowhere/photo.heic"');
    expect(run.output).toContain('is not a HEIC or JPEG photo');
    const file = await readFile(join(pins.pinsDir, 'hamburg-2019-2.md'), 'utf8');
    expect(file).toContain('country: "DE"\n');
    expect(file).toContain('origin: "traded"\n');
    expect(file).toContain('closed: true\n');
  });

  it('takes corrected coordinates when I reject the found ones', async () => {
    const pins = await examplePins();
    const search = await startPlaceSearch([hamburg]);

    const run = await newPin(['Hamburg', 'DE', 'n', '95', '53,5459', '9.9663', '2019', '', '', '', '', pins.photo, ''], {
      pinsDir: pins.pinsDir,
      search: search.url,
      processing: pins.processing,
    });

    expect(run.code).toBe(0);
    expect(run.output).toContain('Latitude must be a number between -90 and 90');
    const file = await readFile(join(pins.pinsDir, 'hamburg-2019-2.md'), 'utf8');
    expect(file).toContain('lat: 53.5459\nlng: 9.9663\n');
  });

  it('asks Nominatim politely: own User-Agent, the country, at most one request per second', async () => {
    const pins = await examplePins();
    const search = await startPlaceSearch([], [hamburg]);

    const run = await newPin(['Hamborg', 'DE', 'Hamburg', '', '2019', '', '', '', '', pins.photo, ''], {
      pinsDir: pins.pinsDir,
      search: search.url,
      processing: pins.processing,
    });

    expect(run.code).toBe(0);
    expect(run.output).toContain('Nothing found for "Hamborg"');
    expect(search.requests).toHaveLength(2);
    const [first, second] = search.requests;
    expect(first.url.pathname).toBe('/search');
    expect(first.url.searchParams.get('q')).toBe('Hamborg');
    expect(first.url.searchParams.get('countrycodes')).toBe('de');
    expect(second.url.searchParams.get('q')).toBe('Hamburg');
    for (const request of search.requests) {
      expect(request.headers['user-agent']).toBe('hochitom.rocks new-pin (hochitom@me.com)');
    }
    expect(second.at - first.at).toBeGreaterThanOrEqual(1000);
    // The other search term only finds the place; the city stays as I typed it.
    const file = await readFile(join(pins.pinsDir, 'hamborg-2019.md'), 'utf8');
    expect(file).toContain('city: "Hamborg"\n');
    expect(file).toContain('lat: 53.5503\nlng: 10.0007\n');
  });

  it('says clearly when the photo processing fails', async () => {
    const pins = await examplePins();
    const search = await startPlaceSearch([hamburg]);

    const run = await newPin(['Hamburg', 'DE', '', '2019', '', '', '', '', pins.photo, ''], {
      pinsDir: pins.pinsDir,
      search: search.url,
      processing: pins.processing,
      env: { STUB_FAIL: '1' },
    });

    expect(run.code).not.toBe(0);
    expect(run.output).toContain('rembg exploded');
    expect(run.output).toContain('pin "hamburg-2019-2" has no cutout.png yet and the site build will fail');
    expect(run.output).toContain('npm run process-pin -- hamburg-2019-2');
  });
});
