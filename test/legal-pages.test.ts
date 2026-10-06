import { beforeAll, describe, expect, it } from 'vitest';
import { buildSite, text, type BuiltSite } from './build-site';

let site: BuiltSite;
beforeAll(async () => {
  site = await buildSite('pins');
});

describe('imprint & privacy page', () => {
  it('is titled Imprint & privacy', async () => {
    const page = await site.page('/imprint/');
    expect(text(page.querySelector('title'))).toBe('Imprint & privacy · hochitom.rocks');
    expect(text(page.querySelector('main h1'))).toBe('Imprint & privacy');
  });

  it('has sections for the disclosure, privacy and sources', async () => {
    const headings = (await site.page('/imprint/')).querySelectorAll('main h2').map(text);
    expect(headings).toEqual(['Who runs this site', 'Privacy', 'Sources']);
  });

  it('names the owner and place of residence under § 25 MedienG', async () => {
    const main = text((await site.page('/imprint/')).querySelector('main'));
    expect(main).toContain('§ 25 MedienG');
    expect(main).toContain('Thomas Hochörtler');
    expect(main).toContain('Kindberg, Austria');
  });

  it('explains hosting on Netlify and that the site sets no cookies', async () => {
    const main = text((await site.page('/imprint/')).querySelector('main'));
    expect(main).toContain('Netlify');
    expect(main).toMatch(/no cookies/i);
  });

  it('credits Natural Earth and OpenStreetMap contributors', async () => {
    const main = (await site.page('/imprint/')).querySelector('main');
    expect(text(main)).toContain('Natural Earth');
    expect(text(main)).toContain('© OpenStreetMap contributors');
    const links = main?.querySelectorAll('a').map((a) => a.getAttribute('href'));
    expect(links).toContain('https://www.naturalearthdata.com/');
    expect(links).toContain('https://www.openstreetmap.org/copyright');
  });
});

describe('404 page', () => {
  it('says the page does not exist', async () => {
    const page = await site.page('/404.html');
    expect(text(page.querySelector('title'))).toBe('Page not found · hochitom.rocks');
    expect(text(page.querySelector('main h1'))).not.toBe('');
  });

  it('links back to the collection', async () => {
    const links = (await site.page('/404.html')).querySelectorAll('main a');
    expect(links.map((a) => [text(a), a.getAttribute('href')])).toContainEqual(['Back to all pins', '/']);
  });
});
