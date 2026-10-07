import { beforeAll, describe, expect, it } from 'vitest';
import type { HTMLElement } from 'node-html-parser';
import { buildSite, text, type BuiltSite } from './build-site';

// Fixture "pins": hamburg-2019 (DE), vienna-2018 (AT), prague-2015 (CZ, closed), zurich-2015 (CH),
// orlando-2012 and orlando-2012-2 (US, same cafe), tokyo-2009 (JP).
let site: BuiltSite;
let home: HTMLElement;
let map: HTMLElement;
beforeAll(async () => {
  site = await buildSite('pins');
  home = await site.page('/');
  map = await site.page('/map/');
});

interface MapData {
  countries: string;
  states: string;
  visited: string[];
  cafes: { id: string; kind: string; name: string; place: string; lat: number; lng: number; pins: { slug: string; image: string }[] }[];
  order: string[];
  view: string;
}
/** The data a page hands to its map script. */
const mapData = (page: HTMLElement): MapData => JSON.parse(page.querySelector('.pin-map script.map-data')!.textContent);

describe('map page', () => {
  it('is titled Every cafe I have been to, under Home › Map, and marks Map as the current section', () => {
    expect(text(map.querySelector('main h1'))).toBe('Every cafe I have been to');
    expect(text(map.querySelector('title'))).toBe('Map · hochitom.rocks');
    expect(map.querySelectorAll('main nav[aria-label="Breadcrumb"] li').map(text)).toEqual(['Home', 'Map']);
    expect(map.querySelector('main nav[aria-label="Breadcrumb"] a')?.getAttribute('href')).toBe('/');
    const current = map.querySelectorAll('nav[aria-label="Main"] [aria-current="page"]');
    expect(current.map(text)).toEqual(['Map']);
  });

  it('says in a sentence how many cafes and countries there are', () => {
    expect(text(map.querySelector('main .lede'))).toMatch(/^6 cafes in 6 countries\./);
  });

  it('leads on to each continent with pins', () => {
    const links = map.querySelectorAll('main nav[aria-label="Continents on the map"] a');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/map/asia/', '/map/europe/', '/map/north-america/']);
  });
});

describe('map data', () => {
  it('has one marker for pins with identical coordinates, listing both pins', () => {
    const { cafes } = mapData(map);
    expect(cafes).toHaveLength(6);
    const orlando = cafes.filter((cafe) => cafe.name === 'Orlando');
    expect(orlando).toHaveLength(1);
    expect(orlando[0].pins.map((pin) => pin.slug)).toEqual(['orlando-2012', 'orlando-2012-2']);
    expect(orlando[0]).toMatchObject({ lat: 28.4741, lng: -81.4678, place: 'Universal CityWalk, United States' });
  });

  it('gives every pin a small cut-out photo for the card', () => {
    for (const pin of mapData(map).cafes.flatMap((cafe) => cafe.pins)) expect(pin.image).toMatch(/^\/_astro\/.+\.webp$/);
  });

  it('shades the countries I have been to, by their ISO numbers as in the country shapes', () => {
    // Austria, Switzerland, Czechia, Germany, Japan, United States.
    expect(mapData(map).visited).toEqual(['040', '203', '276', '392', '756', '840']);
  });

  it('steps through the cafes from the newest pin back', () => {
    const { cafes, order } = mapData(map);
    const name = (id: string) => cafes.find((cafe) => cafe.id === id)!.name;
    expect(order.map(name)).toEqual(['Hamburg', 'Vienna', 'Prague', 'Zürich', 'Orlando', 'Tokyo']);
  });

  it('serves the country shapes and the US state borders from this site', async () => {
    const { countries, states } = mapData(map);
    const world = JSON.parse(await site.file(countries));
    expect(world.type).toBe('Topology');
    expect(world.objects.countries.geometries.length).toBeGreaterThan(200);
    const us = JSON.parse(await site.file(states));
    expect(Object.keys(us.objects)).toEqual(['states']);
    expect(us.objects.states.geometries.length).toBeGreaterThanOrEqual(50);
  });
});

describe('cafe list (shown instead of the map without JavaScript)', () => {
  const cafes = () => map.querySelectorAll('main .cafe-list > li');
  const links = (cafe: HTMLElement) => cafe.querySelectorAll('a').map((a) => a.getAttribute('href'));

  it('lists every cafe once; pins with identical coordinates share one cafe', () => {
    expect(cafes()).toHaveLength(6);
    const orlando = cafes().filter((cafe) => text(cafe).includes('Orlando'));
    expect(orlando).toHaveLength(1);
    expect(links(orlando[0])).toEqual(['/pins/orlando-2012/', '/pins/orlando-2012-2/']);
  });

  it('names city, cafe and country and links each pin to its page', () => {
    const orlando = cafes().find((cafe) => text(cafe).includes('Orlando'))!;
    expect(text(orlando)).toContain('Universal CityWalk');
    expect(text(orlando)).toContain('United States');
    const hamburg = cafes().find((cafe) => text(cafe).includes('Hamburg'))!;
    expect(links(hamburg)).toEqual(['/pins/hamburg-2019/']);
    expect(text(hamburg)).toContain('14 June 2019');
  });
});

