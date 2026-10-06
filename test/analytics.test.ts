import { describe, expect, it } from 'vitest';
import { buildSite, text } from './build-site';

const beacon = 'script[src="https://static.cloudflareinsights.com/beacon.min.js"]';

describe('Cloudflare Web Analytics', () => {
  it('adds the beacon with the token to every page when CLOUDFLARE_ANALYTICS_TOKEN is set', async () => {
    const site = await buildSite('pins', { CLOUDFLARE_ANALYTICS_TOKEN: 'test-token-123' });
    for (const path of ['/', '/pins/hamburg-2019/', '/imprint/', '/404.html']) {
      const script = (await site.page(path)).querySelector(beacon);
      expect(script, path).not.toBeNull();
      expect(JSON.parse(script?.getAttribute('data-cf-beacon') ?? '{}')).toEqual({ token: 'test-token-123' });
    }
    const privacy = text((await site.page('/imprint/')).querySelector('main'));
    expect(privacy).toContain('Cloudflare Web Analytics');
    expect(privacy).toMatch(/no cookies/i);
  });

  it('leaves the beacon out when no token is set', async () => {
    const site = await buildSite('pins');
    for (const path of ['/', '/pins/hamburg-2019/', '/imprint/', '/404.html']) {
      expect((await site.page(path)).querySelector('script[src*="cloudflareinsights"]'), path).toBeNull();
    }
  });

  it('does not mention Cloudflare in the privacy section when no token is set', async () => {
    const site = await buildSite('pins');
    const privacy = text((await site.page('/imprint/')).querySelector('main'));
    expect(privacy).not.toContain('Cloudflare');
    expect(privacy).toContain('Netlify');
  });
});
