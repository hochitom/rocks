import { beforeAll, describe, expect, it } from 'vitest';
import type { HTMLElement } from 'node-html-parser';
import { buildSite, text } from './build-site';

// Fixture "pins": hamburg-2019 (Jun 14), vienna-2018 (Dec), prague-2015 (2015 only) and zurich-2015
// (Jan 01) on the "Alps trip", orlando-2012 and orlando-2012-2 (same cafe, Jul 18), tokyo-2009 (Mar).
let tour: HTMLElement;
beforeAll(async () => {
  tour = await (await buildSite('pins')).page('/tour/');
});

/** The year groups as they appear on the page. */
const years = () => tour.querySelectorAll('main section.year');
const year = (label: string) => years().find((group) => text(group.querySelector('h2')) === label)!;

describe('tour page', () => {
  it('is titled Tour under Home › Tour and marks Tour as the current section', () => {
    expect(text(tour.querySelector('title'))).toBe('Tour · hochitom.rocks');
    expect(tour.querySelectorAll('main nav[aria-label="Breadcrumb"] li').map(text)).toEqual(['Home', 'Tour']);
    const current = tour.querySelectorAll('nav[aria-label="Main"] [aria-current="page"]');
    expect(current.map(text)).toEqual(['Tour']);
  });

  it('sums up the tour in a sentence, with the way from cafe to cafe through the stops whose order is known', () => {
    expect(text(tour.querySelector('main .intro'))).toMatch(
      /^7 pins from 2009 to 2019: 6 countries on 3 continents, about [\d,]+ km from cafe to cafe as the crow flies\.$/,
    );
  });

  it('writes the span of years huge, as decoration', () => {
    const span = tour.querySelector('main .span')!;
    expect(text(span)).toBe('2009–2019');
    expect(span.getAttribute('aria-hidden')).toBe('true');
  });

  it('offers every year to jump to, with its number of pins', () => {
    const links = tour.querySelectorAll('main nav[aria-label="Years"] a');
    expect(links.map((a) => [text(a), a.getAttribute('href')])).toEqual([
      ['2019 1', '#year-2019'],
      ['2018 1', '#year-2018'],
      ['2015 2', '#year-2015'],
      ['2012 2', '#year-2012'],
      ['2009 1', '#year-2009'],
    ]);
  });

  it('groups the pins by year, newest year first', () => {
    expect(years().map((group) => text(group.querySelector('h2')))).toEqual(['2019', '2018', '2015', '2012', '2009']);
  });

  it('lists the stops of a year in the order they were collected, a trip under its name, pins known only by their year last', () => {
    const slugs = (label: string) => year(label).querySelectorAll('li a').map((a) => a.getAttribute('href'));
    expect(slugs('2015')).toEqual(['/pins/zurich-2015/', '/pins/prague-2015/']);
    expect(slugs('2012')).toEqual(['/pins/orlando-2012/', '/pins/orlando-2012-2/']);
    expect(year('2015').querySelectorAll('.group-label').map(text)).toEqual([
      'Alps trip 1 pin',
      'Sometime in 2015 1 pin without a date, also on the alps trip',
    ]);
  });

  it('links each city to its pin page with its photo and names its country', () => {
    const stop = year('2019').querySelector('li')!;
    expect(text(stop.querySelector('a'))).toBe('Hamburg');
    expect(stop.querySelector('a')?.getAttribute('href')).toBe('/pins/hamburg-2019/');
    expect(stop.querySelector('img')?.getAttribute('src')).toMatch(/^\/_astro\/.+\.webp$/);
    expect(text(stop)).toContain('Germany');
  });

  it('shows the date within the year as far as it is known', () => {
    const when = (label: string) => year(label).querySelectorAll('.stops li').map((li) => text(li.querySelector('time')));
    expect(when('2019')).toEqual(['Jun 14']);
    expect(when('2018')).toEqual(['Dec']);
    expect(when('2015')).toEqual(['Jan 01']);
    expect(year('2009').querySelector('time')?.getAttribute('datetime')).toBe('2009-03');
  });

  it('gives the way from the stop before, but none for the first, for a second pin from the same cafe or for a pin known only by its year', () => {
    const leg = (slug: string) => {
      const li = tour.querySelectorAll('main li').find((item) => item.querySelector(`a[href="/pins/${slug}/"]`));
      return text(li?.querySelector('.leg'));
    };
    expect(leg('tokyo-2009')).toBe('');
    expect(leg('orlando-2012')).toMatch(/^\+ [\d,]+ km$/);
    expect(leg('orlando-2012-2')).toBe('');
    expect(leg('prague-2015')).toBe('');
    expect(leg('vienna-2018')).toMatch(/^\+ [\d,]+ km$/);
  });

  it('counts the pins of each year', () => {
    const count = (label: string) => text(year(label).querySelector('header .count'));
    expect(count('2019')).toBe('1 pin');
    expect(count('2012')).toBe('2 pins');
  });
});
