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
});
