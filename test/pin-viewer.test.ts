import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { HTMLElement } from 'node-html-parser';
import { buildSite, buildSiteExpectingFailure, text, type BuiltSite } from './build-site';

let site: BuiltSite;
beforeAll(async () => {
  site = await buildSite('pins');
});

const fixtureOutline = (slug: string) =>
  readFile(resolve(import.meta.dirname, 'fixtures/pins', slug, 'outline.json'), 'utf8');

/** The 3D viewer in the case: it builds the model from these files in the browser. */
const viewerOf = (page: HTMLElement) => page.querySelector('main .vitrine pin-viewer');

describe('3D pin on the detail page', () => {
  it('gets the pin’s outline, texture and relief map, so the model is built in the browser', async () => {
    const viewer = viewerOf(await site.page('/pins/hamburg-2019/'));
    const outline = viewer?.getAttribute('data-outline') ?? '';
    expect(outline).toMatch(/^\/_astro\/outline\.[\w-]+\.json$/);
    expect(await site.file(outline)).toBe(await fixtureOutline('hamburg-2019'));
    expect(viewer?.getAttribute('data-texture')).toMatch(/^\/_astro\/texture\.[\w-]+\.webp$/);
    expect(viewer?.getAttribute('data-normal')).toMatch(/^\/_astro\/normal\.[\w-]+\.webp$/);
  });

  it('gives rim and back the metal from the pin’s metadata', async () => {
    expect(viewerOf(await site.page('/pins/hamburg-2019/'))?.getAttribute('data-rim')).toBe('gold');
    expect(viewerOf(await site.page('/pins/zurich-2015/'))?.getAttribute('data-rim')).toBe('silver');
  });

  it('mostly faces the visitor and now and then turns all the way round', async () => {
    expect(viewerOf(await site.page('/pins/hamburg-2019/'))?.getAttribute('data-motion')).toBe('turn');
  });

  it('shows the cut-out photo until the model is ready, and instead of it without WebGL', async () => {
    const photo = viewerOf(await site.page('/pins/zurich-2015/'))?.querySelector('img');
    expect(photo?.getAttribute('alt')).toBe('Hard Rock Cafe Zürich pin');
    expect(photo?.getAttribute('src')).toMatch(/^\/_astro\/cutout\./);
  });

  it('keeps the city as the page heading in the case', async () => {
    const page = await site.page('/pins/zurich-2015/');
    expect(text(page.querySelector('main .vitrine h1'))).toBe('Zürich');
  });
});

describe('a pin without its 3D files fails the build with a clear message', () => {
  it('names the missing files and asks for the photo processing', async () => {
    const output = await buildSiteExpectingFailure('invalid-missing-model');
    expect(output).toContain(
      'Pin "hamburg-2019" has no outline.json, normal.png, meta.json: run npm run process-pin -- hamburg-2019',
    );
  });

  it('rejects a rim metal other than gold or silver', async () => {
    const output = await buildSiteExpectingFailure('invalid-rim');
    expect(output).toContain('Pin "hamburg-2019" has rim "bronze" in meta.json: use "gold" or "silver"');
  });
});
