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

  it('links Imprint & privacy in the footer', async () => {
    const link = (await site.page('/pins/hamburg-2019/')).querySelector('footer a');
    expect(text(link)).toBe('Imprint & privacy');
    expect(link?.getAttribute('href')).toBe('/imprint/');
  });
});
