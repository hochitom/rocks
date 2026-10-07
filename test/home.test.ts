import { beforeAll, describe, expect, it } from 'vitest';
import type { HTMLElement } from 'node-html-parser';
import { buildSite, text } from './build-site';

let home: HTMLElement;
beforeAll(async () => {
  home = await (await buildSite('pins')).page('/');
});

/** The pins in the list of all pins, in the order they appear. */
const listedPins = () => home.querySelectorAll('main ul[aria-label="All pins"] li.pin');
const listedPin = (slug: string) => listedPins().find((li) => li.querySelector('a')?.getAttribute('href') === `/pins/${slug}/`)!;
const NEWEST_FIRST = [
  '/pins/hamburg-2019/',
  '/pins/vienna-2018/',
  '/pins/prague-2015/',
  '/pins/zurich-2015/',
  '/pins/orlando-2012/',
  '/pins/orlando-2012-2/',
  '/pins/tokyo-2009/',
];

/** By name; two pins from one cafe newest first. */
const A_TO_Z = [
  '/pins/hamburg-2019/',
  '/pins/orlando-2012/',
  '/pins/orlando-2012-2/',
  '/pins/prague-2015/',
  '/pins/tokyo-2009/',
  '/pins/vienna-2018/',
  '/pins/zurich-2015/',
];

describe('all pins on the home page', () => {
  it('shows every pin in one list, A to Z, linked to its page', () => {
    expect(listedPins().map((li) => li.querySelector('a')?.getAttribute('href'))).toEqual(A_TO_Z);
    expect(text(home.querySelector('main .all-pins-head p'))).toMatch(/^7 pins, A to Z\./);
  });

  it('shows each pin as its cut-out photo with the alt text "Hard Rock Cafe <City> pin"', () => {
    const images = listedPins().map((li) => li.querySelector('img'));
    expect(images.map((img) => img?.getAttribute('alt'))).toEqual([
      'Hard Rock Cafe Hamburg pin',
      'Hard Rock Cafe Orlando pin',
      'Hard Rock Cafe Orlando pin',
      'Hard Rock Cafe Prague pin',
      'Hard Rock Cafe Tokyo pin',
      'Hard Rock Cafe Vienna pin',
      'Hard Rock Cafe Zürich pin',
    ]);
    for (const img of images) expect(img?.getAttribute('src')).toMatch(/^\/_astro\/cutout\..+\.webp$/);
  });

  it('names the city and the country under each pin', () => {
    expect(text(listedPin('hamburg-2019').querySelector('figcaption'))).toBe('Hamburg Germany');
    expect(text(listedPin('tokyo-2009').querySelector('figcaption'))).toBe('Tokyo Japan');
  });

  it('marks pins from closed cafes', () => {
    expect(text(listedPin('prague-2015').querySelector('figcaption'))).toBe('Prague Czechia, cafe closed');
    const marked = listedPins().filter((li) => text(li).includes('closed'));
    expect(marked.map((li) => li.querySelector('a')?.getAttribute('href'))).toEqual(['/pins/prague-2015/']);
  });

  it('leads to the world map and to each continent with pins, with how many pins it has', () => {
    const links = home.querySelectorAll('main .all-pins nav[aria-label="Continents on the map"] a');
    expect(links.map((a) => [text(a), a.getAttribute('href')])).toEqual([
      ['World map', '/map/'],
      ['Asia · 1', '/map/asia/'],
      ['Europe · 4', '/map/europe/'],
      ['North America · 2', '/map/north-america/'],
    ]);
  });
});

describe('intro on the home page', () => {
  it('sums up the collection in a sentence: pins, countries and the year of the first pin', () => {
    expect(text(home.querySelector('main .intro'))).toBe(
      'hochitom’s Hard Rock Cafe pins, collected since 2009: 7 pins from 6 countries.',
    );
  });
});

describe('hero: the globe, one pin at a time', () => {
  const hero = () => home.querySelector('main .hero')!;
  type HeroPin = { slug: string; cafe: string; city: string; title: string };
  const heroPins = (): HeroPin[] => JSON.parse(hero().querySelector('script#hero-pins')!.textContent);
  type GlobeData = { cafes: { id: string; name: string }[] };
  const globe = (): GlobeData => JSON.parse(hero().querySelector('script#globe-data')!.textContent);

  it('shows the newest pin without JavaScript: its photo, name, country and date, linked to its page', () => {
    const card = hero().querySelector('.hero-card')!;
    expect(card.querySelector('img')?.getAttribute('alt')).toBe('Hard Rock Cafe Hamburg pin');
    expect(text(card.querySelector('h2'))).toBe('Hard Rock Cafe Hamburg');
    expect(card.querySelector('h2 a')?.getAttribute('href')).toBe('/pins/hamburg-2019/');
    expect(text(card.querySelector('.hero-where'))).toBe('Germany · 14 June 2019');
  });

  it('writes the city huge in brass outline behind the globe, but not as a heading or for screen readers', () => {
    const city = hero().querySelector('.hero-city')!;
    expect(city.tagName).toBe('P');
    expect(text(city)).toBe('Hamburg');
    expect(city.getAttribute('aria-hidden')).toBe('true');
  });

  it('lines up every pin to travel through, newest first, each linked to its page', () => {
    const strip = hero().querySelectorAll('nav[aria-label="Travel between pins"] .hero-strip a');
    expect(strip.map((a) => a.getAttribute('href'))).toEqual(NEWEST_FIRST);
    expect(strip.map((a) => a.getAttribute('aria-current'))).toEqual(['true', undefined, undefined, undefined, undefined, undefined, undefined]);
    expect(strip[0].getAttribute('aria-label')).toBe('Hamburg, 14 June 2019');
  });

  it('keeps Older and Newer hidden until the script runs', () => {
    const steps = hero().querySelector('.hero-steps')!;
    expect(steps.hasAttribute('hidden')).toBe(true);
    expect(steps.querySelectorAll('button').map((button) => text(button))).toEqual(['Older', 'Newer']);
    expect(text(steps.querySelector('.step-count'))).toBe('1 / 7');
  });

  it('knows the cafe of every pin on the globe, so the globe can turn to it', () => {
    const cafes = new Map(globe().cafes.map((cafe) => [cafe.id, cafe.name]));
    expect(heroPins().map((pin) => [pin.slug, cafes.get(pin.cafe)])).toEqual([
      ['hamburg-2019', 'Hamburg'],
      ['vienna-2018', 'Vienna'],
      ['prague-2015', 'Prague'],
      ['zurich-2015', 'Zürich'],
      ['orlando-2012', 'Orlando'],
      ['orlando-2012-2', 'Orlando'],
      ['tokyo-2009', 'Tokyo'],
    ]);
  });
});

describe('home page with a single pin', () => {
  let single: HTMLElement;
  beforeAll(async () => {
    single = await (await buildSite('one-pin')).page('/');
  });

  it('leads only to the continents the pins come from', () => {
    const links = single.querySelectorAll('main nav[aria-label="Continents on the map"] a');
    expect(links.map(text)).toEqual(['World map', 'Europe · 1']);
  });

  it('counts in the singular', () => {
    expect(text(single.querySelector('main .intro'))).toBe(
      'hochitom’s Hard Rock Cafe pins, collected since 2023: 1 pin from 1 country.',
    );
  });
});
