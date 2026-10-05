import { beforeAll, describe, expect, it } from 'vitest';
import type { HTMLElement } from 'node-html-parser';
import { buildSite, text, type BuiltSite } from './build-site';

let site: BuiltSite;
let tour: HTMLElement;
beforeAll(async () => {
  site = await buildSite('pins');
  tour = await site.page('/tour/');
});

/** The year groups as they appear on the page. */
const years = () => tour.querySelectorAll('main section.year');
const year = (label: string) => years().find((group) => text(group.querySelector('h2')) === label)!;

describe('tour page', () => {
  it('groups the pins by year, newest year first', () => {
    expect(years().map((group) => text(group.querySelector('h2')))).toEqual(['2019', '2018', '2015', '2012', '2009']);
  });

  it('lists the stops of a year in the order they were collected; imprecise dates count as their earliest day, ties go by slug', () => {
    const slugs = (label: string) => year(label).querySelectorAll('li a').map((a) => a.getAttribute('href'));
    expect(slugs('2015')).toEqual(['/pins/prague-2015/', '/pins/zurich-2015/']);
    expect(slugs('2012')).toEqual(['/pins/orlando-2012/', '/pins/orlando-2012-2/']);
  });

  it('links each city to its pin page and names its country', () => {
    const stop = year('2019').querySelector('li')!;
    expect(text(stop.querySelector('a'))).toBe('Hamburg');
    expect(stop.querySelector('a')?.getAttribute('href')).toBe('/pins/hamburg-2019/');
    expect(text(stop)).toContain('Germany');
  });

  it('shows the date within the year as far as it is known and leaves the rest empty', () => {
    const when = (label: string) => year(label).querySelectorAll('li').map((li) => text(li.querySelector('time')));
    expect(when('2019')).toEqual(['Jun 14']);
    expect(when('2018')).toEqual(['Dec']);
    expect(when('2015')).toEqual(['', 'Jan 01']);
    expect(year('2009').querySelector('time')?.getAttribute('datetime')).toBe('2009-03');
    expect(text(year('2015').querySelector('li'))).toBe('Prague Czechia');
  });

  it('counts the pins of each year', () => {
    const count = (label: string) => text(year(label).querySelector('header .count'));
    expect(count('2019')).toBe('1 pin');
    expect(count('2012')).toBe('2 pins');
  });

  it('is titled Tour and marks Tour as the current section', () => {
    expect(text(tour.querySelector('title'))).toBe('Tour · hochitom.rocks');
    const current = tour.querySelectorAll('nav[aria-label="Main"] [aria-current="page"]');
    expect(current.map(text)).toEqual(['Tour']);
  });
});
