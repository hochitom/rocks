import { beforeAll, describe, expect, it } from 'vitest';
import type { HTMLElement } from 'node-html-parser';
import { buildSite, text } from './build-site';

// Fixture "pins": 7 pins from 2009 to 2019; hamburg-2019 bought, tokyo-2009 traded, orlando-2012-2 a gift.
// The only two pins in a row whose day is known (prague-2015 counts by its year only, vienna-2018 by its
// month): orlando-2012 (2012-07-18) and zurich-2015 (2015-01-01), 897 days apart.
let footer: HTMLElement;
beforeAll(async () => {
  footer = (await (await buildSite('pins')).page('/')).querySelector('footer')!;
});

const facts = () =>
  footer.querySelectorAll('.facts li').map((li) => [
    text(li.querySelector('.value')),
    text(li.querySelector('.unit')),
    text(li.querySelector('.label')),
  ]);

describe('footer', () => {
  it('draws the whole tour as one line across the world, captioned with its years', () => {
    const map = footer.querySelector('figure svg')!;
    expect(map.getAttribute('role')).toBe('img');
    expect(map.getAttribute('aria-label')).toMatch(/^The whole tour as one line/);
    expect(map.querySelectorAll('circle.pin')).toHaveLength(7);
    // One arc per leg between the 6 stops whose order is known.
    expect(map.querySelectorAll('path.arc')).toHaveLength(5);
    expect(text(footer.querySelector('figcaption'))).toBe('The whole tour in one line · 2009–2019');
  });

  it('says goodbye like the end of a show', () => {
    expect(text(footer.querySelector('.good-night'))).toBe('Thank you, good night!');
    expect(footer.querySelector('img.plectrum')?.getAttribute('alt')).toBe('');
  });

  it('tallies a few stupid facts, price and weight estimated at $12 and 15–20 g a pin', () => {
    const [pins, km, ...rest] = facts();
    expect(pins).toEqual(['7', 'pins', '1 bought, 1 traded, 1 a gift']);
    expect(km).toEqual([expect.stringMatching(/^\d{2},000$/), 'km', 'from cafe to cafe']);
    expect(rest).toEqual([
      ['~€10', 'spent', '$12 a pin, about €10'],
      ['~120', 'grams', '15–20 g a pin'],
      ['897', 'days', 'the longest wait for a pin'],
    ]);
  });
});
