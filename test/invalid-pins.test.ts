import { describe, expect, it } from 'vitest';
import { buildSiteExpectingFailure } from './build-site';

describe('an invalid pin fails the build with a clear message', () => {
  it('names the pin and asks for a date when the date is missing', async () => {
    const output = await buildSiteExpectingFailure('invalid-missing-date');
    expect(output).toContain('hamburg-2019');
    expect(output).toContain('Every pin needs a date: YYYY, YYYY-MM or YYYY-MM-DD');
  });

  it('rejects a date that is not a real year, month and day', async () => {
    const output = await buildSiteExpectingFailure('invalid-date');
    expect(output).toContain('hamburg-2019');
    expect(output).toContain('"2019-13" is not a valid date: use YYYY, YYYY-MM or YYYY-MM-DD');
  });

  it('rejects an unknown country code', async () => {
    const output = await buildSiteExpectingFailure('invalid-country');
    expect(output).toContain('hamburg-2019');
    expect(output).toContain('"XY" is not a known ISO 3166-1 alpha-2 country code (e.g. DE, IS, US)');
  });

  it('asks a side find for its title', async () => {
    const output = await buildSiteExpectingFailure('invalid-side-find-without-title');
    expect(output).toContain('vienna-2018');
    expect(output).toContain('A side find needs a title: what the pin shows, e.g. Johnny Cash');
  });

  it('rejects a title on a Hard Rock pin', async () => {
    const output = await buildSiteExpectingFailure('invalid-hard-rock-with-title');
    expect(output).toContain('vienna-2018');
    expect(output).toContain('Only a side find has a title: add kind: side-find, or remove the title from this Hard Rock pin');
  });

  it('asks for the photo processing when a pin has no cut-out photo', async () => {
    const output = await buildSiteExpectingFailure('invalid-missing-cutout');
    expect(output).toContain('Pin "hamburg-2019" has no cutout.png: run npm run process-pin -- hamburg-2019');
  });

  it('asks a missing pin for the date of the visit', async () => {
    const output = await buildSiteExpectingFailure('invalid-missing-pin-date');
    expect(output).toContain('praha-2008');
    expect(output).toContain('Every missing pin needs the date of the visit: YYYY, YYYY-MM or YYYY-MM-DD');
  });

  it('asks to delete a missing pin once there is a pin from that cafe', async () => {
    const output = await buildSiteExpectingFailure('invalid-missing-pin-has-pin');
    expect(output).toContain(
      'Missing pin "vienna-2015" is the cafe of pin "vienna-2018" (Vienna): you have a pin from there now, delete missing/vienna-2015.md',
    );
  });
});
