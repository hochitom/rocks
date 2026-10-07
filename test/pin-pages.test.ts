import { beforeAll, describe, expect, it } from 'vitest';
import type { HTMLElement } from 'node-html-parser';
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

  it('shows the cut-out photo of the pin with a describing alt text', async () => {
    const page = await site.page('/pins/zurich-2015/');
    const photo = page.querySelector('main img');
    expect(photo?.getAttribute('alt')).toBe('Hard Rock Cafe Zürich pin');
    expect(photo?.getAttribute('src')).toMatch(/^\/_astro\//);
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

  it('shows where it sits: Home › Map › its continent › the pin', async () => {
    const steps = (await site.page('/pins/tokyo-2009/')).querySelectorAll('main nav[aria-label="Breadcrumb"] li');
    expect(steps.map(text)).toEqual(['Home', 'Map', 'Asia', 'Tokyo']);
    expect(steps.map((li) => li.querySelector('a')?.getAttribute('href'))).toEqual(['/', '/map/', '/map/asia/', undefined]);
  });

  it('renders the story from the Markdown body', async () => {
    const page = await site.page('/pins/hamburg-2019/');
    expect(page.querySelector('em')?.textContent).toBe('Elbe');
    expect(text(page)).toContain('The pin that started it all.');
  });

  it('puts my story right under the pin, before the plaque', async () => {
    const article = (await site.page('/pins/hamburg-2019/')).querySelector('main article')!;
    const parts = article.childNodes
      .filter((node) => 'getAttribute' in node)
      .map((node) => (node as HTMLElement).getAttribute('class')?.split(' ')[0]);
    expect(parts.slice(0, 3)).toEqual(['vitrine', 'story', 'details']);
    expect(text(article.querySelector('.story h2'))).toBe('My story');
  });

  it('leaves the story out when there is none', async () => {
    expect((await site.page('/pins/vienna-2018/')).querySelector('main .story')).toBeNull();
  });

  it('says where the pin stands in the collection', async () => {
    const fact = async (slug: string, label: string) => {
      const facts = (await site.page(`/pins/${slug}/`)).querySelectorAll('main .facts div');
      return text(facts.find((div) => text(div.querySelector('dt')) === label)?.querySelector('dd'));
    };
    expect(await fact('orlando-2012-2', 'In the collection')).toBe('Pin 6 of 7, and one of 2 Hard Rock pins from the United States.');
    expect(await fact('hamburg-2019', 'In the collection')).toBe('Pin 1 of 7, and the only Hard Rock pin from Germany.');
    expect(await fact('tokyo-2009', 'From the pin before')).toBe('The first pin of the collection.');
    expect(await fact('orlando-2012', 'From the pin before')).toBe('From the same cafe as the pin before, 18 July 2012.');
    expect(await fact('vienna-2018', 'From the pin before')).toMatch(/^[\d,]+ km from Prague\.$/);
    expect(await fact('hamburg-2019', 'From the pin before')).toMatch(/^[\d,]+ km from Vienna\.$/);
    expect(await fact('zurich-2015', 'The cafe')).toBe('One of 4 pins from Europe.');
    expect(await fact('prague-2015', 'The cafe')).toBe('Closed for good. One of 4 pins from Europe.');
  });

  it('draws a little map around the cafe, linked to the map and the continent', async () => {
    const page = await site.page('/pins/zurich-2015/');
    expect(page.querySelector('main svg.mini-map')?.getAttribute('aria-label')).toBe('Map around Zürich, with the alps trip drawn in');
    expect(page.querySelectorAll('main svg.mini-map circle.focus')).toHaveLength(1);
    const links = page.querySelectorAll('main .where-links a').map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/map/?pin=zurich-2015', '/map/europe/']);
  });

  it('shows the other pins of its trip in the order they were collected, itself marked', async () => {
    const page = await site.page('/pins/zurich-2015/');
    expect(text(page.querySelector('main .trip h2'))).toBe('On the same trip · Alps trip');
    const stops = page.querySelectorAll('main .trip-stops a');
    expect(stops.map((a) => a.getAttribute('href'))).toEqual(['/pins/prague-2015/', '/pins/zurich-2015/']);
    expect(stops.map((a) => a.getAttribute('aria-current'))).toEqual([undefined, 'page']);
    expect((await site.page('/pins/hamburg-2019/')).querySelector('main .trip')).toBeNull();
  });

  it('ends with more pins from its continent', async () => {
    const page = await site.page('/pins/vienna-2018/');
    expect(text(page.querySelector('main .more h2'))).toBe('More from Europe');
    expect(page.querySelectorAll('main .more li.pin a').map((a) => a.getAttribute('href'))).toEqual([
      '/pins/hamburg-2019/',
      '/pins/prague-2015/',
      '/pins/zurich-2015/',
    ]);
  });
});

describe('brass plaque', () => {
  /** The plaque's facts as [label, value] pairs. */
  async function facts(slug: string) {
    const plaque = (await site.page(`/pins/${slug}/`)).querySelector('.plaque');
    return plaque?.querySelectorAll('dt').map((dt) => [text(dt), text(dt.nextElementSibling)]);
  }

  it('is titled like the sign under an exhibit', async () => {
    const plaque = (await site.page('/pins/zurich-2015/')).querySelector('.plaque');
    expect(text(plaque?.querySelector('.plaque-title'))).toBe('Hard Rock Cafe Zürich');
  });

  it('shows only country and date when nothing else is known', async () => {
    expect(await facts('vienna-2018')).toEqual([
      ['Country', 'Austria'],
      ['Collected', 'December 2018'],
    ]);
  });

  it('names the cafe when the pin has a cafe name', async () => {
    expect(await facts('orlando-2012')).toEqual([
      ['Country', 'United States'],
      ['Cafe', 'Universal CityWalk'],
      ['Collected', '18 July 2012'],
    ]);
  });

  it('engraves how the pin was obtained and its series on one line', async () => {
    expect((await facts('hamburg-2019'))?.at(-1)).toEqual(['Pin', 'Bought · City shield']);
    expect((await facts('orlando-2012-2'))?.at(-1)).toEqual(['Pin', 'Gift · Guitar']);
    expect((await facts('tokyo-2009'))?.at(-1)).toEqual(['Pin', 'Traded']);
  });

  it('says in plain words when the cafe has closed', async () => {
    const plaque = (await site.page('/pins/prague-2015/')).querySelector('.plaque');
    expect(text(plaque)).toContain('This cafe has closed.');
    expect(text((await site.page('/pins/vienna-2018/')).querySelector('.plaque'))).not.toContain('closed');
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

  it('names the neighbouring pins with their photo and date', async () => {
    const page = await site.page('/pins/vienna-2018/');
    expect(text(page.querySelector('a[rel="prev"]'))).toBe('Older pin Prague 2015');
    expect(text(page.querySelector('a[rel="next"]'))).toBe('Newer pin Hamburg 14 June 2019');
    expect(page.querySelector('a[rel="prev"] img')?.getAttribute('src')).toMatch(/^\/_astro\/.+\.webp$/);
  });

  it('has no next pin on the newest and no previous pin on the oldest', async () => {
    expect((await site.page('/pins/hamburg-2019/')).querySelector('a[rel="next"]')).toBeNull();
    expect((await site.page('/pins/tokyo-2009/')).querySelector('a[rel="prev"]')).toBeNull();
  });
});