describe('continent pages', () => {
  let europe: HTMLElement;
  beforeAll(async () => {
    europe = await site.page('/map/europe/');
  });

  it('exist for each continent with pins and no other', async () => {
    for (const slug of ['asia', 'europe', 'north-america']) await expect(site.page(`/map/${slug}/`)).resolves.toBeTruthy();
    await expect(site.page('/map/africa/')).rejects.toThrow();
  });

  it('are titled by the continent, under Home › Map › continent', () => {
    expect(text(europe.querySelector('main h1'))).toBe('Europe');
    expect(text(europe.querySelector('title'))).toBe('Europe · hochitom.rocks');
    const steps = europe.querySelectorAll('main nav[aria-label="Breadcrumb"] li');
    expect(steps.map(text)).toEqual(['Home', 'Map', 'Europe']);
    expect(steps.map((li) => li.querySelector('a')?.getAttribute('href'))).toEqual(['/', '/map/', undefined]);
  });

  it('sum up the continent in a sentence', () => {
    expect(text(europe.querySelector('main .lede'))).toBe('4 pins from 4 countries, collected since 2015.');
  });

  it('show only the continent’s pins, newest first, each tied to its cafe on the map', () => {
    const pins = europe.querySelectorAll('main ul[aria-label="Pins from Europe"] li.pin');
    expect(pins.map((li) => li.querySelector('a')?.getAttribute('href'))).toEqual([
      '/pins/hamburg-2019/',
      '/pins/vienna-2018/',
      '/pins/prague-2015/',
      '/pins/zurich-2015/',
    ]);
    const ids = new Set(mapData(europe).cafes.map((cafe) => cafe.id));
    for (const li of pins) expect(ids.has(li.getAttribute('data-cafe')!)).toBe(true);
  });

  it('put only the continent’s cafes on the map, fitted to them, but shade every country I have been to', () => {
    const data = mapData(europe);
    expect(data.cafes.map((cafe) => cafe.name)).toEqual(['Hamburg', 'Prague', 'Vienna', 'Zürich']);
    expect(data.view).toBe('fit');
    expect(data.visited).toEqual(mapData(map).visited);
  });

  it('sum up a continent with pins from a single year', async () => {
    const america = await site.page('/map/north-america/');
    expect(text(america.querySelector('main .lede'))).toBe('2 pins from 1 country, all from 2012.');
  });
});

describe('detail page', () => {
  it('links to its cafe on the map', async () => {
    const page = await site.page('/pins/orlando-2012-2/');
    const link = page.querySelector('main a[href="/map/?pin=orlando-2012-2"]');
    expect(text(link)).toBe('Show Orlando on the map');
  });
});

interface GlobeData {
  land: string;
  cafes: { id: string; name: string; lat: number; lng: number; pins: { slug: string; image: string }[] }[];
  route: string[];
}
/** The data the home page hands to the globe script. */
const globeData = (page: HTMLElement): GlobeData => JSON.parse(page.querySelector('script#globe-data')!.textContent);

describe('globe in the hero', () => {
  it('has one marker for pins with identical coordinates', () => {
    const orlando = globeData(home).cafes.filter((cafe) => cafe.name === 'Orlando');
    expect(orlando.map((cafe) => cafe.pins.map((pin) => pin.slug))).toEqual([['orlando-2012', 'orlando-2012-2']]);
  });

  it('follows the tour route through the cafes in the order they were visited, the same cafe not twice in a row', () => {
    const { cafes, route } = globeData(home);
    const city = (id: string) => cafes.find((cafe) => cafe.id === id)!.name;
    // Imprecise dates count as their earliest day (Prague 2015 = 1 Jan 2015), ties go by slug.
    expect(route.map(city)).toEqual(['Tokyo', 'Orlando', 'Prague', 'Zürich', 'Vienna', 'Hamburg']);
  });
});

describe('land dots', () => {
  /** The precomputed dots as [lat, lng] pairs. */
  async function landDots() {
    const { land } = globeData(home);
    const flat: number[] = JSON.parse(await site.file(land));
    return Array.from({ length: flat.length / 2 }, (_, i) => [flat[2 * i], flat[2 * i + 1]]);
  }

  it('are precomputed at build time into a compact list of coordinates', async () => {
    const dots = await landDots();
    // A 1.25° grid holds ≈ 26,000 dots; land is a bit less than a third of the Earth.
    expect(dots.length).toBeGreaterThan(5_000);
    expect(dots.length).toBeLessThan(10_000);
    for (const [lat, lng] of dots) {
      expect(Math.abs(lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(lng)).toBeLessThanOrEqual(180);
    }
  });

  it('lie on land, not in the sea', async () => {
    const dots = await landDots();
    const near = (lat: number, lng: number) => dots.some(([a, b]) => Math.abs(a - lat) < 1 && Math.abs(b - lng) < 1.5);
    expect(near(50, 10)).toBe(true); // Germany
    expect(near(-25, 135)).toBe(true); // Australia
    expect(near(0, -30)).toBe(false); // Atlantic
    expect(near(-40, -140)).toBe(false); // Pacific
  });
});

describe('tour route with a cafe visited again later', () => {
  it('comes back to a cafe after another one, but never lists it twice in a row', async () => {
    const revisit = await (await buildSite('revisit')).page('/');
    const { cafes, route } = globeData(revisit);
    const city = (id: string) => cafes.find((cafe) => cafe.id === id)!.name;
    expect(cafes).toHaveLength(2);
    expect(route.map(city)).toEqual(['Vienna', 'Hamburg', 'Vienna']);
  });
});
