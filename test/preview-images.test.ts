import sharp from 'sharp';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildSite, type BuiltSite } from './build-site';

let site: BuiltSite;
beforeAll(async () => {
  site = await buildSite('pins');
});

const meta = async (path: string, key: string) => {
  const page = await site.page(path);
  const tag = page.querySelector(`meta[property="${key}"]`) ?? page.querySelector(`meta[name="${key}"]`);
  return tag?.getAttribute('content');
};

/** Format and size of the built image behind an absolute image URL of the site. */
const image = async (url: string) => {
  const { origin, pathname } = new URL(url);
  expect(origin).toBe('https://hochitom.rocks');
  const { format, width, height } = await sharp(await site.file(pathname)).metadata();
  return { format, width, height };
};

const previewFormat = { format: 'png', width: 1200, height: 630 };

describe('preview images for sharing', () => {
  it('gives each pin page its own 1200 × 630 preview image', async () => {
    for (const slug of ['hamburg-2019', 'zurich-2015', 'orlando-2012-2']) {
      const path = `/pins/${slug}/`;
      const url = await meta(path, 'og:image');
      expect(url).toBe(`https://hochitom.rocks/og/pins/${slug}.png`);
      expect(await image(url!)).toEqual(previewFormat);
      expect(await meta(path, 'og:image:width')).toBe('1200');
      expect(await meta(path, 'og:image:height')).toBe('630');
      expect(await meta(path, 'twitter:card')).toBe('summary_large_image');
    }
  });

  it('gives the other pages the general 1200 × 630 preview image', async () => {
    for (const path of ['/', '/tour/', '/imprint/', '/404.html']) {
      const url = await meta(path, 'og:image');
      expect(url).toBe('https://hochitom.rocks/og/default.png');
      expect(await meta(path, 'twitter:card')).toBe('summary_large_image');
    }
    expect(await image('https://hochitom.rocks/og/default.png')).toEqual(previewFormat);
  });
});

describe('link preview texts', () => {
  const pages = ['/', '/pins/hamburg-2019/', '/pins/vienna-2018/', '/tour/', '/imprint/', '/404.html'];

  it('gives every page a title and its own description in whole sentences', async () => {
    const descriptions = new Set<string>();
    for (const path of pages) {
      const title = (await site.page(path)).querySelector('title')?.textContent;
      const description = await meta(path, 'description');
      expect(await meta(path, 'og:title'), path).toBe(title);
      expect(description, path).toMatch(/^\S.{30,200}\.$/);
      expect(await meta(path, 'og:description'), path).toBe(description);
      descriptions.add(description!);
    }
    expect(descriptions.size).toBe(pages.length);
  });

  it('describes a pin with its city, country and when it was collected', async () => {
    expect(await meta('/pins/hamburg-2019/', 'description')).toBe(
      'The Hard Rock Cafe Hamburg pin from hochitom’s collection, brought home from Germany on 14 June 2019.',
    );
    expect(await meta('/pins/vienna-2018/', 'og:description')).toContain('from Austria in December 2018.');
  });

  it('names the canonical address of the shared page', async () => {
    expect(await meta('/pins/hamburg-2019/', 'og:url')).toBe('https://hochitom.rocks/pins/hamburg-2019/');
    expect(await meta('/', 'og:url')).toBe('https://hochitom.rocks/');
  });
});
