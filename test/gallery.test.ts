import { beforeAll, describe, expect, it } from 'vitest';
import type { HTMLElement } from 'node-html-parser';
import { buildSite, text } from './build-site';

let home: HTMLElement;
beforeAll(async () => {
  home = await (await buildSite('pins')).page('/');
});

/** The pins on the felt banner, in the order they appear. */
const galleryPins = () => home.querySelectorAll('main section[aria-label="All pins"] li.pin');
const galleryPin = (slug: string) => galleryPins().find((li) => li.querySelector('a')?.getAttribute('href') === `/pins/${slug}/`)!;

describe('gallery on the home page', () => {
  it('shows every pin newest first, linked to its page', () => {
    expect(galleryPins().map((li) => li.querySelector('a')?.getAttribute('href'))).toEqual([
      '/pins/hamburg-2019/',
      '/pins/vienna-2018/',
      '/pins/prague-2015/',
      '/pins/zurich-2015/',
      '/pins/orlando-2012/',
      '/pins/orlando-2012-2/',
      '/pins/tokyo-2009/',
    ]);
  });

  it('shows each pin as its cut-out photo with the alt text "Hard Rock Cafe <City> pin"', () => {
    const images = galleryPins().map((li) => li.querySelector('img'));
    expect(images.map((img) => img?.getAttribute('alt'))).toEqual([
      'Hard Rock Cafe Hamburg pin',
      'Hard Rock Cafe Vienna pin',
      'Hard Rock Cafe Prague pin',
      'Hard Rock Cafe Zürich pin',
      'Hard Rock Cafe Orlando pin',
      'Hard Rock Cafe Orlando pin',
      'Hard Rock Cafe Tokyo pin',
    ]);
    for (const img of images) expect(img?.getAttribute('src')).toMatch(/^\/_astro\/cutout\..+\.webp$/);
  });

  it('names the city and the country under each pin', () => {
    expect(text(galleryPin('hamburg-2019').querySelector('figcaption'))).toBe('Hamburg Germany');
    expect(text(galleryPin('tokyo-2009').querySelector('figcaption'))).toBe('Tokyo Japan');
  });

  it('marks pins from closed cafes', () => {
    expect(text(galleryPin('prague-2015').querySelector('figcaption'))).toBe('Prague Czechia, cafe closed');
    const marked = galleryPins().filter((li) => text(li).includes('closed'));
    expect(marked.map((li) => li.querySelector('a')?.getAttribute('href'))).toEqual(['/pins/prague-2015/']);
  });
});

describe('continent filter', () => {
  const filter = () => home.querySelector('main [aria-label="Filter by continent"]');

  it('offers All and the continents the pins come from, alphabetically, with All pressed', () => {
    const buttons = filter()!.querySelectorAll('button');
    expect(buttons.map(text)).toEqual(['All', 'Asia', 'Europe', 'North America']);
    expect(buttons.map((button) => button.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false', 'false']);
  });

  it('stays hidden until the script shows it, so without JavaScript every pin is visible and there is no filter', () => {
    expect(filter()?.hasAttribute('hidden')).toBe(true);
    expect(galleryPins().filter((li) => li.hasAttribute('hidden'))).toEqual([]);
  });

  it('has a sentence ready for a continent without pins, hidden at first', () => {
    const empty = home.querySelector('main section[aria-label="All pins"] .empty');
    expect(text(empty)).toBe('No pins from yet.');
    expect(empty?.hasAttribute('hidden')).toBe(true);
  });
});

describe('intro on the home page', () => {
  it('sums up the collection in a sentence: pins, countries and the year of the first pin', () => {
    expect(text(home.querySelector('main .intro'))).toMatch(
      /^hochitom’s Hard Rock Cafe pins, collected since 2009: 7 pins from 6 countries\. The one in the case is Hamburg\.$/,
    );
  });

  it('shows a pin from the collection in the case, linked to its page', () => {
    const hero = home.querySelector('main .hero');
    const img = hero?.querySelector('img');
    const link = hero?.querySelector('.intro a');
    expect(link?.getAttribute('href')).toMatch(/^\/pins\/[^/]+\/$/);
    expect(img?.getAttribute('alt')).toBe(`Hard Rock Cafe ${text(link)} pin`);
  });
});

describe('home page with a single pin', () => {
  let single: HTMLElement;
  beforeAll(async () => {
    single = await (await buildSite('one-pin')).page('/');
  });

  it('offers only the continents the pins come from', () => {
    const buttons = single.querySelectorAll('main [aria-label="Filter by continent"] button');
    expect(buttons.map(text)).toEqual(['All', 'Europe']);
  });

  it('counts in the singular', () => {
    expect(text(single.querySelector('main .intro'))).toMatch(
      /^hochitom’s Hard Rock Cafe pins, collected since 2023: 1 pin from 1 country\. The one in the case is Reykjavík\.$/,
    );
  });
});
