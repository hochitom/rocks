import sharp from 'sharp';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildSite, text, type BuiltSite } from './build-site';

let site: BuiltSite;
beforeAll(async () => {
  site = await buildSite('pins');
});

describe('shared layout', () => {
  it('is an English page titled after the pin', async () => {
    const page = await site.page('/pins/hamburg-2019/');
    expect(page.querySelector('html')?.getAttribute('lang')).toBe('en');
    expect(text(page.querySelector('title'))).toBe('Hamburg · hochitom.rocks');
  });

  it('links Pins, Map and Tour in the main navigation', async () => {
    const nav = (await site.page('/pins/hamburg-2019/')).querySelector('nav[aria-label="Main"]');
    const links = nav?.querySelectorAll('a').map((a) => [text(a), a.getAttribute('href')]);
    expect(links).toEqual([
      ['Pins', '/'],
      ['Map', '/map/'],
      ['Tour', '/tour/'],
    ]);
  });

  it('marks Pins as the current section on a pin page and on the home page', async () => {
    for (const path of ['/pins/hamburg-2019/', '/']) {
      const current = (await site.page(path)).querySelectorAll('nav[aria-label="Main"] [aria-current="page"]');
      expect(current.map(text)).toEqual(['Pins']);
    }
  });

  it('uses the plectrum pin as favicon', async () => {
    const icon = (await site.page('/pins/hamburg-2019/')).querySelector('link[rel="icon"]');
    expect(icon?.getAttribute('href')).toBe('/logo.svg');
    expect(icon?.getAttribute('type')).toBe('image/svg+xml');
  });

  it('gives iOS a 180 × 180 home-screen icon of the plectrum pin on solid velvet', async () => {
    const icon = (await site.page('/pins/hamburg-2019/')).querySelector('link[rel="apple-touch-icon"]');
    expect(icon?.getAttribute('href')).toBe('/apple-touch-icon.png');
    const png = sharp(await site.binary('/apple-touch-icon.png'));
    const { format, width, height, hasAlpha } = await png.metadata();
    expect({ format, width, height, hasAlpha }).toEqual({ format: 'png', width: 180, height: 180, hasAlpha: false });
    // The corner is velvet; between the raised index and pinky shows the plectrum's red enamel.
    const { data } = await png.raw().toBuffer({ resolveWithObject: true });
    const pixel = (x: number, y: number) => [...data.subarray((y * 180 + x) * 3, (y * 180 + x) * 3 + 3)];
    expect(pixel(2, 2)).toEqual([0x1c, 0x13, 0x15]);
    const [red, green, blue] = pixel(90, 40);
    expect(red).toBeGreaterThan(150);
    expect(Math.max(green, blue)).toBeLessThan(60);
  });

  it('shows the plectrum pin beside the site name in the header, linking home', async () => {
    const home = (await site.page('/pins/hamburg-2019/')).querySelector('header a.wordmark');
    expect(home?.getAttribute('href')).toBe('/');
    expect(home?.querySelector('img')?.getAttribute('src')).toBe('/logo.svg');
    expect(home?.querySelector('img')?.getAttribute('alt')).toBe('');
    expect(text(home)).toBe('hochitom.rocks');
  });

  it('links Pins, Map, Tour and Imprint & privacy in the footer', async () => {
    const nav = (await site.page('/pins/hamburg-2019/')).querySelector('footer nav[aria-label="Footer"]');
    expect(nav?.querySelectorAll('a').map((a) => [text(a), a.getAttribute('href')])).toEqual([
      ['Pins', '/'],
      ['Map', '/map/'],
      ['Tour', '/tour/'],
      ['Imprint & privacy', '/imprint/'],
    ]);
  });
});
