import { beforeAll, describe, expect, it } from 'vitest';
import type { HTMLElement } from 'node-html-parser';
import { buildSite, text, type BuiltSite } from './build-site';

let site: BuiltSite;
let map: HTMLElement;
beforeAll(async () => {
  site = await buildSite('pins');
  map = await site.page('/map/');
});

describe('map page', () => {
  it('is titled Around the world and marks Map as the current section', () => {
    expect(text(map.querySelector('main h1'))).toBe('Around the world');
    expect(text(map.querySelector('title'))).toBe('Map · hochitom.rocks');
    const current = map.querySelectorAll('nav[aria-label="Main"] [aria-current="page"]');
    expect(current.map(text)).toEqual(['Map']);
  });

  it('says in a sentence how many cafes and countries there are', () => {
    expect(text(map.querySelector('main .lede'))).toMatch(/^Every cafe I have a pin from: 6 cafes in 6 countries\./);
  });
});

interface GlobeData {
  land: string;
  cafes: { id: string; name: string; lat: number; lng: number; pins: { slug: string; image: string }[] }[];
  route: string[];
}
/** The data the map page hands to the globe script. */
async function globeData(page: HTMLElement): Promise<GlobeData> {
  return JSON.parse(page.querySelector('script#globe-data')!.textContent);
}

describe('globe data', () => {
  it('has one marker for pins with identical coordinates, listing both pins', async () => {
    const { cafes } = await globeData(map);
    expect(cafes).toHaveLength(6);
    const orlando = cafes.filter((cafe) => cafe.name === 'Orlando');
    expect(orlando).toHaveLength(1);
    expect(orlando[0].pins.map((pin) => pin.slug)).toEqual(['orlando-2012', 'orlando-2012-2']);
    expect(orlando[0]).toMatchObject({ lat: 28.4741, lng: -81.4678 });
  });

  it('gives every pin a small cut-out photo for marker and card', async () => {
    const { cafes } = await globeData(map);
    for (const pin of cafes.flatMap((cafe) => cafe.pins)) expect(pin.image).toMatch(/^\/_astro\/.+\.webp$/);
  });

  it('follows the tour route through the cafes in the order they were visited, the same cafe not twice in a row', async () => {
    const { cafes, route } = await globeData(map);
    const city = (id: string) => cafes.find((cafe) => cafe.id === id)!.name;
    // Imprecise dates count as their earliest day (Prague 2015 = 1 Jan 2015), ties go by slug.
    expect(route.map(city)).toEqual(['Tokyo', 'Orlando', 'Prague', 'Zürich', 'Vienna', 'Hamburg']);
  });
});

describe('land dots', () => {
  /** The precomputed dots as [lat, lng] pairs. */
  async function landDots() {
    const { land } = await globeData(map);
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

describe('cafe list (shown instead of the globe without WebGL or JavaScript)', () => {
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

describe('detail page', () => {
  it('links to its cafe on the globe', async () => {
    const page = await site.page('/pins/orlando-2012-2/');
    const link = page.querySelector('main a[href="/map/?pin=orlando-2012-2"]');
    expect(text(link)).toBe('Show Orlando on the map');
  });
});

describe('tour route with a cafe visited again later', () => {
  let revisit: HTMLElement;
  beforeAll(async () => {
    revisit = await (await buildSite('revisit')).page('/map/');
  });

  it('comes back to a cafe after another one, but never lists it twice in a row', async () => {
    const { cafes, route } = await globeData(revisit);
    const city = (id: string) => cafes.find((cafe) => cafe.id === id)!.name;
    expect(cafes).toHaveLength(2);
    expect(route.map(city)).toEqual(['Vienna', 'Hamburg', 'Vienna']);
  });
});
