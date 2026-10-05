import { beforeAll, describe, expect, it } from 'vitest';
import { buildSite, text, type BuiltSite } from './build-site';

let site: BuiltSite;
beforeAll(async () => {
  site = await buildSite('pins');
});

describe('pin detail page', () => {
  it('exists under /pins/<slug> and shows the city as heading', async () => {
    const page = await site.page('/pins/hamburg-2019/');
    expect(text(page.querySelector('h1'))).toBe('Hamburg');
  });

  it('shows the English country name derived from the country code', async () => {
    expect(text(await site.page('/pins/hamburg-2019/'))).toContain('Germany');
    expect(text(await site.page('/pins/prague-2015/'))).toContain('Czechia');
    expect(text(await site.page('/pins/orlando-2012/'))).toContain('United States');
  });

  it('shows the date as precisely as it is known', async () => {
    expect(text((await site.page('/pins/hamburg-2019/')).querySelector('time'))).toBe('14 June 2019');
    expect(text((await site.page('/pins/vienna-2018/')).querySelector('time'))).toBe('December 2018');
    expect(text((await site.page('/pins/prague-2015/')).querySelector('time'))).toBe('2015');
    expect((await site.page('/pins/tokyo-2009/')).querySelector('time')?.getAttribute('datetime')).toBe('2009-03');
  });

  it('renders the story from the Markdown body', async () => {
    const page = await site.page('/pins/hamburg-2019/');
    expect(page.querySelector('em')?.textContent).toBe('Elbe');
    expect(text(page)).toContain('The pin that started it all.');
  });
});

describe('previous and next pin', () => {
  /** Follows the "Previous pin" links from `start` and collects the slugs on the way. */
  async function walkBack(start: string): Promise<string[]> {
    const slugs = [start];
    for (;;) {
      const page = await site.page(`/pins/${slugs.at(-1)}/`);
      const href = page.querySelector('a[rel="prev"]')?.getAttribute('href');
      if (!href) return slugs;
      slugs.push(href.match(/^\/pins\/([^/]+)\/$/)![1]);
    }
  }

  it('walks through all pins from newest to oldest; imprecise dates count as their earliest day, ties go by slug', async () => {
    expect(await walkBack('hamburg-2019')).toEqual([
      'hamburg-2019',
      'vienna-2018',
      'prague-2015',
      'zurich-2015',
      'orlando-2012',
      'orlando-2012-2',
      'tokyo-2009',
    ]);
  });

  it('names the neighbouring pins in plain sentences', async () => {
    const page = await site.page('/pins/vienna-2018/');
    expect(text(page.querySelector('a[rel="prev"]'))).toBe('Previous pin: Prague');
    expect(text(page.querySelector('a[rel="next"]'))).toBe('Next pin: Hamburg');
  });

  it('has no next pin on the newest and no previous pin on the oldest', async () => {
    expect((await site.page('/pins/hamburg-2019/')).querySelector('a[rel="next"]')).toBeNull();
    expect((await site.page('/pins/tokyo-2009/')).querySelector('a[rel="prev"]')).toBeNull();
  });
});
