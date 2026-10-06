import { beforeAll, describe, expect, it } from 'vitest';
import type { HTMLElement } from 'node-html-parser';
import { buildSite, text, type BuiltSite } from './build-site';

// Fixture: the Hard Rock pin vienna-2018 (December) and four missing pins: praha-2008, amsterdam-2018
// (April), roma-2024 (with a note) and munchen-2016 (closed, with a place).
let site: BuiltSite;
let home: HTMLElement;
beforeAll(async () => {
  site = await buildSite('missing-pins');
  home = await site.page('/');
});

describe('unfinished business on the home page', () => {
  it('lists the missing pins under the gallery, open ones first, each group newest first', () => {
    const section = home.querySelector('main section#unfinished-business');
    expect(text(section?.querySelector('h2'))).toBe('Unfinished business');
    expect(text(section?.querySelector('p'))).toBe('Cafes I’ve been to without bringing a pin home. I’ll be back.');
    expect(section?.querySelectorAll('li').map(text)).toEqual([
      'Hard Rock Cafe Roma Italy, visited May 2024 The shop had already closed for the night.',
      'Hard Rock Cafe Amsterdam Netherlands, visited April 2018',
      'Hard Rock Cafe Praha Czechia, visited 2008',
      'Hard Rock Cafe München Platzl, Germany, visited 14 July 2016, closed for good',
    ]);
  });

  it('comes after the gallery', () => {
    const sections = home.querySelectorAll('main > section').map((section) => section.getAttribute('class') ?? section.id);
    expect(sections.at(-1)).toBe('unfinished-business');
    expect(sections.indexOf('banner')).toBe(sections.length - 2);
  });

  it('leaves the intro, the gallery and the pin pages to the pins', async () => {
    expect(text(home.querySelector('main .intro'))).toBe(
      'hochitom’s Hard Rock Cafe pins, collected since 2018: 1 pin from 1 country.',
    );
    expect(home.querySelectorAll('main li.pin a').map((a) => a.getAttribute('href'))).toEqual(['/pins/vienna-2018/']);
    await expect(site.page('/pins/praha-2008/')).rejects.toThrow();
  });

  it('is not there without missing pins', async () => {
    const plain = await (await buildSite('one-pin')).page('/');
    expect(plain.querySelector('#unfinished-business')).toBeNull();
  });
});

describe('missing pins on the tour', () => {
  let tour: HTMLElement;
  beforeAll(async () => {
    tour = await site.page('/tour/');
  });

  it('puts them in their year in visit order, struck through and not linked; the count is of pins only', () => {
    const years = tour.querySelectorAll('main section.year').map((year) => [
      text(year.querySelector('h2')),
      text(year.querySelector('.count')),
      year.querySelectorAll('li').map((li) => [text(li.querySelector('del, a')), li.querySelector('del') ? 'missing' : 'pin']),
    ]);
    expect(years).toEqual([
      ['2024', 'no pin', [['Roma', 'missing']]],
      ['2018', '1 pin', [['Amsterdam', 'missing'], ['Vienna', 'pin']]],
      ['2016', 'no pin', [['München', 'missing']]],
      ['2008', 'no pin', [['Praha', 'missing']]],
    ]);
    expect(tour.querySelectorAll('main del a')).toHaveLength(0);
  });

  it('names the country and the date of the visit, like a pin', () => {
    const amsterdam = tour.querySelectorAll('main li').find((li) => text(li.querySelector('del')) === 'Amsterdam')!;
    expect(text(amsterdam)).toBe('Apr Amsterdam Netherlands');
  });
});

interface GlobeData {
  cafes: { id: string; kind: string; name: string; place: string; visited?: string; closed?: boolean; pins: unknown[] }[];
  route: string[];
}

describe('missing pins on the map', () => {
  let map: HTMLElement;
  let data: GlobeData;
  beforeAll(async () => {
    map = await site.page('/map/');
    data = JSON.parse(map.querySelector('script#globe-data')!.textContent);
  });

  it('marks each missing pin on its own, without pins, with the visit', () => {
    const missing = data.cafes.filter((cafe) => cafe.kind === 'missing');
    expect(missing.map(({ name, place, visited, closed, pins }) => ({ name, place, visited, closed, pins }))).toEqual([
      { name: 'Amsterdam', place: 'Netherlands', visited: 'April 2018', closed: false, pins: [] },
      { name: 'München', place: 'Platzl, Germany', visited: '14 July 2016', closed: true, pins: [] },
      { name: 'Praha', place: 'Czechia', visited: '2008', closed: false, pins: [] },
      { name: 'Roma', place: 'Italy', visited: 'May 2024', closed: false, pins: [] },
    ]);
  });

  it('takes the route through the missing pins too, in the order I was there', () => {
    const name = (id: string) => data.cafes.find((cafe) => cafe.id === id)!.name;
    expect(data.route.map(name)).toEqual(['Praha', 'München', 'Amsterdam', 'Vienna', 'Roma']);
  });

  it('still counts only the cafes I have a pin from', () => {
    expect(text(map.querySelector('main .lede'))).toMatch(/^Every cafe I have a pin from: 1 cafe in 1 country\./);
  });

  it('lists the missing pins without the globe too, pointing to unfinished business', () => {
    const praha = map.querySelectorAll('.cafe-list > li.missing').find((li) => text(li.querySelector('strong')) === 'Praha')!;
    const lines = (li: HTMLElement) => li.querySelectorAll('p').map(text);
    expect(lines(praha)).toEqual(['Praha Czechia', 'Visited 2008, no pin yet']);
    expect(praha.querySelector('a')?.getAttribute('href')).toBe('/#unfinished-business');
    const munchen = map.querySelectorAll('.cafe-list > li.missing').find((li) => text(li.querySelector('strong')) === 'München')!;
    expect(lines(munchen)).toEqual(['München Platzl, Germany', 'Visited 14 July 2016, closed for good']);
  });
});
