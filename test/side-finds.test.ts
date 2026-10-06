import { beforeAll, describe, expect, it } from 'vitest';
import type { HTMLElement } from 'node-html-parser';
import { buildSite, text, type BuiltSite } from './build-site';

// Fixture: the Hard Rock pin vienna-2018 and two side finds: johnny-cash-2018 (Nashville) and
// mozart-2019 (closed, at exactly the Vienna cafe's coordinates).
let site: BuiltSite;
let home: HTMLElement;
beforeAll(async () => {
  site = await buildSite('side-finds');
  home = await site.page('/');
});

const galleryPin = (slug: string) =>
  home.querySelectorAll('main li.pin').find((li) => li.querySelector('a')?.getAttribute('href') === `/pins/${slug}/`)!;

describe('side finds in the gallery', () => {
  it('shows the title instead of the city, with city and country below', () => {
    expect(text(galleryPin('johnny-cash-2018').querySelector('figcaption'))).toBe('Johnny Cash Nashville, United States');
    expect(text(galleryPin('mozart-2019').querySelector('figcaption'))).toBe('Mozart Vienna, Austria, closed');
    expect(text(galleryPin('vienna-2018').querySelector('figcaption'))).toBe('Vienna Austria');
  });

  it('names a side find in its alt text without Hard Rock Cafe', () => {
    expect(galleryPin('johnny-cash-2018').querySelector('img')?.getAttribute('alt')).toBe('Johnny Cash pin');
    expect(galleryPin('vienna-2018').querySelector('img')?.getAttribute('alt')).toBe('Hard Rock Cafe Vienna pin');
  });

  it('offers a Side finds filter after the continents; side finds keep their continent', () => {
    const buttons = home.querySelectorAll('main [aria-label="Filter pins"] button');
    expect(buttons.map(text)).toEqual(['All', 'Europe', 'North America', 'Side finds']);
    expect(galleryPin('johnny-cash-2018').getAttribute('data-continent')).toBe('North America');
    expect(galleryPin('johnny-cash-2018').getAttribute('data-kind')).toBe('side-find');
    expect(galleryPin('vienna-2018').getAttribute('data-kind')).toBe('hard-rock');
  });

  it('has no Side finds filter without side finds', async () => {
    const plain = await (await buildSite('one-pin')).page('/');
    expect(plain.querySelectorAll('main [aria-label="Filter pins"] button').map(text)).not.toContain('Side finds');
  });

  it('counts only Hard Rock pins in the intro and adds the side finds', () => {
    expect(text(home.querySelector('main .intro'))).toBe(
      'hochitom’s Hard Rock Cafe pins, collected since 2018: 1 pin from 1 country, plus 2 side finds.',
    );
  });

  it('puts only Hard Rock pins in the case', () => {
    const hero = home.querySelector('main .hero');
    const slugs = JSON.parse(hero!.getAttribute('data-pins')!).map((pin: { slug: string }) => pin.slug);
    expect(slugs).toEqual(['vienna-2018']);
  });
});

describe('side find detail page', () => {
  it('engraves the title on the plaque, with city, country and place below', async () => {
    const plaque = (await site.page('/pins/johnny-cash-2018/')).querySelector('.plaque');
    expect(text(plaque?.querySelector('.plaque-title'))).toBe('Johnny Cash');
    expect(plaque?.querySelectorAll('dt').map((dt) => [text(dt), text(dt.nextElementSibling)])).toEqual([
      ['City', 'Nashville'],
      ['Country', 'United States'],
      ['Place', 'Johnny Cash Museum'],
      ['Collected', 'June 2018'],
      ['Pin', 'Bought'],
    ]);
  });

  it('says that a closed place has closed', async () => {
    expect(text((await site.page('/pins/mozart-2019/')).querySelector('.plaque'))).toContain('This place has closed.');
  });

  it('keeps the city behind the pin and uses the title in page title and description', async () => {
    const page = await site.page('/pins/johnny-cash-2018/');
    expect(text(page.querySelector('h1'))).toBe('Nashville');
    expect(text(page.querySelector('title'))).toBe('Johnny Cash · hochitom.rocks');
    expect(page.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'The Johnny Cash pin from hochitom’s collection, brought home from United States in June 2018.',
    );
  });

  it('names neighbouring side finds by their title', async () => {
    const page = await site.page('/pins/vienna-2018/');
    expect(text(page.querySelector('a[rel="prev"]'))).toBe('Previous pin: Johnny Cash');
    expect(text(page.querySelector('a[rel="next"]'))).toBe('Next pin: Mozart');
  });

  it('has its own preview image', async () => {
    expect((await site.binary('/og/pins/johnny-cash-2018.png')).length).toBeGreaterThan(0);
  });
});

describe('side finds on the tour', () => {
  it('lists them in their year by title', async () => {
    const tour = await site.page('/tour/');
    const stops = tour.querySelectorAll('main li a').map(text);
    expect(stops).toEqual(['Mozart', 'Johnny Cash', 'Vienna']);
  });
});

interface GlobeData {
  cafes: { id: string; kind: string; name: string; place: string; pins: { slug: string; name: string }[] }[];
  route: string[];
}

describe('side finds on the map', () => {
  let map: HTMLElement;
  let data: GlobeData;
  beforeAll(async () => {
    map = await site.page('/map/');
    data = JSON.parse(map.querySelector('script#globe-data')!.textContent);
  });

  it('marks a side find apart from a cafe at the same coordinates', () => {
    const vienna = data.cafes.filter((cafe) => cafe.place.endsWith('Austria'));
    expect(vienna.map((cafe) => [cafe.kind, cafe.name, cafe.pins.map((pin) => pin.slug)])).toEqual([
      ['side-find', 'Mozart', ['mozart-2019']],
      ['hard-rock', 'Vienna', ['vienna-2018']],
    ]);
  });

  it('names a side find by its title, with place, city and country', () => {
    const cash = data.cafes.find((cafe) => cafe.name === 'Johnny Cash')!;
    expect(cash.place).toBe('Johnny Cash Museum, Nashville, United States');
    expect(cash.pins[0].name).toBe('Johnny Cash');
  });

  it('follows the route through side finds too', () => {
    const name = (id: string) => data.cafes.find((cafe) => cafe.id === id)!.name;
    expect(data.route.map(name)).toEqual(['Johnny Cash', 'Vienna', 'Mozart']);
  });

  it('counts only Hard Rock Cafes and adds the side finds', () => {
    expect(text(map.querySelector('main .lede'))).toMatch(/^Every cafe I have a pin from: 1 cafe in 1 country, plus 2 side finds\./);
  });
});
